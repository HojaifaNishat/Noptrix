import {
    Request,
    Response,
} from "express";

import {
    asyncHandler,
} from "../../utils/asyncHandler";

import {
    ApiError,
} from "../../utils/ApiError";

import {
    getAuthenticatedAdminId,
} from "../../middlewares/adminAuth.middleware";

import {
    loginAdmin,
    refreshAdminAccessToken,
    logoutAdmin,
    verifyAdminSecret,
} from "./admin-auth.service";

import {
    getAdminProfileByAdminId,
} from "../admins/admin.service";


/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const ADMIN_REFRESH_COOKIE =
    "noptrix_admin_rt";

const ADMIN_REFRESH_COOKIE_PATH =
    "/api/admin-auth";


/*
|--------------------------------------------------------------------------
| Cookie Helpers
|--------------------------------------------------------------------------
*/

const getAdminRefreshCookieOptions = () => ({
    httpOnly: true,

    secure:
        process.env.NODE_ENV === "production",

    sameSite:
        "strict" as const,

    path:
        ADMIN_REFRESH_COOKIE_PATH,
});


const setAdminRefreshCookie = (
    res: Response,
    refreshToken: string,
): void => {

    res.cookie(
        ADMIN_REFRESH_COOKIE,
        refreshToken,
        {
            ...getAdminRefreshCookieOptions(),

            maxAge:
                7 *
                24 *
                60 *
                60 *
                1000,
        },
    );
};


const clearAdminRefreshCookie = (
    res: Response,
): void => {

    res.clearCookie(
        ADMIN_REFRESH_COOKIE,
        getAdminRefreshCookieOptions(),
    );
};


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getSessionIdFromRequest = (
    req: Request,
): string => {

    const sessionId =
        req.adminAuth?.claims?.sessionId;

    if (
        typeof sessionId !== "string" ||
        !sessionId.trim()
    ) {
        throw ApiError.unauthorized(
            "Admin session information is missing.",
            {
                code:
                    "ADMIN_SESSION_ID_MISSING",
            },
        );
    }

    return sessionId.trim();
};


/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

export const loginAdminController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {

            const result =
                await loginAdmin(
                    {
                        email:
                            req.body.email,

                        password:
                            req.body.password,
                    },
                    {
                        userAgent:
                            req.get(
                                "user-agent",
                            ),

                        ipAddress:
                            req.ip,

                        deviceId:
                            typeof req.body.deviceId ===
                            "string"
                                ? req.body.deviceId
                                : undefined,
                    },
                );

            /*
             * Refresh token stays in
             * an httpOnly cookie.
             */

            if (
                typeof result.tokens.refreshToken !==
                "string" ||
                !result.tokens.refreshToken.trim()
            ) {
                throw ApiError.internal(
                    "Admin refresh token was not generated.",
                    {
                        code:
                            "ADMIN_REFRESH_TOKEN_MISSING",
                    },
                );
            }

            setAdminRefreshCookie(
                res,
                result.tokens.refreshToken,
            );

            /*
             * Never expose refresh token
             * in the JSON response.
             */

            const {
                refreshToken: _refreshToken,
                ...safeTokens
            } = result.tokens;

            res.status(200).json({
                success: true,

                message:
                    "Admin login successful.",

                data: {
                    ...result,

                    tokens:
                        safeTokens,
                },
            });
        },
    );


/*
|--------------------------------------------------------------------------
| Current Admin
|--------------------------------------------------------------------------
*/

export const getMyAdminAuthController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {

            const adminId =
                getAuthenticatedAdminId(
                    req,
                );

            const profile =
                await getAdminProfileByAdminId(
                    adminId,
                );

            const permissions =
                req.adminAuth?.permissions ??
                [];

            res.status(200).json({
                success: true,

                message:
                    "Admin authentication profile retrieved successfully.",

                data: {
                    id:
                        profile.userId,

                    email:
                        profile.email ??
                        "",

                    name:
                        profile.name,

                    phone:
                        profile.phone,

                    accountType:
                        "ADMIN",

                    role:
                        profile.role.slug
                            .trim()
                            .toUpperCase(),

                    isVerified:
                        false,

                    secretVerified:
                        req.adminAuth
                            ?.secretVerified ??
                        false,

                    permissions:
                        [...permissions],

                    avatarUrl:
                        profile.avatarUrl,
                },
            });
        },
    );


/*
|--------------------------------------------------------------------------
| Refresh Access Token
|--------------------------------------------------------------------------
*/

export const refreshAdminTokenController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {

            const refreshToken =
                req.cookies?.[
                    ADMIN_REFRESH_COOKIE
                ];

            if (
                typeof refreshToken !==
                "string" ||
                !refreshToken.trim()
            ) {
                throw ApiError.unauthorized(
                    "Admin refresh session is missing.",
                    {
                        code:
                            "ADMIN_REFRESH_COOKIE_MISSING",
                    },
                );
            }

            const result =
                await refreshAdminAccessToken(
                    refreshToken,
                );

            /*
             * Rotate refresh cookie.
             */

            setAdminRefreshCookie(
                res,
                result.refreshToken,
            );

            /*
             * Never expose refresh token
             * to the frontend JavaScript.
             */

            const {
                refreshToken: _refreshToken,
                ...safeResult
            } = result;

            res.status(200).json({
                success: true,

                message:
                    "Admin access token refreshed successfully.",

                data:
                    safeResult,
            });
        },
    );


/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

export const logoutAdminController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {

            const adminId =
                getAuthenticatedAdminId(
                    req,
                );

            const sessionId =
                getSessionIdFromRequest(
                    req,
                );

            await logoutAdmin(
                adminId,
                sessionId,
            );

            clearAdminRefreshCookie(
                res,
            );

            res.status(200).json({
                success: true,

                message:
                    "Admin logout successful.",
            });
        },
    );


/*
|--------------------------------------------------------------------------
| Verify Admin Secret
|--------------------------------------------------------------------------
*/

export const verifyAdminSecretController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {

            const adminId =
                getAuthenticatedAdminId(
                    req,
                );

            const sessionId =
                getSessionIdFromRequest(
                    req,
                );

            const result =
                await verifyAdminSecret(
                    adminId,
                    sessionId,
                    req.body.secret,
                );

            res.status(200).json({
                success: true,

                message:
                    "Admin secret verified successfully.",

                data:
                    result,
            });
        },
    );
