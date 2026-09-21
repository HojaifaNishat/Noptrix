import {
    Router,
} from "express";

import {
    z,
} from "zod";

import {
    userAuth,
} from "../../middlewares/userAuth.middleware";

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
    userAuth,
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
    userAuth,
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
    userAuth,
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
    userAuth,
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
    userAuth,
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
    userAuth,
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
    userAuth,
    validate(
        permissionIdParamSchema
    ),
    getRolesForPermissionController
);

export default router;