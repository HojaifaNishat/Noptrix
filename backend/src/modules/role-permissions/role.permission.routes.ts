import {
    Router,
} from "express";

import {
    z,
} from "zod";

import {
    adminAuth,
    adminSecretVerified,
    requireOwnerAccess,
} from "../../middlewares/adminAuth.middleware";

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

const ownerOnly = [
    adminAuth,
    adminSecretVerified,
    requireOwnerAccess,
];

/*
|--------------------------------------------------------------------------
| Validation Schemas
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Body Schemas
|--------------------------------------------------------------------------
*/

const assignPermissionSchema =
    z.object({
        roleId: z.string().min(
            1,
            "Role ID is required."
        ),

        permissionId: z.string().min(
            1,
            "Permission ID is required."
        ),
    });

const bulkPermissionSchema =
    z.object({
        roleId: z.string().min(
            1,
            "Role ID is required."
        ),

        permissionIds: z
            .array(
                z.string().min(1)
            )
            .min(
                1,
                "At least one permission ID is required."
            ),
    });

/*
|--------------------------------------------------------------------------
| Params Schemas
|--------------------------------------------------------------------------
*/

const roleIdParamSchema =
    z.object({
        roleId: z.string().min(
            1,
            "Role ID is required."
        ),
    });

const permissionIdParamSchema =
    z.object({
        permissionId: z.string().min(
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
        assignPermissionSchema
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
        assignPermissionSchema
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
        bulkPermissionSchema
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
        bulkPermissionSchema
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
        roleIdParamSchema
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
        roleIdParamSchema
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
        permissionIdParamSchema
    ),
    getRolesForPermissionController
);

export default router;