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
| Create Employee Invitation
|--------------------------------------------------------------------------
|
| HR selects:
|
| Job Application
|       +
| Employee Role
|
|--------------------------------------------------------------------------
*/

export const createInvitationSchema =
    z.object({
        applicationId:
            objectIdSchema,

        roleId:
            objectIdSchema,
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
| Accept Employee Invitation
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Candidate already has a User account.
|
| Therefore acceptance does NOT create a new
| User account and does NOT require password.
|
| The token identifies the invitation and the
| existing applicant User is linked automatically.
|
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


export const invitationQuerySchema = z.object({
    page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1),

    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20),

    status: z.enum([
        "PENDING",
        "ACCEPTED",
        "EXPIRED",
        "REVOKED",
    ]).optional(),

    search: z.string()
        .trim()
        .max(150)
        .optional(),

    applicationId: objectIdSchema.optional(),

    roleId: objectIdSchema.optional(),
});
