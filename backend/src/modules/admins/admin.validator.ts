import {
    z,
} from "zod";


/*
|--------------------------------------------------------------------------
| ObjectId
|--------------------------------------------------------------------------
*/

const objectIdSchema =
    z
        .string()
        .trim()
        .regex(
            /^[a-f\d]{24}$/i,
            "Invalid ObjectId.",
        );


/*
|--------------------------------------------------------------------------
| Admin ID Param
|--------------------------------------------------------------------------
*/

export const adminIdParamSchema =
    z.object({
        adminId:
            objectIdSchema,
    });


/*
|--------------------------------------------------------------------------
| User ID Param
|--------------------------------------------------------------------------
*/

export const userIdParamSchema =
    z.object({
        userId:
            objectIdSchema,
    });


/*
|--------------------------------------------------------------------------
| Create Admin
|--------------------------------------------------------------------------
*/

export const createAdminSchema =
    z.object({
        userId:
            objectIdSchema,

        roleId:
            objectIdSchema,
    });


/*
|--------------------------------------------------------------------------
| Update Admin
|--------------------------------------------------------------------------
*/

export const updateAdminSchema =
    z
        .object({
            roleId:
                objectIdSchema
                    .optional(),

            status:
                z
                    .enum([
                        "ACTIVE",
                        "INACTIVE",
                        "SUSPENDED",
                        "BLOCKED",
                    ])
                    .optional(),
        })
        .refine(
            (data) =>
                data.roleId !==
                    undefined ||
                data.status !==
                    undefined,
            {
                message:
                    "At least one field is required.",
            },
        );


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type AdminIdParam =
    z.infer<
        typeof adminIdParamSchema
    >;

export type UserIdParam =
    z.infer<
        typeof userIdParamSchema
    >;

export type CreateAdminInput =
    z.infer<
        typeof createAdminSchema
    >;

export type UpdateAdminInput =
    z.infer<
        typeof updateAdminSchema
    >;