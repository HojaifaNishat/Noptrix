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
    tryVerifyRefreshToken,
} from "../../utils/token";

import {
    registerUser,
    loginUser,
    refreshUserAccessToken,
    logoutUser,
} from "./user-auth.service";


/*
|--------------------------------------------------------------------------
| Refresh Token Cookie
|--------------------------------------------------------------------------
*/

const USER_REFRESH_TOKEN_COOKIE =
    "noptrix_user_rt";

const REFRESH_TOKEN_COOKIE_PATH =
    "/api/user-auth";

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
        USER_REFRESH_TOKEN_COOKIE,
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
        USER_REFRESH_TOKEN_COOKIE,
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
) => ({
    userAgent:
        req.get(
            "user-agent"
        ),

    ipAddress:
        req.ip,
});


/*
|--------------------------------------------------------------------------
| POST /register
|--------------------------------------------------------------------------
*/

export const register = asyncHandler(
    async (
        req: Request,
        res: Response
    ) => {

        const result =
            await registerUser(
                req.body,
                extractRequestMetadata(req)
            );

        setRefreshTokenCookie(
            res,
            result.tokens.refreshToken
        );

        res.status(201).json({
            success: true,

            message:
                "Registration successful.",

            data: {
                user:
                    result.user,

                userId:
                    result.userId,

                accessToken:
                    result.tokens
                        .accessToken,

                sessionId:
                    result.sessionId,
            },
        });
    }
);


/*
|--------------------------------------------------------------------------
| POST /login
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
                extractRequestMetadata(req)
            );

        setRefreshTokenCookie(
            res,
            result.tokens.refreshToken
        );

        res.status(200).json({
            success: true,

            message:
                "Login successful.",

            data: {
                user:
                    result.user,

                userId:
                    result.userId,

                accessToken:
                    result.tokens
                        .accessToken,

                sessionId:
                    result.sessionId,
            },
        });
    }
);


/*
|--------------------------------------------------------------------------
| POST /refresh
|--------------------------------------------------------------------------
*/

export const refreshToken =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            const refreshToken =
                typeof req.cookies?.[
                    USER_REFRESH_TOKEN_COOKIE
                ] === "string"
                    ? req.cookies[
                          USER_REFRESH_TOKEN_COOKIE
                      ]
                    : undefined;

            if (!refreshToken) {
                throw ApiError.unauthorized(
                    "User refresh token is required.",
                    {
                        code:
                            "USER_REFRESH_TOKEN_REQUIRED",
                    }
                );
            }

            const tokens =
                await refreshUserAccessToken(
                    refreshToken
                );

            setRefreshTokenCookie(
                res,
                tokens.refreshToken
            );

            res.status(200).json({
                success: true,

                message:
                    "Access token refreshed successfully.",

                data: {
                    accessToken:
                        tokens.accessToken,
                },
            });
        }
    );


/*
|--------------------------------------------------------------------------
| POST /logout
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

            clearRefreshTokenCookie(
                res
            );

            res.status(200).json({
                success: true,

                message:
                    "Logout successful.",

                data: {
                    sessionId,
                    loggedOut: true,
                },
            });
        }
    );