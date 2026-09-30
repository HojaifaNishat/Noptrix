import {
    Types,
} from "mongoose";

import {
    ApiError,
} from "../../utils/ApiError";

import {
    generateTokenPair,
    verifyRefreshToken,
} from "../../utils/token";

import {
    createSession,
    findSessionByRefreshToken,
    revokeUserSession,
    revokeAllUserSessions,
    touchSession,
} from "../sessions/session.service";

import {
    findUserForAuthentication,
    verifyUserPassword,
    updateLastLogin,
    recordFailedLogin,
    resetFailedLoginAttempts,
    isUserLocked,
    changeUserPassword,
} from "../users/user.service";

import {
    getSellerByUserId,
} from "../sellers/seller.service";

import type {
    SellerLoginInput,
} from "./seller-auth.validator";

import type {
    SellerLoginResult,
    SellerRefreshResult,
} from "./seller-auth.types";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const toObjectIdString = (
    value: Types.ObjectId
): string => value.toString();


const getRefreshTokenExpirationDate = (
    refreshToken: string
): Date => {
    const payload =
        verifyRefreshToken(refreshToken);

    if (
        typeof payload.exp !==
        "number"
    ) {
        throw ApiError.internal(
            "Refresh token expiration is invalid.",
            {
                code:
                    "INVALID_REFRESH_EXPIRATION",
            }
        );
    }

    return new Date(
        payload.exp * 1000
    );
};


/*
|--------------------------------------------------------------------------
| Find User For Login
|--------------------------------------------------------------------------
*/

const findUserForLogin = async (
    input: SellerLoginInput
) => {
    if (input.email) {
        return findUserForAuthentication(
            input.email
        );
    }

    if (input.phone) {
        return findUserForAuthentication(
            input.phone
        );
    }

    throw ApiError.badRequest(
        "Email or phone is required.",
        {
            code:
                "LOGIN_IDENTIFIER_REQUIRED",
        }
    );
};


/*
|--------------------------------------------------------------------------
| Login Seller
|--------------------------------------------------------------------------
*/

