import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Admin Login
|--------------------------------------------------------------------------
*/

export const adminLoginSchema = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("A valid email address is required."),

    password: z
        .string()
        .min(1, "Password is required."),
});


/*
|--------------------------------------------------------------------------
| Admin Refresh Token
|--------------------------------------------------------------------------
*/

export const adminRefreshTokenSchema = z.object({
    refreshToken: z
        .string()
        .trim()
        .min(1, "Refresh token is required."),
});


/*
|--------------------------------------------------------------------------
| Admin Logout
|--------------------------------------------------------------------------
*/

export const adminLogoutSchema = z.object({
    refreshToken: z
        .string()
        .trim()
        .min(1, "Refresh token is required."),
});


/*
|--------------------------------------------------------------------------
| Admin Secret Verification
|--------------------------------------------------------------------------
*/

export const adminSecretVerifySchema = z.object({
    secret: z
        .string()
        .trim()
        .min(1, "Admin secret is required."),
});


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type AdminLoginInput =
    z.infer<typeof adminLoginSchema>;

export type AdminRefreshTokenInput =
    z.infer<typeof adminRefreshTokenSchema>;

export type AdminLogoutInput =
    z.infer<typeof adminLogoutSchema>;

export type AdminSecretVerifyInput =
    z.infer<typeof adminSecretVerifySchema>;