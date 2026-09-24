import {
    Types,
} from "mongoose";

import bcrypt from "bcryptjs";

import {
    Admin,
    ADMIN_STATUSES,
} from "../admins/admin.model";

import {
    Role,
} from "../roles/role.model";

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
    AdminLoginInput,
    AdminTokenPair,
    AdminAuthenticationResult,
    AdminSecretVerificationResult,
} from "./admin-auth.types";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const ensureValidObjectId = (
    value: string,
    fieldName: string,
): Types.ObjectId => {

    if (!Types.ObjectId.isValid(value)) {
        throw ApiError.badRequest(
            `Invalid ${fieldName}.`,
            {
                code: "INVALID_OBJECT_ID",
            },
        );
    }

    return new Types.ObjectId(value);
};


/*
|--------------------------------------------------------------------------
| Generate Admin Token Pair
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Admin middleware treats the JWT subject
| as adminId.
|
| Therefore:
|
|      accessToken.sub = Admin._id
|
| User ID remains the canonical account
| identity inside the persistent Admin record.
|
| secretVerified is false after login/refresh.
|
|--------------------------------------------------------------------------
*/

const generateAdminTokenPair = (
    adminId: string,
    role: string,
    sessionId: string,
): AdminTokenPair => {

    return {
        accessToken:
            generateAccessToken(
                adminId,
                {
                    role:
                        role
                            .trim()
                            .toUpperCase(),

                    sessionId,

                    secretVerified:
                        false,
                },
            ),

        refreshToken:
            generateRefreshToken(
                adminId,
            ),
    };
};


/*
|--------------------------------------------------------------------------
| Resolve Admin + Role
|--------------------------------------------------------------------------
*/

const getActiveAdminWithRole =
    async (
        adminId: string,
    ) => {

        const _adminId =
            ensureValidObjectId(
                adminId,
                "admin ID",
            );

        const admin =
            await Admin.findById(
                _adminId,
            );

        if (!admin) {
            throw ApiError.notFound(
                "Admin account not found.",
                {
                    code:
                        "ADMIN_ACCOUNT_NOT_FOUND",
                },
            );
        }

        if (
            admin.status !==
            ADMIN_STATUSES.ACTIVE
        ) {
            throw ApiError.forbidden(
                "Admin account is not active.",
                {
                    code:
                        "ADMIN_ACCOUNT_NOT_ACTIVE",
                },
            );
        }

        if (
            admin.lockedUntil &&
            admin.lockedUntil.getTime() >
                Date.now()
        ) {
            throw ApiError.tooManyRequests(
                "Admin account is temporarily locked.",
                {
                    code:
                        "ADMIN_ACCOUNT_LOCKED",
                },
            );
        }

        const role =
            await Role.findById(
                admin.roleId,
            );

        if (!role) {
            throw ApiError.forbidden(
                "Admin role is not configured.",
                {
                    code:
                        "ADMIN_ROLE_NOT_CONFIGURED",
                },
            );
        }

        if (
            role.status !==
            "ACTIVE"
        ) {
            throw ApiError.forbidden(
                "Admin role is inactive.",
                {
                    code:
                        "ADMIN_ROLE_INACTIVE",
                },
            );
        }

        return {
            admin,
            role,
        };
    };


/*
|--------------------------------------------------------------------------
| Login Admin
|--------------------------------------------------------------------------
*/

