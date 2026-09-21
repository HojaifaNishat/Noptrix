import {
    Types,
} from "mongoose";

import {
    User,
} from "../users/user.model";

import {
    verifyUserPassword,
} from "../users/user.service";

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