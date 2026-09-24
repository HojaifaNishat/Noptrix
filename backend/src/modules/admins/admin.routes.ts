import {
    Router,
} from "express";

import {
    ownerAuth,
    ownerSecretVerified,
} from "../../middlewares/ownerAuth.middleware";

import {
    adminAuth,
} from "../../middlewares/adminAuth.middleware";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    getAllAdminsController,
    getAdminController,
    getAdminByUserController,
    getMyAdminController,
    createAdminController,
    updateAdminController,
    ensureAdminCanLoginController,
    requireAdminByUserController,
} from "./admin.controller";

import {
    adminIdParamSchema,
    userIdParamSchema,
    createAdminSchema,
    updateAdminSchema,
} from "./admin.validator";


const router =
    Router();


/*
|--------------------------------------------------------------------------
| Owner Management
|--------------------------------------------------------------------------
|
| Creating and managing Admin accounts
| is an Owner-level operation.
|
*/

const ownerOnly = [
    ownerAuth,
    ownerSecretVerified,
];


/*
|--------------------------------------------------------------------------
| Admin Self
|--------------------------------------------------------------------------
*/

/*
 * GET /api/admins/me
 */
router.get(
    "/me",
    adminAuth,
    getMyAdminController,
);


/*
|--------------------------------------------------------------------------
| Admin Management
|--------------------------------------------------------------------------
*/

/*
 * GET /api/admins
 */
router.get(
    "/",
    ...ownerOnly,
    getAllAdminsController,
);


/*
 * POST /api/admins
 */
router.post(
    "/",
    ...ownerOnly,
    validate(
        createAdminSchema,
        "body",
    ),
    createAdminController,
);


/*
 * GET /api/admins/:adminId
 */
router.get(
    "/:adminId",
    ...ownerOnly,
    validate(
        adminIdParamSchema,
        "params",
    ),
    getAdminController,
);


/*
 * PATCH /api/admins/:adminId
 */
router.patch(
    "/:adminId",
    ...ownerOnly,
    validate(
        adminIdParamSchema,
        "params",
    ),
    validate(
        updateAdminSchema,
        "body",
    ),
    updateAdminController,
);


/*
|--------------------------------------------------------------------------
| Admin Lookup
|--------------------------------------------------------------------------
*/

/*
 * GET /api/admins/user/:userId
 */
router.get(
    "/user/:userId",
    ...ownerOnly,
    validate(
        userIdParamSchema,
        "params",
    ),
    getAdminByUserController,
);


/*
 * GET /api/admins/user/:userId/require
 */
router.get(
    "/user/:userId/require",
    ...ownerOnly,
    validate(
        userIdParamSchema,
        "params",
    ),
    requireAdminByUserController,
);


/*
|--------------------------------------------------------------------------
| Admin Login Availability
|--------------------------------------------------------------------------
*/

/*
 * GET /api/admins/:adminId/login-status
 */
router.get(
    "/:adminId/login-status",
    ...ownerOnly,
    validate(
        adminIdParamSchema,
        "params",
    ),
    ensureAdminCanLoginController,
);


export default router;