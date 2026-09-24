import {
    z,
} from "zod";

/*
|--------------------------------------------------------------------------
| Assign / Remove Permission
|--------------------------------------------------------------------------
*/

export const assignPermissionSchema =
    z.object({
        roleId: z
            .string()
            .trim()
            .min(
                1,
                "Role ID is required."
            ),

        permissionId: z
            .string()
            .trim()
            .min(
                1,
                "Permission ID is required."
            ),
    });

/*
|--------------------------------------------------------------------------
| Bulk Permission Operations
|--------------------------------------------------------------------------
*/

export const bulkPermissionSchema =
    z.object({
        roleId: z
            .string()
            .trim()
            .min(
                1,
                "Role ID is required."
            ),

        permissionIds: z
            .array(
                z
                    .string()
                    .trim()
                    .min(
                        1,
                        "Permission ID cannot be empty."
                    )
            )
            .min(
                1,
                "At least one permission ID is required."
            ),
    });

/*
|--------------------------------------------------------------------------
| Role ID Params
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
| Permission ID Params
|--------------------------------------------------------------------------
*/

export const permissionIdParamSchema =
    z.object({
        permissionId: z
            .string()
            .trim()
            .min(
                1,
                "Permission ID is required."
            ),
    });

/*
|--------------------------------------------------------------------------
| Inferred Types
|--------------------------------------------------------------------------
*/

export type AssignPermissionInput =
    z.infer<
        typeof assignPermissionSchema
    >;

export type BulkPermissionInput =
    z.infer<
        typeof bulkPermissionSchema
    >;

export type RoleIdParam =
    z.infer<
        typeof roleIdParamSchema
    >;

export type PermissionIdParam =
    z.infer<
        typeof permissionIdParamSchema
    >;