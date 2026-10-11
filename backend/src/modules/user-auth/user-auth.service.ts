import {
    Types,
    startSession,
} from "mongoose";

import {
    hashUserPassword,
    verifyUserPassword,
} from "../users/user.service";

import {
    User,
    USER_STATUSES,
} from "../users/user.model";

import {
    createCustomer,
} from "../customers/customer.service";

import {
    PendingCustomerRegistration,
} from "./pending-customer-registration.model";

import {
    generateAccessToken,
    generateRefreshToken,
    tryVerifyRefreshToken,
} from "../../utils/token";

import {
    ApiError,
} from "../../utils/ApiError";

import {
    createSession,
    findSessionByRefreshToken,
    revokeUserSession,
    touchSession,
} from "../sessions/session.service";

import {
    UserLoginInput,
    UserTokenPair,
    UserAuthenticationResult,
} from "./user-auth.types";

import {
    assertOtpCanBeResent,
    compareOtp,
    createOtp,
    deliverOtp,
} from "../../services/otp.service";

import {
    type UserRegistrationInput,
} from "./user-auth.validator";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const ensureValidObjectId = (
    value: string,
    fieldName: string
): Types.ObjectId => {
    if (!Types.ObjectId.isValid(value)) {
        throw ApiError.badRequest(
            `Invalid ${fieldName}.`,
            {
                code:
                    "INVALID_OBJECT_ID",
            }
        );
    }

    return new Types.ObjectId(value);
};


/*
|--------------------------------------------------------------------------
| Generate Token Pair
|--------------------------------------------------------------------------
*/

const generateUserTokenPair = (
    userId: string
): UserTokenPair => {
    return {
        accessToken:
            generateAccessToken(
                userId
            ),

        refreshToken:
            generateRefreshToken(
                userId
            ),
    };
};


/*
|--------------------------------------------------------------------------
| Register Customer
|--------------------------------------------------------------------------
*/

export const registerUser = async (
    input: UserRegistrationInput
): Promise<{ registrationId: string; email: string }> => {
    const email = input.email.trim().toLowerCase();
    const phone = input.phone?.trim();

    if (await User.exists({ email })) {
        throw ApiError.conflict(
            "An account with this email already exists.",
            { code: "EMAIL_ALREADY_EXISTS" },
        );
    }

    if (phone && await User.exists({ phone })) {
        throw ApiError.conflict(
            "An account with this phone number already exists.",
            { code: "PHONE_ALREADY_EXISTS" },
        );
    }

    const pending = await PendingCustomerRegistration.findOne({
        email,
    });

    if (phone) {
        const phoneOwner =
            await PendingCustomerRegistration.findOne({
                phone,
                email: { $ne: email },
            })
                .select("_id")
                .lean()
                .exec();

        if (phoneOwner) {
            throw ApiError.conflict(
                "A pending registration already uses this phone number.",
                { code: "PHONE_ALREADY_IN_USE" },
            );
        }
    }

    const passwordHash =
        await hashUserPassword(input.password);

    if (pending) {
        assertOtpCanBeResent(
            pending.resendAvailableAt,
        );
    }

    const otp = createOtp();

    await deliverOtp({
        channel: "email",
        destination: email,
        code: otp.code,
        purpose: "email_verification",
        recipientName: input.name.trim(),
    });

    if (pending) {
        pending.name = input.name.trim();
        pending.phone = phone;
        pending.passwordHash = passwordHash;
        pending.codeHash = otp.hash;
        pending.attempts = 0;
        pending.maxAttempts = otp.maxAttempts;
        pending.expiresAt = otp.expiresAt;
        pending.resendAvailableAt =
            otp.resendAvailableAt;
        await pending.save();

        return {
            registrationId: pending._id.toString(),
            email,
        };
    }

    let registration;

    try {
        registration =
            await PendingCustomerRegistration.create({
                name: input.name.trim(),
                email,
                ...(phone ? { phone } : {}),
                passwordHash,
                codeHash: otp.hash,
                attempts: 0,
                maxAttempts: otp.maxAttempts,
                expiresAt: otp.expiresAt,
                resendAvailableAt: otp.resendAvailableAt,
            });
    } catch (error) {
        if (
            error !== null &&
            typeof error === "object" &&
            "code" in error &&
            error.code === 11000
        ) {
            throw ApiError.conflict(
                "A pending registration already exists with this email or phone number.",
                { code: "PENDING_REGISTRATION_ALREADY_EXISTS" },
            );
        }

        throw error;
    }

    return {
        registrationId: registration._id.toString(),
        email,
    };
};

