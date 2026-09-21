import { z } from "zod";


/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

export const userLoginSchema =
    z.object({
        email: z
            .string()
            .trim()
            .email(
                "Please provide a valid email address."
            )
            .transform((value) =>
                value.toLowerCase()
            ),

        password: z
            .string()
            .min(
                1,
                "Password is required."
            ),
    });


/*
|--------------------------------------------------------------------------
| Refresh Token
|--------------------------------------------------------------------------
*/

export const userRefreshTokenSchema =
    z.object({
        refreshToken: z
            .string()
            .trim()
            .min(
                1,
                "Refresh token is required."
            ),
    });


/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

export const userLogoutSchema =
    z.object({
        sessionId: z
            .string()
            .trim()
            .min(
                1,
                "Session ID is required."
            ),
    });


/*
|--------------------------------------------------------------------------
| Session ID
|--------------------------------------------------------------------------
*/

export const userSessionIdParamSchema =
    z.object({
        sessionId: z
            .string()
            .trim()
            .min(
                1,
                "Session ID is required."
            ),
    });


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type UserLoginInput =
    z.infer<
        typeof userLoginSchema
    >;

export type UserRefreshTokenInput =
    z.infer<
        typeof userRefreshTokenSchema
    >;

export type UserLogoutInput =
    z.infer<
        typeof userLogoutSchema
    >;