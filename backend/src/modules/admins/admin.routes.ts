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
    uploadSingleImage,
} from "../../middlewares/upload.middleware";

import {
    getAllAdminsController,
    getAdminController,
    getAdminByUserController,
    getMyAdminController,
    getMyAdminProfileController,
    uploadMyAdminAvatarController,
    removeMyAdminAvatarController,
    updateAdminController,
    ensureAdminCanLoginController,
    requireAdminByUserController,
} from "./admin.controller";

import {
    adminIdParamSchema,
    userIdParamSchema,
    updateAdminSchema,
} from "./admin.validator";


const router =
    Router();


/*
|--------------------------------------------------------------------------
| Owner Management
|--------------------------------------------------------------------------
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
 * GET /api/admins/me/profile
 */
router.get(
    "/me/profile",
    adminAuth,
    getMyAdminProfileController,
);


/*
 * POST /api/admins/me/avatar
 */
router.post(
    "/me/avatar",
    adminAuth,
    uploadSingleImage,
    uploadMyAdminAvatarController,
);


/*
 * DELETE /api/admins/me/avatar
 */
router.delete(
    "/me/avatar",
    adminAuth,
    removeMyAdminAvatarController,
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