/*
|--------------------------------------------------------------------------
| Complete Customer Registration
|--------------------------------------------------------------------------
*/

export const completeCustomerRegistration = async (
    input: {
        readonly registrationId: string;
        readonly email: string;
        readonly code: string;
    },
): Promise<void> => {
    const registrationId = ensureValidObjectId(
        input.registrationId,
        "registration ID",
    );
    const email = input.email.trim().toLowerCase();
    const registration =
        await PendingCustomerRegistration.findOne({
            _id: registrationId,
            email,
        }).select("+passwordHash +codeHash");

    if (!registration) {
        throw ApiError.notFound(
            "Pending registration not found. Please register again.",
            { code: "PENDING_REGISTRATION_NOT_FOUND" },
        );
    }

    if (registration.expiresAt.getTime() <= Date.now()) {
        await PendingCustomerRegistration.deleteOne({
            _id: registration._id,
        });
        throw ApiError.unauthorized(
            "Verification code has expired. Please register again.",
            { code: "OTP_EXPIRED" },
        );
    }

    if (registration.attempts >= registration.maxAttempts) {
        throw ApiError.tooManyRequests(
            "Maximum OTP verification attempts exceeded.",
            { code: "OTP_MAX_ATTEMPTS_EXCEEDED" },
        );
    }

    if (!compareOtp(input.code, registration.codeHash)) {
        const nextAttempts = registration.attempts + 1;
        await PendingCustomerRegistration.updateOne(
            {
                _id: registration._id,
            },
            {
                $inc: { attempts: 1 },
            },
        ).exec();

        if (nextAttempts >= registration.maxAttempts) {
            throw ApiError.tooManyRequests(
                "Maximum OTP verification attempts exceeded.",
                { code: "OTP_MAX_ATTEMPTS_EXCEEDED" },
            );
        }

        throw ApiError.unauthorized(
            "Invalid verification code.",
            {
                code: "INVALID_OTP",
                details: {
                    remainingAttempts:
                        registration.maxAttempts - nextAttempts,
                },
            },
        );
    }

    const session = await startSession();

    try {
        await session.withTransaction(async () => {
            const currentRegistration =
                await PendingCustomerRegistration.findOne({
                    _id: registration._id,
                    email,
                    expiresAt: { $gt: new Date() },
                })
                    .select("+passwordHash +codeHash")
                    .session(session)
                    .exec();

            if (!currentRegistration) {
                throw ApiError.notFound(
                    "Pending registration has expired or was already completed.",
                    { code: "PENDING_REGISTRATION_NOT_FOUND" },
                );
            }

            if (
                currentRegistration.attempts >=
                currentRegistration.maxAttempts
            ) {
                throw ApiError.tooManyRequests(
                    "Maximum OTP verification attempts exceeded.",
                    { code: "OTP_MAX_ATTEMPTS_EXCEEDED" },
                );
            }

            if (!compareOtp(input.code, currentRegistration.codeHash)) {
                throw ApiError.unauthorized(
                    "Invalid verification code.",
                    { code: "INVALID_OTP" },
                );
            }

            const [user] = await User.create(
                [
                    {
                        name: currentRegistration.name,
                        email: currentRegistration.email,
                        ...(currentRegistration.phone
                            ? { phone: currentRegistration.phone }
                            : {}),
                        password: currentRegistration.passwordHash,
                        status: USER_STATUSES.ACTIVE,
                        isEmailVerified: true,
                        isPhoneVerified: false,
                        failedLoginAttempts: 0,
                    },
                ],
                { session },
            );

            await createCustomer(
                { userId: user._id.toString() },
                session,
            );

            await PendingCustomerRegistration.deleteOne(
                { _id: currentRegistration._id },
                { session },
            ).exec();
        });
    } catch (error) {
        if (
            error !== null &&
            typeof error === "object" &&
            "code" in error &&
            error.code === 11000
        ) {
            throw ApiError.conflict(
                "An account already exists with this email or phone number.",
                { code: "ACCOUNT_IDENTIFIER_ALREADY_EXISTS" },
            );
        }

        throw error;
    } finally {
        await session.endSession();
    }
};

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