export const loginAdmin = async (
    input: AdminLoginInput,
    metadata?: {
        readonly userAgent?: string;
        readonly ipAddress?: string;
        readonly deviceId?: string;
    },
): Promise<AdminAuthenticationResult> => {

    const email =
        input.email
            .trim()
            .toLowerCase();

    /*
     * User is the credential identity.
     */

    const user =
        await User.findOne({
            email,
        })
            .select("+password")
            .exec();

    if (!user) {
        throw ApiError.unauthorized(
            "Invalid email or password.",
            {
                code:
                    "INVALID_ADMIN_CREDENTIALS",
            },
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
            "Admin user account is suspended.",
            {
                code:
                    "ADMIN_USER_ACCOUNT_SUSPENDED",
            },
        );
    }

    if (
        user.status ===
        "BLOCKED"
    ) {
        throw ApiError.forbidden(
            "Admin user account is blocked.",
            {
                code:
                    "ADMIN_USER_ACCOUNT_BLOCKED",
            },
        );
    }

    if (
        user.status ===
        "INACTIVE"
    ) {
        throw ApiError.forbidden(
            "Admin user account is inactive.",
            {
                code:
                    "ADMIN_USER_ACCOUNT_INACTIVE",
            },
        );
    }

    if (
        user.status !==
        "ACTIVE"
    ) {
        throw ApiError.forbidden(
            "Admin user account is not active.",
            {
                code:
                    "ADMIN_USER_ACCOUNT_NOT_ACTIVE",
            },
        );
    }

    /*
     * Verify password.
     */

    const passwordValid =
        await verifyUserPassword(
            user,
            input.password,
        );

    if (!passwordValid) {
        throw ApiError.unauthorized(
            "Invalid email or password.",
            {
                code:
                    "INVALID_ADMIN_CREDENTIALS",
            },
        );
    }

    /*
     * Resolve Admin account.
     *
     * Normal customers must never be able
     * to authenticate through Admin Auth.
     */

    const admin =
        await Admin.findOne({
            userId:
                user._id,
        });

    if (!admin) {
        throw ApiError.unauthorized(
            "Invalid admin credentials.",
            {
                code:
                    "INVALID_ADMIN_ACCOUNT",
            },
        );
    }

    /*
     * Resolve active Admin + Role.
     */

    if (
        admin.status !==
        ADMIN_STATUSES.ACTIVE
    ) {
        throw ApiError.forbidden(
            "Admin account is not active.",
            {
                code:
                    "ADMIN_ACCOUNT_NOT_ACTIVE",
            },
        );
    }

    if (
        admin.lockedUntil &&
        admin.lockedUntil.getTime() >
            Date.now()
    ) {
        throw ApiError.tooManyRequests(
            "Admin account is temporarily locked.",
            {
                code:
                    "ADMIN_ACCOUNT_LOCKED",
            },
        );
    }

    const role =
        await Role.findById(
            admin.roleId,
        );

    if (!role) {
        throw ApiError.forbidden(
            "Admin role is not configured.",
            {
                code:
                    "ADMIN_ROLE_NOT_CONFIGURED",
            },
        );
    }

    if (
        role.status !==
        "ACTIVE"
    ) {
        throw ApiError.forbidden(
            "Admin role is inactive.",
            {
                code:
                    "ADMIN_ROLE_INACTIVE",
            },
        );
    }

    /*
     * Generate refresh token.
     *
     * Refresh token subject is Admin ID
     * because adminAuth.middleware treats
     * token.sub as adminId.
     */

    const refreshToken =
        generateRefreshToken(
            admin._id.toString(),
        );

    const refreshPayload =
        tryVerifyRefreshToken(
            refreshToken,
        );

    if (!refreshPayload) {
        throw ApiError.internal(
            "Failed to create admin refresh token.",
            {
                code:
                    "ADMIN_REFRESH_TOKEN_GENERATION_FAILED",
            },
        );
    }

    if (
        typeof refreshPayload.exp !==
        "number"
    ) {
        throw ApiError.internal(
            "Admin refresh token expiry is missing.",
            {
                code:
                    "ADMIN_REFRESH_TOKEN_EXPIRY_MISSING",
            },
        );
    }

    /*
     * Persistent session.
     *
     * Session service expects a User ID,
     * so session.userId remains the canonical
     * User identity.
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
                        1000,
                ),
        });

    /*
     * Access token subject = Admin ID.
     */

    const accessToken =
        generateAccessToken(
            admin._id.toString(),
            {
                role:
                    role.slug
                        .trim()
                        .toUpperCase(),

                sessionId:
                    session._id.toString(),

                secretVerified:
                    false,
            },
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

    admin.lastLoginAt =
        new Date();

    admin.failedLoginAttempts =
        0;

    admin.lockedUntil =
        undefined;

    await admin.save();

    return {
        userId:
            user._id.toString(),

        adminId:
            admin._id.toString(),

        roleId:
            role._id.toString(),

        role:
            role.slug,

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
| Verify Admin Secret
|--------------------------------------------------------------------------
|
| Admin secret is stored on the User account
| only if the Admin authentication design
| provides a secret credential.
|
| This function currently validates the
| authentication session and issues a verified
| access token.
|
|--------------------------------------------------------------------------
*/

export const verifyAdminSecret = async (
    adminId: string,
    sessionId: string,
    secret: string,
): Promise<AdminSecretVerificationResult> => {

    const _adminId =
        ensureValidObjectId(
            adminId,
            "admin ID",
        );

    const _sessionId =
        ensureValidObjectId(
            sessionId,
            "session ID",
        );

    const normalizedSecret =
        secret.trim();

    if (!normalizedSecret) {
        throw ApiError.badRequest(
            "Admin secret is required.",
            {
                code:
                    "ADMIN_SECRET_REQUIRED",
            },
        );
    }

    /*
     * Resolve Admin.
     */

    const admin =
        await Admin.findById(
            _adminId,
        );

    if (!admin) {
        throw ApiError.forbidden(
            "Admin account not found.",
            {
                code:
                    "ADMIN_ACCOUNT_NOT_FOUND",
            },
        );
    }

    if (
        admin.status !==
        ADMIN_STATUSES.ACTIVE
    ) {
        throw ApiError.forbidden(
            "Admin account is not active.",
            {
                code:
                    "ADMIN_ACCOUNT_NOT_ACTIVE",
            },
        );
    }

    /*
     * Verify session using the User ID
     * stored in Admin.
     */

    const session =
        await Session.findOne({
            _id:
                _sessionId,

            userId:
                admin.userId,

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
                    "INVALID_ADMIN_SESSION",
            },
        );
    }

    /*
     * IMPORTANT:
     *
     * There is currently no secretCodeHash
     * field in Admin/User model.
     *
     * Therefore we do NOT pretend that the
     * supplied secret can be securely verified.
     *
     * The actual Admin secret mechanism should
     * be implemented only after its credential
     * field/storage is defined.
     */

    throw ApiError.internal(
        "Admin secret verification is not configured yet.",
        {
            code:
                "ADMIN_SECRET_NOT_CONFIGURED",
        },
    );
};


/*
|--------------------------------------------------------------------------
| Refresh Admin Access Token
|--------------------------------------------------------------------------
*/

export const refreshAdminAccessToken =
    async (
        refreshToken: string,
    ): Promise<AdminTokenPair> => {

        const payload =
            tryVerifyRefreshToken(
                refreshToken,
            );

        if (!payload) {
            throw ApiError.unauthorized(
                "Invalid or expired admin refresh token.",
                {
                    code:
                        "INVALID_ADMIN_REFRESH_TOKEN",
                },
            );
        }

        const adminId =
            payload.sub;

        if (!adminId) {
            throw ApiError.unauthorized(
                "Invalid admin refresh token.",
                {
                    code:
                        "INVALID_ADMIN_REFRESH_TOKEN",
                },
            );
        }

        ensureValidObjectId(
            adminId,
            "admin ID",
        );

        /*
         * Locate persistent session.
         */

        const session =
            await findSessionByRefreshToken(
                refreshToken,
            );

        if (!session) {
            throw ApiError.unauthorized(
                "Admin session is invalid, expired, or revoked.",
                {
                    code:
                        "INVALID_ADMIN_SESSION",
                },
            );
        }

        /*
         * Admin identity from token.
         */

        const admin =
            await Admin.findById(
                adminId,
            );

        if (!admin) {
            throw ApiError.unauthorized(
                "Admin account was not found.",
                {
                    code:
                        "ADMIN_ACCOUNT_NOT_FOUND",
                },
            );
        }

        /*
         * Session belongs to the User linked
         * to this Admin.
         */

        if (
            session.userId.toString() !==
            admin.userId.toString()
        ) {
            throw ApiError.unauthorized(
                "Admin refresh token does not match the session.",
                {
                    code:
                        "ADMIN_REFRESH_TOKEN_MISMATCH",
                },
            );
        }

        if (
            admin.status !==
            ADMIN_STATUSES.ACTIVE
        ) {
            throw ApiError.forbidden(
                "Admin account is not active.",
                {
                    code:
                        "ADMIN_ACCOUNT_NOT_ACTIVE",
                },
            );
        }

        const role =
            await Role.findById(
                admin.roleId,
            );

        if (!role) {
            throw ApiError.unauthorized(
                "Admin role was not found.",
                {
                    code:
                        "ADMIN_ROLE_NOT_CONFIGURED",
                },
            );
        }

        if (
            role.status !==
            "ACTIVE"
        ) {
            throw ApiError.forbidden(
                "Admin role is inactive.",
                {
                    code:
                        "ADMIN_ROLE_INACTIVE",
                },
            );
        }

        /*
         * User must still be active.
         */

        const user =
            await User.findById(
                admin.userId,
            );

        if (!user) {
            throw ApiError.unauthorized(
                "Admin user account was not found.",
                {
                    code:
                        "ADMIN_USER_NOT_FOUND",
                },
            );
        }

        if (
            user.status !==
            "ACTIVE"
        ) {
            throw ApiError.forbidden(
                "Admin user account is not active.",
                {
                    code:
                        "ADMIN_USER_ACCOUNT_NOT_ACTIVE",
                },
            );
        }

        /*
         * Generate rotated refresh token.
         */

        const newRefreshToken =
            generateRefreshToken(
                adminId,
            );

        const newRefreshPayload =
            tryVerifyRefreshToken(
                newRefreshToken,
            );

        if (!newRefreshPayload) {
            throw ApiError.internal(
                "Failed to create admin refresh token.",
                {
                    code:
                        "ADMIN_REFRESH_TOKEN_GENERATION_FAILED",
                },
            );
        }

        if (
            typeof newRefreshPayload.exp !==
            "number"
        ) {
            throw ApiError.internal(
                "Admin refresh token expiry is missing.",
                {
                    code:
                        "ADMIN_REFRESH_TOKEN_EXPIRY_MISSING",
                },
            );
        }

        /*
         * Revoke old session.
         */

        const revoked =
            await revokeUserSession(
                admin.userId.toString(),
                session._id.toString(),
            );

        if (!revoked) {
            throw ApiError.unauthorized(
                "Admin session is no longer active.",
                {
                    code:
                        "ADMIN_SESSION_REVOKED",
                },
            );
        }

        /*
         * Create rotated session.
         */

        const newSession =
            await createSession({
                userId:
                    admin.userId.toString(),

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
                            1000,
                    ),
            });

        await touchSession(
            newSession._id.toString(),
        );

        /*
         * Secret verification is never
         * carried across refresh.
         */

        const accessToken =
            generateAccessToken(
                adminId,
                {
                    role:
                        role.slug
                            .trim()
                            .toUpperCase(),

                    sessionId:
                        newSession._id.toString(),

                    secretVerified:
                        false,
                },
            );

        return {
            accessToken,

            refreshToken:
                newRefreshToken,
        };
    };


/*
|--------------------------------------------------------------------------
| Logout Admin
|--------------------------------------------------------------------------
*/

export const logoutAdmin = async (
    adminId: string,
    sessionId: string,
): Promise<void> => {

    ensureValidObjectId(
        adminId,
        "admin ID",
    );

    ensureValidObjectId(
        sessionId,
        "session ID",
    );

    /*
     * Resolve Admin to obtain the canonical
     * User ID required by Session service.
     */

    const admin =
        await Admin.findById(
            adminId,
        );

    if (!admin) {
        throw ApiError.notFound(
            "Admin account not found.",
            {
                code:
                    "ADMIN_ACCOUNT_NOT_FOUND",
            },
        );
    }

    const session =
        await revokeUserSession(
            admin.userId.toString(),
            sessionId,
        );

    if (!session) {
        throw ApiError.notFound(
            "Admin session not found or already revoked.",
            {
                code:
                    "ADMIN_SESSION_NOT_FOUND",
            },
        );
    }
};


/*
|--------------------------------------------------------------------------
| Touch Admin Session
|--------------------------------------------------------------------------
*/

export const touchAdminSession =
    async (
        adminId: string,
        sessionId: string,
    ): Promise<void> => {

        ensureValidObjectId(
            adminId,
            "admin ID",
        );

        ensureValidObjectId(
            sessionId,
            "session ID",
        );

        const admin =
            await Admin.findById(
                adminId,
            );

        if (!admin) {
            throw ApiError.notFound(
                "Admin account not found.",
                {
                    code:
                        "ADMIN_ACCOUNT_NOT_FOUND",
                },
            );
        }

        const session =
            await Session.findOne({
                _id:
                    sessionId,

                userId:
                    admin.userId,

                status:
                    "ACTIVE",

                expiresAt: {
                    $gt:
                        new Date(),
                },
            }).exec();

        if (!session) {
            throw ApiError.unauthorized(
                "Admin session is invalid, expired, or revoked.",
                {
                    code:
                        "INVALID_ADMIN_SESSION",
                },
            );
        }

        await touchSession(
            sessionId,
        );
    };