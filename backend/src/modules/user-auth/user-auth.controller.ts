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
    getAuthenticatedUserId,
} from "../../middlewares/auth.middleware";

import {
    loginUser,
    refreshUserAccessToken,
    logoutUser,
} from "./user-auth.service";


/*
|--------------------------------------------------------------------------
| User Login
|--------------------------------------------------------------------------
*/

export const login = asyncHandler(
    async (
        req: Request,
        res: Response
    ) => {

        const {
            email,
            password,
        } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            throw ApiError.badRequest(
                "Email and password are required.",
                {
                    code:
                        "LOGIN_FIELDS_REQUIRED",
                }
            );
        }

        const result =
            await loginUser(
                {
                    email,
                    password,
                },
                {
                    userAgent:
                        req.get(
                            "user-agent"
                        ),

                    ipAddress:
                        req.ip,
                }
            );

        res.status(200).json({
            success: true,

            message:
                "Login successful.",

            data: {
                userId:
                    result.userId,

                accessToken:
                    result.tokens
                        .accessToken,

                refreshToken:
                    result.tokens
                        .refreshToken,

                sessionId:
                    result.sessionId,
            },
        });
    }
);


/*
|--------------------------------------------------------------------------
| Refresh Access Token
|--------------------------------------------------------------------------
*/

export const refreshToken =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            const {
                refreshToken,
            } = req.body;

            if (
                typeof refreshToken !==
                "string"
            ) {
                throw ApiError.badRequest(
                    "Refresh token is required.",
                    {
                        code:
                            "REFRESH_TOKEN_REQUIRED",
                    }
                );
            }

            const tokens =
                await refreshUserAccessToken(
                    refreshToken
                );

            res.status(200).json({
                success: true,

                message:
                    "Access token refreshed successfully.",

                data: {
                    accessToken:
                        tokens.accessToken,

                    refreshToken:
                        tokens.refreshToken,
                },
            });
        }
    );


/*
|--------------------------------------------------------------------------
| User Logout
|--------------------------------------------------------------------------
*/

export const logout =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            const userId =
                getAuthenticatedUserId(
                    req
                );

            if (!userId) {
                throw ApiError.unauthorized(
                    "Authentication is required.",
                    {
                        code:
                            "AUTHENTICATION_REQUIRED",
                    }
                );
            }

            const {
                sessionId,
            } = req.body;

            if (
                typeof sessionId !==
                "string"
            ) {
                throw ApiError.badRequest(
                    "Session ID is required.",
                    {
                        code:
                            "SESSION_ID_REQUIRED",
                    }
                );
            }

            await logoutUser(
                userId,
                sessionId
            );

            res.status(200).json({
                success: true,

                message:
                    "Logout successful.",
            });
        }
    );