export const loginUser = async (
    input: UserLoginInput,
    metadata?: {
        readonly userAgent?: string;
        readonly ipAddress?: string;
        readonly deviceId?: string;
    }
): Promise<UserAuthenticationResult> => {
    const email =
        input.email
            .trim()
            .toLowerCase();

    /*
     * Password is select:false
     * in the User model.
     */
    const user =
        await User.findOne({
            email,
        }).select(
            "+password"
        );

    if (!user) {
        throw ApiError.unauthorized(
            "Invalid email or password.",
            {
                code:
                    "INVALID_CREDENTIALS",
            }
        );
    }

    /*
     * Email verification is required before customer login.
     */

    if (user.isEmailVerified !== true) {
        throw ApiError.forbidden(
            "Please verify your email before logging in.",
            {
                code: "EMAIL_VERIFICATION_REQUIRED",
            }
        );
    }

    /*
     * Account status check.
     */

    if (
        user.status ===
        "SUSPENDED"
    ) {
        throw ApiError.forbidden(
            "Your account is suspended.",
            {
                code:
                    "ACCOUNT_SUSPENDED",
            }
        );
    }

    if (
        user.status ===
        "BLOCKED"
    ) {
        throw ApiError.forbidden(
            "Your account is blocked.",
            {
                code:
                    "ACCOUNT_BLOCKED",
            }
        );
    }

    if (
        user.status ===
        "INACTIVE"
    ) {
        throw ApiError.forbidden(
            "Your account is inactive.",
            {
                code:
                    "ACCOUNT_INACTIVE",
            }
        );
    }

    /*
     * Verify password.
     */

    const passwordValid =
        await verifyUserPassword(
            user,
            input.password
        );

    if (!passwordValid) {
        throw ApiError.unauthorized(
            "Invalid email or password.",
            {
                code:
                    "INVALID_CREDENTIALS",
            }
        );
    }

    /*
     * Generate token pair.
     */

    const tokens =
        generateUserTokenPair(
            user._id.toString()
        );

    /*
     * Verify generated refresh token
     * so its expiry can be used for
     * the persistent session.
     *
     * Safe verification is used here
     * so JWT errors never escape as
     * unhandled promise rejections.
     */

    const refreshPayload =
        tryVerifyRefreshToken(
            tokens.refreshToken
        );

    if (!refreshPayload) {
        throw ApiError.internal(
            "Failed to create refresh token.",
            {
                code:
                    "REFRESH_TOKEN_GENERATION_FAILED",
            }
        );
    }

    if (
        typeof refreshPayload.exp !==
        "number"
    ) {
        throw ApiError.internal(
            "Refresh token expiry is missing.",
            {
                code:
                    "REFRESH_TOKEN_EXPIRY_MISSING",
            }
        );
    }

    const expiresAt =
        new Date(
            refreshPayload.exp * 1000
        );

    /*
     * Create persistent session.
     */

    const session =
        await createSession({
            userId:
                user._id.toString(),

            refreshToken:
                tokens.refreshToken,

            userAgent:
                metadata?.userAgent,

            ipAddress:
                metadata?.ipAddress,

            deviceId:
                metadata?.deviceId,

            expiresAt,
        });

    /*
     * Update login information.
     */

    user.lastLoginAt =
        new Date();

    user.failedLoginAttempts =
        0;

    user.lockedUntil =
        undefined;

    await user.save();

    return {
        user: {
            id:
                user._id.toString(),

            email:
                user.email!,

            name:
                user.name,

            phone:
                user.phone,

            accountType:
                "USER",

            isVerified:
                user.isEmailVerified,
        },

        userId:
            user._id,

        tokens,

        sessionId:
            session._id,
    };
};


