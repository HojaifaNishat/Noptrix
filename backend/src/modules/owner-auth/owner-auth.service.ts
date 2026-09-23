import {
    Types,
} from "mongoose";

import bcrypt from "bcryptjs";

import {
    Owner,
} from "../owners/owner.model";

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
    Session,
} from "../sessions/session.model";

import {
    OwnerLoginInput,
    OwnerTokenPair,
    OwnerAuthenticationResult,
    OwnerSecretVerificationResult,
} from "./owner-auth.types";


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
| Generate Owner Token Pair
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| The User ID is the canonical identity.
|
| OWNER authorization data is explicitly
| attached to the access token because
| ownerAuth.middleware.ts currently requires
| the OWNER role boundary.
|
| secretVerified is always false for
| a newly generated authentication pair.
|
|--------------------------------------------------------------------------
*/

const generateOwnerTokenPair = (
    userId: string,
    sessionId: string
): OwnerTokenPair => {
    return {
        accessToken:
            generateAccessToken(
                userId,
                {
                    role:
                        "OWNER",

                    sessionId,

                    secretVerified:
                        false,
                }
            ),

        refreshToken:
            generateRefreshToken(
                userId
            ),
    };
};


/*
|--------------------------------------------------------------------------
| Login Owner
|--------------------------------------------------------------------------
*/

export const loginOwner = async (
    input: OwnerLoginInput,
    metadata?: {
        readonly userAgent?: string;
        readonly ipAddress?: string;
        readonly deviceId?: string;
    }
): Promise<OwnerAuthenticationResult> => {

    const email =
        input.email
            .trim()
            .toLowerCase();

    /*
     * User is the canonical identity.
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
                    "INVALID_OWNER_CREDENTIALS",
            }
        );
    }

    /*
     * User account status.
     */

    if (
        user.status ===
        "SUSPENDED"
    ) {
        throw ApiError.forbidden(
            "Owner account is suspended.",
            {
                code:
                    "OWNER_ACCOUNT_SUSPENDED",
            }
        );
    }

    if (
        user.status ===
        "BLOCKED"
    ) {
        throw ApiError.forbidden(
            "Owner account is blocked.",
            {
                code:
                    "OWNER_ACCOUNT_BLOCKED",
            }
        );
    }

    if (
        user.status ===
        "INACTIVE"
    ) {
        throw ApiError.forbidden(
            "Owner account is inactive.",
            {
                code:
                    "OWNER_ACCOUNT_INACTIVE",
            }
        );
    }

    if (
        user.status !==
        "ACTIVE"
    ) {
        throw ApiError.forbidden(
            "Owner account is not active.",
            {
                code:
                    "OWNER_ACCOUNT_NOT_ACTIVE",
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
                    "INVALID_OWNER_CREDENTIALS",
            }
        );
    }

    /*
     * Owner profile must already exist.
     *
     * OWNER creation belongs exclusively
     * to the seed/bootstrap process.
     */

    const owner =
        await Owner.findOne({
            userId:
                user._id,
        });

    if (!owner) {
        throw ApiError.forbidden(
            "Owner profile is not configured.",
            {
                code:
                    "OWNER_PROFILE_NOT_CONFIGURED",
            }
        );
    }

    /*
     * Immutable OWNER role verification.
     */

    if (
        owner.role !==
        "OWNER"
    ) {
        throw ApiError.forbidden(
            "Invalid owner profile.",
            {
                code:
                    "INVALID_OWNER_ROLE",
            }
        );
    }

    /*
     * Owner profile status.
     */

    if (
        owner.status ===
        "SUSPENDED"
    ) {
        throw ApiError.forbidden(
            "Owner profile is suspended.",
            {
                code:
                    "OWNER_PROFILE_SUSPENDED",
            }
        );
    }

    if (
        owner.status ===
        "INACTIVE"
    ) {
        throw ApiError.forbidden(
            "Owner profile is inactive.",
            {
                code:
                    "OWNER_PROFILE_INACTIVE",
            }
        );
    }

    if (
        owner.status !==
        "ACTIVE"
    ) {
        throw ApiError.forbidden(
            "Owner profile is not active.",
            {
                code:
                    "OWNER_PROFILE_NOT_ACTIVE",
            }
        );
    }

    /*
     * Generate refresh token first.
     */

    const refreshToken =
        generateRefreshToken(
            user._id.toString()
        );

    const refreshPayload =
        tryVerifyRefreshToken(
            refreshToken
        );

    if (!refreshPayload) {
        throw ApiError.internal(
            "Failed to create owner refresh token.",
            {
                code:
                    "OWNER_REFRESH_TOKEN_GENERATION_FAILED",
            }
        );
    }

    if (
        typeof refreshPayload.exp !==
        "number"
    ) {
        throw ApiError.internal(
            "Owner refresh token expiry is missing.",
            {
                code:
                    "OWNER_REFRESH_TOKEN_EXPIRY_MISSING",
            }
        );
    }

    /*
     * Persistent authentication session.
     */

    const session =
        await createSession({
            userId:
                user._id.toString(),

            refreshToken,

            userAgent:
                metadata?.userAgent,

            ipAddress:
                metadata?.ipAddress,

            deviceId:
                metadata?.deviceId,

            expiresAt:
                new Date(
                    refreshPayload.exp *
                        1000
                ),
        });

    /*
     * Generate access token using
     * the actual session ID.
     */

    const accessToken =
        generateAccessToken(
            user._id.toString(),
            {
                role:
                    "OWNER",

                sessionId:
                    session._id.toString(),

                secretVerified:
                    false,
            }
        );

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

    owner.lastLoginAt =
        new Date();

    await owner.save();

    return {
        userId:
            user._id.toString(),

        ownerId:
            owner._id.toString(),

        tokens: {
            accessToken,
            refreshToken,
        },

        sessionId:
            session._id.toString(),

        secretVerified:
            false,
    };
};


