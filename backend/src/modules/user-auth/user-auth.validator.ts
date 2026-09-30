import { z } from "zod";


/*
|--------------------------------------------------------------------------
| Customer Registration
|--------------------------------------------------------------------------
*/

export const userRegistrationSchema =
    z.object({
        name: z
            .string()
            .trim()
            .min(
                2,
                "Name must be at least 2 characters."
            )
            .max(
                100,
                "Name cannot exceed 100 characters."
            ),

        email: z
            .string()
            .trim()
            .email(
                "Please provide a valid email address."
            )
            .transform((value) =>
                value.toLowerCase()
            ),

        phone: z
            .string()
            .trim()
            .min(
                11,
                "Phone number is too short."
            )
            .max(
                11,
                "Phone number is too long."
            )
            .optional(),

        password: z
            .string()
            .min(
                8,
                "Password must be at least 8 characters."
            )
            .max(
                128,
                "Password cannot exceed 128 characters."
            ),
    });


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
export type UserRegistrationInput =
    z.infer<
        typeof userRegistrationSchema
    >;