/*
|--------------------------------------------------------------------------
| Refresh Access Token
|--------------------------------------------------------------------------
*/

export const refreshUserAccessToken =
    async (
        refreshToken: string
    ): Promise<UserTokenPair> => {

        /*
         * Safely verify JWT signature,
         * expiry and token type.
         *
         * Invalid/malformed/expired JWT
         * returns null instead of throwing.
         */

        const payload =
            tryVerifyRefreshToken(
                refreshToken
            );

        if (!payload) {
            throw ApiError.unauthorized(
                "Invalid or expired refresh token.",
                {
                    code:
                        "INVALID_REFRESH_TOKEN",
                }
            );
        }

        const userId =
            payload.sub;

        if (!userId) {
            throw ApiError.unauthorized(
                "Invalid refresh token.",
                {
                    code:
                        "INVALID_REFRESH_TOKEN",
                }
            );
        }

        ensureValidObjectId(
            userId,
            "user ID"
        );

        /*
         * Find persistent session
         * using the hashed refresh token.
         */

        const session =
            await findSessionByRefreshToken(
                refreshToken
            );

        if (!session) {
            throw ApiError.unauthorized(
                "Session is invalid, expired, or revoked.",
                {
                    code:
                        "INVALID_SESSION",
                }
            );
        }

        /*
         * Ensure refresh token belongs
         * to the same user as the session.
         */

        if (
            session.userId.toString() !==
            userId
        ) {
            throw ApiError.unauthorized(
                "Invalid refresh token.",
                {
                    code:
                        "REFRESH_TOKEN_MISMATCH",
                }
            );
        }

        /*
         * Check current user account state.
         */

        const user =
            await User.findById(
                userId
            );

        if (!user) {
            throw ApiError.unauthorized(
                "User account was not found.",
                {
                    code:
                        "USER_NOT_FOUND",
                }
            );
        }

        if (
            user.status !==
            "ACTIVE"
        ) {
            throw ApiError.forbidden(
                "Your account is not active.",
                {
                    code:
                        "ACCOUNT_NOT_ACTIVE",
                }
            );
        }

        /*
         * Generate new token pair.
         */

        const tokens =
            generateUserTokenPair(
                userId
            );

        /*
         * Verify new refresh token
         * before creating the new session.
         *
         * Safe verification prevents
         * JWT errors from crashing the server.
         */

        const newRefreshPayload =
            tryVerifyRefreshToken(
                tokens.refreshToken
            );

        if (!newRefreshPayload) {
            throw ApiError.internal(
                "Failed to create refresh token.",
                {
                    code:
                        "REFRESH_TOKEN_GENERATION_FAILED",
                }
            );
        }

        if (
            typeof newRefreshPayload.exp !==
            "number"
        ) {
            throw ApiError.internal(
                "Refresh token expiry is missing.",
                {
                    code:
                        "REFRESH_TOKEN_EXPIRY_MISSING",
                }
            );
        }

        /*
         * Rotate refresh session.
         */

        await revokeUserSession(
            userId,
            session._id.toString()
        );

        const newSession =
            await createSession({
                userId,

                refreshToken:
                    tokens.refreshToken,

                expiresAt:
                    new Date(
                        newRefreshPayload.exp *
                            1000
                    ),
            });

        /*
         * Record session activity.
         */

        await touchSession(
            newSession._id.toString()
        );

        return tokens;
    };


/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

export const logoutUser = async (
    userId: string,
    sessionId: string
): Promise<void> => {

    ensureValidObjectId(
        userId,
        "user ID"
    );

    ensureValidObjectId(
        sessionId,
        "session ID"
    );

    const session =
        await revokeUserSession(
            userId,
            sessionId
        );

    if (!session) {
        throw ApiError.notFound(
            "Session not found or already revoked.",
            {
                code:
                    "SESSION_NOT_FOUND",
            }
        );
    }
};