/*
|--------------------------------------------------------------------------
| Verify Owner Secret Code
|--------------------------------------------------------------------------
*/

export const verifyOwnerSecretCode = async (
    userId: string,
    sessionId: string,
    secretCode: string
): Promise<OwnerSecretVerificationResult> => {

    const _userId =
        ensureValidObjectId(
            userId,
            "user ID"
        );

    const _sessionId =
        ensureValidObjectId(
            sessionId,
            "session ID"
        );

    /*
     * Resolve Owner profile.
     */

    const owner =
        await Owner.findOne({
            userId:
                _userId,
        }).select(
            "+secretCodeHash"
        );

    if (!owner) {
        throw ApiError.forbidden(
            "Owner profile is not configured.",
            {
                code:
                    "OWNER_PROFILE_NOT_CONFIGURED",
            }
        );
    }

    if (
        owner.role !==
        "OWNER"
    ) {
        throw ApiError.forbidden(
            "Invalid owner profile.",
            {
                code:
                    "INVALID_OWNER_ROLE",
            }
        );
    }

    if (
        owner.status !==
        "ACTIVE"
    ) {
        throw ApiError.forbidden(
            "Owner profile is not active.",
            {
                code:
                    "OWNER_PROFILE_NOT_ACTIVE",
            }
        );
    }

    /*
     * Verify the session belongs
     * to this canonical User identity.
     */

    const session =
        await Session.findOne({
            _id:
                _sessionId,

            userId:
                _userId,

            status:
                "ACTIVE",

            expiresAt: {
                $gt:
                    new Date(),
            },
        }).exec();

    if (!session) {
        throw ApiError.unauthorized(
            "Session is invalid, expired, or revoked.",
            {
                code:
                    "INVALID_OWNER_SESSION",
            }
        );
    }

    /*
     * Secret validation.
     */

    const normalizedSecret =
        secretCode.trim();

    if (!normalizedSecret) {
        throw ApiError.badRequest(
            "Owner secret code is required.",
            {
                code:
                    "OWNER_SECRET_REQUIRED",
            }
        );
    }

    const secretValid =
        await bcrypt.compare(
            normalizedSecret,
            owner.secretCodeHash
        );

    if (!secretValid) {
        throw ApiError.unauthorized(
            "Invalid owner secret code.",
            {
                code:
                    "INVALID_OWNER_SECRET",
            }
        );
    }

    /*
     * Issue verified access token.
     */

    const accessToken =
        generateAccessToken(
            _userId.toString(),
            {
                role:
                    "OWNER",

                sessionId:
                    _sessionId.toString(),

                secretVerified:
                    true,
            }
        );

    const verifiedAt =
        new Date();

    owner.secretVerifiedAt =
        verifiedAt;

    owner.lastSecretVerificationAt =
        verifiedAt;

    await owner.save();

    await touchSession(
        _sessionId.toString()
    );

    return {
        userId:
            _userId.toString(),

        ownerId:
            owner._id.toString(),

        accessToken,

        sessionId:
            _sessionId.toString(),

        secretVerified:
            true,
    };
};


/*
|--------------------------------------------------------------------------
| Refresh Owner Access Token
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Refresh NEVER restores secretVerified=true.
|
| After refresh:
|
| access token
|      ↓
| secretVerified=false
|
| OWNER must verify the secret again.
|
|--------------------------------------------------------------------------
*/

