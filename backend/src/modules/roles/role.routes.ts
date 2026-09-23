import {
    Router,
} from "express";

import {
    ownerAuth,
    ownerSecretVerified,
} from "../../middlewares/ownerAuth.middleware";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    createRoleController,
    getAllRolesController,
    getRoleController,
    updateRoleController,
    activateRoleController,
    deactivateRoleController,
    deleteRoleController,
} from "./role.controller";

import {
    createRoleSchema,
    updateRoleSchema,
    roleIdParamSchema,
} from "./role.validator";


/*
|--------------------------------------------------------------------------
| Router
|--------------------------------------------------------------------------
*/

const router =
    Router();


/*
|--------------------------------------------------------------------------
| OWNER Authentication
|--------------------------------------------------------------------------
|
| Every role-management endpoint belongs to OWNER.
|
| ownerAuth
|   → verifies OWNER access token
|
| ownerSecretVerified
|   → requires successful secret-code verification
|
*/

const ownerOnly = [
    ownerAuth,
    ownerSecretVerified,
];


/*
|--------------------------------------------------------------------------
| Create Role
|--------------------------------------------------------------------------
|
| POST /api/roles
|
*/

router.post(
    "/",
    ...ownerOnly,
    validate(
        createRoleSchema,
        "body"
    ),
    createRoleController
);


/*
|--------------------------------------------------------------------------
| Get All Roles
|--------------------------------------------------------------------------
|
| GET /api/roles
|
*/

router.get(
    "/",
    ...ownerOnly,
    getAllRolesController
);


/*
|--------------------------------------------------------------------------
| Get Role By ID
|--------------------------------------------------------------------------
|
| GET /api/roles/:roleId
|
*/

router.get(
    "/:roleId",
    ...ownerOnly,
    validate(
        roleIdParamSchema,
        "params"
    ),
    getRoleController
);


/*
|--------------------------------------------------------------------------
| Update Role
|--------------------------------------------------------------------------
|
| PATCH /api/roles/:roleId
|
*/

router.patch(
    "/:roleId",
    ...ownerOnly,
    validate(
        roleIdParamSchema,
        "params"
    ),
    validate(
        updateRoleSchema,
        "body"
    ),
    updateRoleController
);


/*
|--------------------------------------------------------------------------
| Activate Role
|--------------------------------------------------------------------------
|
| PATCH /api/roles/:roleId/activate
|
*/

router.patch(
    "/:roleId/activate",
    ...ownerOnly,
    validate(
        roleIdParamSchema,
        "params"
    ),
    activateRoleController
);


/*
|--------------------------------------------------------------------------
| Deactivate Role
|--------------------------------------------------------------------------
|
| PATCH /api/roles/:roleId/deactivate
|
*/

router.patch(
    "/:roleId/deactivate",
    ...ownerOnly,
    validate(
        roleIdParamSchema,
        "params"
    ),
    deactivateRoleController
);


/*
|--------------------------------------------------------------------------
| Delete Role
|--------------------------------------------------------------------------
|
| DELETE /api/roles/:roleId
|
*/

router.delete(
    "/:roleId",
    ...ownerOnly,
    validate(
        roleIdParamSchema,
        "params"
    ),
    deleteRoleController
);


export default router;