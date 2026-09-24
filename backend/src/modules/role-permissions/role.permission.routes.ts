import {
    Router,
} from "express";

import {
    z,
} from "zod";

import {
    ownerAuth,
    ownerSecretVerified,
} from "../../middlewares/ownerAuth.middleware";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    assignPermissionController,
    removePermissionController,
    getRolePermissionsController,
    getRolePermissionKeysController,
    getRolesForPermissionController,
    bulkAssignPermissionsController,
    bulkRemovePermissionsController,
} from "./role.permission.controller";

const router = Router();

/*
|--------------------------------------------------------------------------
| OWNER-Only Access
|--------------------------------------------------------------------------
|
| Role-Permission management is a sensitive system-level operation.
|
| ownerAuth
|     ↓
| Verifies OWNER access token
|
| ownerSecretVerified
|     ↓
| Requires successful OWNER secret-code verification
|
*/

const ownerOnly = [
    ownerAuth,
    ownerSecretVerified,
];

/*
|--------------------------------------------------------------------------
| Validation Schemas
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Assign / Remove Permission
|--------------------------------------------------------------------------
*/

const assignPermissionSchema =
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

const bulkPermissionSchema =
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

const roleIdParamSchema =
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

const permissionIdParamSchema =
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
| Assign Permission
|--------------------------------------------------------------------------
*/

router.post(
    "/assign",
    ...ownerOnly,
    validate(
        assignPermissionSchema,
        "body"
    ),
    assignPermissionController
);

/*
|--------------------------------------------------------------------------
| Remove Permission
|--------------------------------------------------------------------------
*/

router.delete(
    "/remove",
    ...ownerOnly,
    validate(
        assignPermissionSchema,
        "body"
    ),
    removePermissionController
);

/*
|--------------------------------------------------------------------------
| Bulk Assign Permissions
|--------------------------------------------------------------------------
*/

router.post(
    "/bulk-assign",
    ...ownerOnly,
    validate(
        bulkPermissionSchema,
        "body"
    ),
    bulkAssignPermissionsController
);

/*
|--------------------------------------------------------------------------
| Bulk Remove Permissions
|--------------------------------------------------------------------------
*/

router.delete(
    "/bulk-remove",
    ...ownerOnly,
    validate(
        bulkPermissionSchema,
        "body"
    ),
    bulkRemovePermissionsController
);

/*
|--------------------------------------------------------------------------
| Get Role Permissions
|--------------------------------------------------------------------------
*/

router.get(
    "/role/:roleId",
    ...ownerOnly,
    validate(
        roleIdParamSchema,
        "params"
    ),
    getRolePermissionsController
);

/*
|--------------------------------------------------------------------------
| Get Role Permission Keys
|--------------------------------------------------------------------------
*/

router.get(
    "/role/:roleId/keys",
    ...ownerOnly,
    validate(
        roleIdParamSchema,
        "params"
    ),
    getRolePermissionKeysController
);

/*
|--------------------------------------------------------------------------
| Get Roles For Permission
|--------------------------------------------------------------------------
*/

router.get(
    "/permission/:permissionId/roles",
    ...ownerOnly,
    validate(
        permissionIdParamSchema,
        "params"
    ),
    getRolesForPermissionController
);

export default router;