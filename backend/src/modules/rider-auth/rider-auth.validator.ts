import {
    z,
} from "zod";


/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const EMAIL_REGEX =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_REGEX =
    /^\+?[1-9]\d{7,14}$/;


/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

export const riderLoginSchema =
    z.object({
        email: z
            .string()
            .trim()
            .toLowerCase()
            .regex(
                EMAIL_REGEX,
                "Invalid email address.",
            )
            .optional(),

        phone: z
            .string()
            .trim()
            .regex(
                PHONE_REGEX,
                "Invalid phone number.",
            )
            .optional(),

        password: z
            .string()
            .min(
                1,
                "Password is required.",
            ),
    })
    .refine(
        (data) =>
            Boolean(
                data.email ||
                data.phone,
            ),
        {
            message:
                "Email or phone is required.",
            path: ["email"],
        },
    );


/*
|--------------------------------------------------------------------------
| Refresh Token
|--------------------------------------------------------------------------
*/

export const riderRefreshTokenSchema =
    z.object({
        refreshToken: z
            .string()
            .trim()
            .min(
                1,
                "Refresh token is required.",
            ),
    });


/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

export const riderLogoutSchema =
    z.object({
        refreshToken: z
            .string()
            .trim()
            .min(
                1,
                "Refresh token is required.",
            ),
    });


/*
|--------------------------------------------------------------------------
| Change Password
|--------------------------------------------------------------------------
*/

export const riderChangePasswordSchema =
    z.object({
        currentPassword: z
            .string()
            .min(
                1,
                "Current password is required.",
            ),

        newPassword: z
            .string()
            .min(
                8,
                "New password must be at least 8 characters.",
            )
            .max(
                128,
                "New password cannot exceed 128 characters.",
            ),

        confirmPassword: z
            .string()
            .min(
                1,
                "Password confirmation is required.",
            ),
    })
    .refine(
        (data) =>
            data.newPassword ===
            data.confirmPassword,
        {
            message:
                "Passwords do not match.",
            path: ["confirmPassword"],
        },
    );


/*
|--------------------------------------------------------------------------
| Type Inference
|--------------------------------------------------------------------------
*/

export type RiderLoginInput =
    z.infer<
        typeof riderLoginSchema
    >;

export type RiderRefreshTokenInput =
    z.infer<
        typeof riderRefreshTokenSchema
    >;

export type RiderLogoutInput =
    z.infer<
        typeof riderLogoutSchema
    >;

export type RiderChangePasswordInput =
    z.infer<
        typeof riderChangePasswordSchema
    >;