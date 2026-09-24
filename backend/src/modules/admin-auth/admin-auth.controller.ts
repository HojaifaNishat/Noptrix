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

            res.status(200).json({
                success: true,

                message:
                    "Admin login successful.",

                data:
                    result,
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
                req.body.refreshToken;

            const result =
                await refreshAdminAccessToken(
                    refreshToken,
                );

            res.status(200).json({
                success: true,

                message:
                    "Admin access token refreshed successfully.",

                data:
                    result,
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