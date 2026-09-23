import {
    Request,
    Response,
} from "express";

import {
    loginOwner,
    verifyOwnerSecretCode,
    refreshOwnerAccessToken,
    logoutOwner,
} from "./owner-auth.service";

import {
    getAuthenticatedOwnerId,
} from "../../middlewares/ownerAuth.middleware";

import {
    ApiError,
} from "../../utils/ApiError";

import {
    asyncHandler,
} from "../../utils/asyncHandler";

import {
    tryVerifyRefreshToken,
} from "../../utils/token";

import {
    getUserActiveSessions,
} from "../sessions/session.service";


/*
|--------------------------------------------------------------------------
| Refresh Token Cookie
|--------------------------------------------------------------------------
*/

const OWNER_REFRESH_TOKEN_COOKIE =
    "noptrix_owner_rt";

const REFRESH_TOKEN_COOKIE_PATH =
    "/api/owner-auth";

const baseRefreshCookieOptions = {
    httpOnly: true,

    secure:
        process.env.NODE_ENV ===
        "production",

    sameSite: "strict" as const,

    path:
        REFRESH_TOKEN_COOKIE_PATH,
};


/*
|--------------------------------------------------------------------------
| Refresh Token Cookie Helpers
|--------------------------------------------------------------------------
*/

const resolveRefreshCookieMaxAge = (
    refreshToken: string
): number | undefined => {
    const payload =
        tryVerifyRefreshToken(
            refreshToken
        );

    if (
        !payload ||
        typeof payload.exp !== "number"
    ) {
        return undefined;
    }

    const maxAge =
        payload.exp * 1000 -
        Date.now();

    return maxAge > 0
        ? maxAge
        : undefined;
};


const setRefreshTokenCookie = (
    res: Response,
    refreshToken: string
): void => {
    const maxAge =
        resolveRefreshCookieMaxAge(
            refreshToken
        );

    res.cookie(
        OWNER_REFRESH_TOKEN_COOKIE,
        refreshToken,
        {
            ...baseRefreshCookieOptions,

            ...(maxAge
                ? { maxAge }
                : {}),
        }
    );
};


const clearRefreshTokenCookie = (
    res: Response
): void => {
    res.clearCookie(
        OWNER_REFRESH_TOKEN_COOKIE,
        {
            path:
                REFRESH_TOKEN_COOKIE_PATH,
        }
    );
};


/*
|--------------------------------------------------------------------------
| Request Metadata
|--------------------------------------------------------------------------
*/

const extractRequestMetadata = (
    req: Request
) => {
    const deviceId =
        req.headers["x-device-id"];

    return {
        userAgent:
            req.get("user-agent") ??
            undefined,

        ipAddress:
            req.ip ?? undefined,

        deviceId:
            typeof deviceId === "string"
                ? deviceId
                : undefined,
    };
};


/*
|--------------------------------------------------------------------------
| POST /login
|--------------------------------------------------------------------------
*/

export const login = asyncHandler(
    async (
        req: Request,
        res: Response
    ): Promise<void> => {

        const result =
            await loginOwner(
                req.body,
                extractRequestMetadata(req)
            );

        setRefreshTokenCookie(
            res,
            result.tokens.refreshToken
        );

        res.status(200).json({
            success: true,

            data: {
                userId:
                    result.userId,

                ownerId:
                    result.ownerId,

                sessionId:
                    result.sessionId,

                accessToken:
                    result.tokens.accessToken,

                secretVerified:
                    result.secretVerified,
            },
        });
    }
);


/*
|--------------------------------------------------------------------------
| POST /verify-secret
|--------------------------------------------------------------------------
*/

export const verifySecretCode =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {

            const ownerId =
                getAuthenticatedOwnerId(
                    req
                );

            const sessionId =
                req.ownerAuth?.sessionId;

            if (!sessionId) {
                throw ApiError.unauthorized(
                    "Owner session is required.",
                    {
                        code:
                            "OWNER_SESSION_REQUIRED",
                    }
                );
            }

            const result =
                await verifyOwnerSecretCode(
                    ownerId,
                    sessionId,
                    req.body.secretCode
                );

            res.status(200).json({
                success: true,

                data: {
                    userId:
                        result.userId,

                    ownerId:
                        result.ownerId,

                    sessionId:
                        result.sessionId,

                    accessToken:
                        result.accessToken,

                    secretVerified:
                        result.secretVerified,
                },
            });
        }
    );


/*
|--------------------------------------------------------------------------
| POST /refresh
|--------------------------------------------------------------------------
*/

export const refresh = asyncHandler(
    async (
        req: Request,
        res: Response
    ): Promise<void> => {

        const refreshToken =
            typeof req.cookies?.[
                OWNER_REFRESH_TOKEN_COOKIE
            ] === "string"
                ? req.cookies[
                      OWNER_REFRESH_TOKEN_COOKIE
                  ]
                : undefined;

        if (!refreshToken) {
            throw ApiError.unauthorized(
                "Owner refresh token is required.",
                {
                    code:
                        "OWNER_REFRESH_TOKEN_REQUIRED",
                }
            );
        }

        const result =
            await refreshOwnerAccessToken(
                refreshToken
            );

        /*
         * Refresh rotation:
         *
         * Old refresh token/session is revoked
         * by the service.
         *
         * New refresh token becomes the only
         * valid refresh credential.
         */

        setRefreshTokenCookie(
            res,
            result.refreshToken
        );

        res.status(200).json({
            success: true,

            data: {
                accessToken:
                    result.accessToken,

                secretVerified:
                    false,
            },
        });
    }
);


/*
|--------------------------------------------------------------------------
| POST /logout
|--------------------------------------------------------------------------
*/

export const logout = asyncHandler(
    async (
        req: Request,
        res: Response
    ): Promise<void> => {

        const ownerId =
            getAuthenticatedOwnerId(
                req
            );

        const sessionId =
            req.ownerAuth?.sessionId;

        if (!sessionId) {
            throw ApiError.unauthorized(
                "Owner session is required.",
                {
                    code:
                        "OWNER_SESSION_REQUIRED",
                }
            );
        }

        await logoutOwner(
            ownerId,
            sessionId
        );

        clearRefreshTokenCookie(
            res
        );

        res.status(200).json({
            success: true,

            data: {
                sessionId,
                loggedOut: true,
            },
        });
    }
);


/*
|--------------------------------------------------------------------------
| GET /sessions
|--------------------------------------------------------------------------
*/

export const listActiveSessions =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {

            const ownerId =
                getAuthenticatedOwnerId(
                    req
                );

            const sessions =
                await getUserActiveSessions(
                    ownerId
                );

            res.status(200).json({
                success: true,

                data: {
                    sessions:
                        sessions.map(
                            (session) => ({
                                sessionId:
                                    session._id.toString(),

                                userAgent:
                                    session.userAgent,

                                ipAddress:
                                    session.ipAddress,

                                deviceId:
                                    session.deviceId,

                                lastUsedAt:
                                    session.lastUsedAt,

                                expiresAt:
                                    session.expiresAt,

                                isCurrent:
                                    session._id.toString() ===
                                    req.ownerAuth
                                        ?.sessionId,
                            })
                        ),
                },
            });
        }
    );