export const loginSeller = async (
    input: SellerLoginInput,
    metadata?: {
        readonly userAgent?: string;
        readonly ipAddress?: string;
        readonly deviceId?: string;
    }
): Promise<SellerLoginResult> => {

    const user =
        await findUserForLogin(input);

    if (!user) {
        throw ApiError.unauthorized(
            "Invalid email/phone or password.",
            {
                code:
                    "INVALID_CREDENTIALS",
            }
        );
    }

    const userId =
        toObjectIdString(user._id);


    /*
    |--------------------------------------------------------------------------
    | Account Lock
    |--------------------------------------------------------------------------
    */

    if (isUserLocked(user)) {
        throw ApiError.unauthorized(
            "Account is temporarily locked.",
            {
                code:
                    "ACCOUNT_LOCKED",
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Password Verification
    |--------------------------------------------------------------------------
    */

    const passwordValid =
        await verifyUserPassword(
            user,
            input.password
        );

    if (!passwordValid) {

        await recordFailedLogin(
            userId
        );

        throw ApiError.unauthorized(
            "Invalid email/phone or password.",
            {
                code:
                    "INVALID_CREDENTIALS",
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Seller Profile
    |--------------------------------------------------------------------------
    */

    const seller =
        await getSellerByUserId(
            userId
        );

    if (!seller) {
        throw ApiError.forbidden(
            "This account is not registered as a seller.",
            {
                code:
                    "SELLER_PROFILE_NOT_FOUND",
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Seller Status
    |--------------------------------------------------------------------------
    */

    if (seller.status !== "ACTIVE") {
        throw ApiError.forbidden(
            `Seller account is ${seller.status.toLowerCase()}.`,
            {
                code:
                    "SELLER_ACCOUNT_INACTIVE",
                details: {
                    status:
                        seller.status,
                },
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Successful Login
    |--------------------------------------------------------------------------
    */

    await resetFailedLoginAttempts(
        userId
    );

    await updateLastLogin(
        userId
    );


    /*
    |--------------------------------------------------------------------------
    | Token Pair
    |--------------------------------------------------------------------------
    |
    | JWT sub = Seller ID
    |
    */

    const tokenPair =
        generateTokenPair(
            seller._id.toString(),
            {
                role: "SELLER",
            }
        );


    /*
    |--------------------------------------------------------------------------
    | Session
    |--------------------------------------------------------------------------
    |
    | Session belongs to canonical User ID.
    |
    */

    const expiresAt =
        getRefreshTokenExpirationDate(
            tokenPair.refreshToken
        );

    const session =
        await createSession({
            userId,
            refreshToken:
                tokenPair.refreshToken,
            userAgent:
                metadata?.userAgent,
            ipAddress:
                metadata?.ipAddress,
            deviceId:
                metadata?.deviceId,
            expiresAt,
        });


    return {
        accessToken:
            tokenPair.accessToken,

        refreshToken:
            tokenPair.refreshToken,

        sellerId:
            seller._id,

        userId:
            user._id,

        sessionId:
            session._id,
    };
};


/*
|--------------------------------------------------------------------------
| Refresh Seller Token
|--------------------------------------------------------------------------
*/

export const refreshSellerToken = async (
    refreshToken: string
): Promise<SellerRefreshResult> => {

    let payload;

    try {
        payload =
            verifyRefreshToken(
                refreshToken
            );
    } catch {
        throw ApiError.unauthorized(
            "Invalid or expired refresh token.",
            {
                code:
                    "INVALID_REFRESH_TOKEN",
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Session
    |--------------------------------------------------------------------------
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

    const userId =
        session.userId.toString();


    /*
    |--------------------------------------------------------------------------
    | Seller Profile
    |--------------------------------------------------------------------------
    */

    const seller =
        await getSellerByUserId(
            userId
        );

    if (!seller) {

        await revokeUserSession(
            userId,
            session._id.toString()
        );

        throw ApiError.forbidden(
            "Seller profile was not found.",
            {
                code:
                    "SELLER_PROFILE_NOT_FOUND",
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Seller Status
    |--------------------------------------------------------------------------
    */

    if (seller.status !== "ACTIVE") {

        await revokeUserSession(
            userId,
            session._id.toString()
        );

        throw ApiError.forbidden(
            "Seller account is not active.",
            {
                code:
                    "SELLER_ACCOUNT_INACTIVE",
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Token Identity
    |--------------------------------------------------------------------------
    */

    if (
        payload.sub !==
        seller._id.toString()
    ) {

        await revokeUserSession(
            userId,
            session._id.toString()
        );

        throw ApiError.unauthorized(
            "Invalid refresh token.",
            {
                code:
                    "TOKEN_IDENTITY_MISMATCH",
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Token Rotation
    |--------------------------------------------------------------------------
    */

    const newTokenPair =
        generateTokenPair(
            seller._id.toString(),
            {
                role: "SELLER",
            }
        );

    const newExpiresAt =
        getRefreshTokenExpirationDate(
            newTokenPair.refreshToken
        );


    /*
    |--------------------------------------------------------------------------
    | Revoke Old Session
    |--------------------------------------------------------------------------
    */

    await revokeUserSession(
        userId,
        session._id.toString()
    );


    /*
    |--------------------------------------------------------------------------
    | Create New Session
    |--------------------------------------------------------------------------
    */

    const newSession =
        await createSession({
            userId,
            refreshToken:
                newTokenPair.refreshToken,
            expiresAt:
                newExpiresAt,
        });


    return {
        accessToken:
            newTokenPair.accessToken,

        refreshToken:
            newTokenPair.refreshToken,

        sellerId:
            seller._id,

        userId:
            session.userId,

        sessionId:
            newSession._id,
    };
};


/*
|--------------------------------------------------------------------------
| Logout Seller
|--------------------------------------------------------------------------
*/

export const logoutSeller = async (
    userId: string,
    sessionId: string
): Promise<void> => {

    const revoked =
        await revokeUserSession(
            userId,
            sessionId
        );

    if (!revoked) {
        throw ApiError.unauthorized(
            "Session is invalid or already revoked.",
            {
                code:
                    "INVALID_SESSION",
            }
        );
    }
};


/*
|--------------------------------------------------------------------------
| Change Seller Password
|--------------------------------------------------------------------------
*/

export const changeSellerPassword = async (
    userId: string,
    currentPassword: string,
    newPassword: string
): Promise<void> => {

    /*
    |--------------------------------------------------------------------------
    | Verify Seller Profile
    |--------------------------------------------------------------------------
    */

    const seller =
        await getSellerByUserId(
            userId
        );

    if (!seller) {
        throw ApiError.forbidden(
            "Seller profile was not found.",
            {
                code:
                    "SELLER_PROFILE_NOT_FOUND",
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Change User Password
    |--------------------------------------------------------------------------
    */

    await changeUserPassword(
        userId,
        currentPassword,
        newPassword
    );


    /*
    |--------------------------------------------------------------------------
    | Revoke Existing Sessions
    |--------------------------------------------------------------------------
    |
    | Password changes invalidate
    | previously issued sessions.
    |
    */

    await revokeAllUserSessions(
        userId
    );
};


/*
|--------------------------------------------------------------------------
| Touch Seller Session
|--------------------------------------------------------------------------
*/

export const touchSellerSession = async (
    sessionId: string
) => {
    return touchSession(
        sessionId
    );
};