export const refreshOwnerAccessToken =
    async (
        refreshToken: string
    ): Promise<OwnerTokenPair> => {

        const payload =
            tryVerifyRefreshToken(
                refreshToken
            );

        if (!payload) {
            throw ApiError.unauthorized(
                "Invalid or expired owner refresh token.",
                {
                    code:
                        "INVALID_OWNER_REFRESH_TOKEN",
                }
            );
        }

        const userId =
            payload.sub;

        if (!userId) {
            throw ApiError.unauthorized(
                "Invalid owner refresh token.",
                {
                    code:
                        "INVALID_OWNER_REFRESH_TOKEN",
                }
            );
        }

        ensureValidObjectId(
            userId,
            "user ID"
        );

        /*
         * Locate persistent session.
         */

        const session =
            await findSessionByRefreshToken(
                refreshToken
            );

        if (!session) {
            throw ApiError.unauthorized(
                "Owner session is invalid, expired, or revoked.",
                {
                    code:
                        "INVALID_OWNER_SESSION",
                }
            );
        }

        /*
         * Ensure token and session
         * belong to the same User.
         */

        if (
            session.userId.toString() !==
            userId
        ) {
            throw ApiError.unauthorized(
                "Invalid owner refresh token.",
                {
                    code:
                        "OWNER_REFRESH_TOKEN_MISMATCH",
                }
            );
        }

        /*
         * Owner profile must still exist
         * and remain active.
         */

        const owner =
            await Owner.findOne({
                userId,
            });

        if (!owner) {
            throw ApiError.unauthorized(
                "Owner profile was not found.",
                {
                    code:
                        "OWNER_PROFILE_NOT_CONFIGURED",
                }
            );
        }

        if (
            owner.role !==
            "OWNER"
        ) {
            throw ApiError.unauthorized(
                "Invalid owner profile.",
                {
                    code:
                        "INVALID_OWNER_ROLE",
                }
            );
        }

        if (
            owner.status !==
            "ACTIVE"
        ) {
            throw ApiError.forbidden(
                "Owner profile is not active.",
                {
                    code:
                        "OWNER_PROFILE_NOT_ACTIVE",
                }
            );
        }

        /*
         * User account must still be active.
         */

        const user =
            await User.findById(
                userId
            );

        if (!user) {
            throw ApiError.unauthorized(
                "Owner user account was not found.",
                {
                    code:
                        "OWNER_USER_NOT_FOUND",
                }
            );
        }

        if (
            user.status !==
            "ACTIVE"
        ) {
            throw ApiError.forbidden(
                "Owner account is not active.",
                {
                    code:
                        "OWNER_ACCOUNT_NOT_ACTIVE",
                }
            );
        }

        /*
         * Generate new refresh token.
         */

        const newRefreshToken =
            generateRefreshToken(
                userId
            );

        const newRefreshPayload =
            tryVerifyRefreshToken(
                newRefreshToken
            );

        if (!newRefreshPayload) {
            throw ApiError.internal(
                "Failed to create owner refresh token.",
                {
                    code:
                        "OWNER_REFRESH_TOKEN_GENERATION_FAILED",
                }
            );
        }

        if (
            typeof newRefreshPayload.exp !==
            "number"
        ) {
            throw ApiError.internal(
                "Owner refresh token expiry is missing.",
                {
                    code:
                        "OWNER_REFRESH_TOKEN_EXPIRY_MISSING",
                }
            );
        }

        /*
         * Revoke old session.
         */

        const revoked =
            await revokeUserSession(
                userId,
                session._id.toString()
            );

        if (!revoked) {
            throw ApiError.unauthorized(
                "Owner session is no longer active.",
                {
                    code:
                        "OWNER_SESSION_REVOKED",
                }
            );
        }

        /*
         * Create rotated session.
         */

        const newSession =
            await createSession({
                userId,

                refreshToken:
                    newRefreshToken,

                userAgent:
                    session.userAgent,

                ipAddress:
                    session.ipAddress,

                deviceId:
                    session.deviceId,

                expiresAt:
                    new Date(
                        newRefreshPayload.exp *
                            1000
                    ),
            });

        await touchSession(
            newSession._id.toString()
        );

        /*
         * IMPORTANT:
         *
         * Secret verification is NOT carried
         * over during refresh.
         */

        const accessToken =
            generateAccessToken(
                userId,
                {
                    role:
                        "OWNER",

                    sessionId:
                        newSession._id.toString(),

                    secretVerified:
                        false,
                }
            );

        return {
            accessToken,

            refreshToken:
                newRefreshToken,
        };
    };


/*
|--------------------------------------------------------------------------
| Logout Owner
|--------------------------------------------------------------------------
*/

export const logoutOwner = async (
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
            "Owner session not found or already revoked.",
            {
                code:
                    "OWNER_SESSION_NOT_FOUND",
            }
        );
    }
};