import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Shared ObjectId Schema
|--------------------------------------------------------------------------
*/

const objectIdSchema = z
    .string()
    .trim()
    .regex(
        /^[a-f\d]{24}$/i,
        "Invalid ObjectId.",
    );

/*
|--------------------------------------------------------------------------
| Create Invitation
|--------------------------------------------------------------------------
*/

export const createInvitationSchema =
    z.object({
        email: z
            .string()
            .trim()
            .toLowerCase()
            .email(
                "A valid email address is required.",
            ),

        name: z
            .string()
            .trim()
            .min(
                2,
                "Name must be at least 2 characters.",
            )
            .max(
                100,
                "Name cannot exceed 100 characters.",
            ),

        roleId: objectIdSchema,
    });

/*
|--------------------------------------------------------------------------
| Invitation ID Params
|--------------------------------------------------------------------------
*/

export const invitationIdParamSchema =
    z.object({
        invitationId:
            objectIdSchema,
    });

/*
|--------------------------------------------------------------------------
| Accept Invitation
|--------------------------------------------------------------------------
*/

export const acceptInvitationSchema =
    z.object({
        token: z
            .string()
            .trim()
            .min(
                1,
                "Invitation token is required.",
            ),

        name: z
            .string()
            .trim()
            .min(
                2,
                "Name must be at least 2 characters.",
            )
            .max(
                100,
                "Name cannot exceed 100 characters.",
            )
            .optional(),

        password: z
            .string()
            .min(
                8,
                "Password must be at least 8 characters.",
            )
            .max(
                128,
                "Password cannot exceed 128 characters.",
            ),

        phone: z
            .string()
            .trim()
            .min(
                7,
                "Phone number is invalid.",
            )
            .max(
                20,
                "Phone number is invalid.",
            )
            .optional(),
    });

/*
|--------------------------------------------------------------------------
| Invitation Token
|--------------------------------------------------------------------------
*/

export const invitationTokenSchema =
    z.object({
        token: z
            .string()
            .trim()
            .min(
                1,
                "Invitation token is required.",
            ),
    });

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type CreateInvitationInput =
    z.infer<
        typeof createInvitationSchema
    >;

export type InvitationIdParam =
    z.infer<
        typeof invitationIdParamSchema
    >;

export type AcceptInvitationInput =
    z.infer<
        typeof acceptInvitationSchema
    >;

export type InvitationTokenInput =
    z.infer<
        typeof invitationTokenSchema
    >;