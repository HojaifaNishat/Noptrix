import {
    z,
} from "zod";

import {
    ROLE_STATUSES,
} from "./role.model";


/*
|--------------------------------------------------------------------------
| Role ID
|--------------------------------------------------------------------------
*/

export const roleIdParamSchema =
    z.object({
        roleId: z
            .string()
            .trim()
            .min(
                1,
                "Role ID is required."
            ),
    });


/*
|--------------------------------------------------------------------------
| Create Role
|--------------------------------------------------------------------------
|
| Roles created through the OWNER API are always custom roles.
|
| System roles are controlled by the seed/system layer and must never
| be client-controlled through this API.
|
*/

export const createRoleSchema =
    z.object({

        name: z
            .string()
            .trim()
            .min(
                2,
                "Role name must be at least 2 characters."
            )
            .max(
                100,
                "Role name cannot exceed 100 characters."
            ),

        slug: z
            .string()
            .trim()
            .toLowerCase()
            .regex(
                /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                "Role slug can only contain lowercase letters, numbers, and hyphens."
            ),

        description: z
            .string()
            .trim()
            .max(
                500,
                "Role description cannot exceed 500 characters."
            )
            .optional(),
    });


/*
|--------------------------------------------------------------------------
| Update Role
|--------------------------------------------------------------------------
*/

export const updateRoleSchema =
    z.object({

        name: z
            .string()
            .trim()
            .min(
                2,
                "Role name must be at least 2 characters."
            )
            .max(
                100,
                "Role name cannot exceed 100 characters."
            )
            .optional(),

        slug: z
            .string()
            .trim()
            .toLowerCase()
            .regex(
                /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                "Role slug can only contain lowercase letters, numbers, and hyphens."
            )
            .optional(),

        description: z
            .string()
            .trim()
            .max(
                500,
                "Role description cannot exceed 500 characters."
            )
            .optional(),

        status: z
            .enum([
                ROLE_STATUSES.ACTIVE,
                ROLE_STATUSES.INACTIVE,
            ])
            .optional(),

    }).refine(
        (data) =>
            Object.keys(data).length > 0,
        {
            message:
                "At least one field is required.",
        }
    );


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type RoleIdParam =
    z.infer<
        typeof roleIdParamSchema
    >;

export type CreateRoleValidatedInput =
    z.infer<
        typeof createRoleSchema
    >;

export type UpdateRoleValidatedInput =
    z.infer<
        typeof updateRoleSchema
    >;