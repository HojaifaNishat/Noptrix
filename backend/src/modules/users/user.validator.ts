import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Common Fields
|--------------------------------------------------------------------------
*/

const nameSchema = z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name cannot exceed 100 characters.");

const emailSchema = z
    .string()
    .trim()
    .email("Please provide a valid email address.")
    .transform((value) =>
        value.toLowerCase()
    );

const phoneSchema = z
    .string()
    .trim()
    .min(11, "Phone number is too short.")
    .max(11, "Phone number is too long.");

/*
|--------------------------------------------------------------------------
| Create User
|--------------------------------------------------------------------------
*/

export const createUserSchema =
    z
        .object({
            name: nameSchema,

            email: emailSchema.optional(),

            phone: phoneSchema.optional(),

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
        })
        .refine(
            (data) =>
                Boolean(
                    data.email ||
                        data.phone
                ),
            {
                message:
                    "Either email or phone number is required.",

                path: ["email"],
            }
        );

/*
|--------------------------------------------------------------------------
| Update User
|--------------------------------------------------------------------------
*/

export const updateUserSchema =
    z
        .object({
            name: nameSchema.optional(),

            email: emailSchema.optional(),

            phone: phoneSchema.optional(),
        })
        .refine(
            (data) =>
                Object.keys(data).length > 0,
            {
                message:
                    "At least one field is required.",
            }
        );

/*
|--------------------------------------------------------------------------
| Change Password
|--------------------------------------------------------------------------
*/

export const changePasswordSchema =
    z.object({
        currentPassword: z
            .string()
            .min(
                1,
                "Current password is required."
            ),

        newPassword: z
            .string()
            .min(
                8,
                "New password must be at least 8 characters."
            )
            .max(
                128,
                "New password cannot exceed 128 characters."
            ),
    });

/*
|--------------------------------------------------------------------------
| User ID Params
|--------------------------------------------------------------------------
*/

export const userIdParamSchema =
    z.object({
        userId: z
            .string()
            .trim()
            .min(
                1,
                "User ID is required."
            ),
    });

/*
|--------------------------------------------------------------------------
| User Status Update
|--------------------------------------------------------------------------
*/

export const updateUserStatusSchema =
    z.object({
        status: z.enum([
            "ACTIVE",
            "INACTIVE",
            "SUSPENDED",
            "BLOCKED",
        ]),
    });

/*
|--------------------------------------------------------------------------
| Exported Types
|--------------------------------------------------------------------------
*/

export type CreateUserInput =
    z.infer<typeof createUserSchema>;

export type UpdateUserInput =
    z.infer<typeof updateUserSchema>;

export type ChangePasswordInput =
    z.infer<
        typeof changePasswordSchema
    >;

export type UpdateUserStatusInput =
    z.infer<
        typeof updateUserStatusSchema
    >;