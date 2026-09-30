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
    getAuthenticatedSellerId,
} from "../../middlewares/sellerAuth.middleware";

import {
    getSellerById,
} from "../sellers/seller.service";

import {
    loginSeller,
    refreshSellerToken,
    logoutSeller,
    changeSellerPassword,
} from "./seller-auth.service";


/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

export const login = asyncHandler(
    async (
        req: Request,
        res: Response
    ) => {

        const {
            email,
            phone,
            password,
        } = req.body;


        if (
            typeof password !==
            "string"
        ) {
            throw ApiError.badRequest(
                "Password is required.",
                {
                    code:
                        "LOGIN_FIELDS_REQUIRED",
                }
            );
        }


        if (
            typeof email !==
                "string" &&
            typeof phone !==
                "string"
        ) {
            throw ApiError.badRequest(
                "Email or phone is required.",
                {
                    code:
                        "LOGIN_IDENTIFIER_REQUIRED",
                }
            );
        }


        const result =
            await loginSeller(
                {
                    email,
                    phone,
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
                "Seller login successful.",
            data: {
                sellerId:
                    result.sellerId,

                userId:
                    result.userId,

                accessToken:
                    result.accessToken,

                refreshToken:
                    result.refreshToken,

                sessionId:
                    result.sessionId,
            },
        });
    }
);


/*
|--------------------------------------------------------------------------
| Refresh Token
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


            const result =
                await refreshSellerToken(
                    refreshToken
                );


            res.status(200).json({
                success: true,
                message:
                    "Seller token refreshed successfully.",
                data: {
                    sellerId:
                        result.sellerId,

                    userId:
                        result.userId,

                    accessToken:
                        result.accessToken,

                    refreshToken:
                        result.refreshToken,

                    sessionId:
                        result.sessionId,
                },
            });
        }
    );


/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

export const logout =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            const sellerId =
                getAuthenticatedSellerId(
                    req
                );


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


            const seller =
                await getSellerById(
                    sellerId
                );


            if (!seller) {
                throw ApiError.notFound(
                    "Seller profile not found.",
                    {
                        code:
                            "SELLER_PROFILE_NOT_FOUND",
                    }
                );
            }


            await logoutSeller(
                seller.userId.toString(),
                sessionId
            );


            res.status(200).json({
                success: true,
                message:
                    "Seller logout successful.",
                data: null,
            });
        }
    );


/*
|--------------------------------------------------------------------------
| Change Password
|--------------------------------------------------------------------------
*/

export const changePassword =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            const sellerId =
                getAuthenticatedSellerId(
                    req
                );


            const {
                currentPassword,
                newPassword,
            } = req.body;


            if (
                typeof currentPassword !==
                "string" ||
                typeof newPassword !==
                "string"
            ) {
                throw ApiError.badRequest(
                    "Current password and new password are required.",
                    {
                        code:
                            "PASSWORD_FIELDS_REQUIRED",
                    }
                );
            }


            const seller =
                await getSellerById(
                    sellerId
                );


            if (!seller) {
                throw ApiError.notFound(
                    "Seller profile not found.",
                    {
                        code:
                            "SELLER_PROFILE_NOT_FOUND",
                    }
                );
            }


            await changeSellerPassword(
                seller.userId.toString(),
                currentPassword,
                newPassword
            );


            res.status(200).json({
                success: true,
                message:
                    "Seller password changed successfully.",
                data: null,
            });
        }
    );