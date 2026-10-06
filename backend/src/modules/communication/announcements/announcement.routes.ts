import {
    Router,
    type Request,
    type Response,
    type NextFunction,
} from "express";

import {
    ownerOrAdminAuth,
} from "../../../middlewares/ownerOrAdminAuth.middleware";

import {
    ownerSecretVerified,
} from "../../../middlewares/ownerAuth.middleware";

import {
    adminSecretVerified,
} from "../../../middlewares/adminAuth.middleware";

import {
    validateRequest,
} from "../../../middlewares/validation.middleware";

import {
    createAnnouncementSchema,
    updateAnnouncementSchema,
    announcementIdParamSchema,
    announcementListQuerySchema,
    announcementRecipientListQuerySchema,
} from "./announcement.validator";

import {
    createAnnouncementController,
    getAnnouncementsController,
    getAnnouncementController,
    updateAnnouncementController,
    publishAnnouncementController,
    archiveAnnouncementController,
    getMyAnnouncementsController,
    getMyAnnouncementController,
    markAnnouncementAsReadController,
    dismissAnnouncementController,
} from "./announcement.controller";


const router = Router();


/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
|
| OWNER:
|     ownerOrAdminAuth
|     + ownerSecretVerified
|
| ADMIN:
|     ownerOrAdminAuth
|     + adminSecretVerified
|
|--------------------------------------------------------------------------
*/

const requireVerifiedAdministrativeAccess = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    if (req.ownerAuth) {
        ownerSecretVerified(
            req,
            res,
            next,
        );

        return;
    }

    if (req.adminAuth) {
        adminSecretVerified(
            req,
            res,
            next,
        );

        return;
    }

    res.status(401).json({
        success: false,
        message:
            "Administrative authentication required.",
    });
};


/*
|--------------------------------------------------------------------------
| Create Announcement
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    ownerOrAdminAuth,
    requireVerifiedAdministrativeAccess,
    validateRequest({
        body: createAnnouncementSchema,
    }),
    createAnnouncementController,
);


/*
|--------------------------------------------------------------------------
| My Announcements
|--------------------------------------------------------------------------
|
| Must be declared before /:announcementId.
|
*/

router.get(
    "/mine",
    ownerOrAdminAuth,
    requireVerifiedAdministrativeAccess,
    validateRequest({
        query: announcementRecipientListQuerySchema,
    }),
    getMyAnnouncementsController,
);


/*
|--------------------------------------------------------------------------
| My Announcement By ID
|--------------------------------------------------------------------------
*/

router.get(
    "/mine/:announcementId",
    ownerOrAdminAuth,
    requireVerifiedAdministrativeAccess,
    validateRequest({
        params: announcementIdParamSchema,
    }),
    getMyAnnouncementController,
);


/*
|--------------------------------------------------------------------------
| Announcement List
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    ownerOrAdminAuth,
    requireVerifiedAdministrativeAccess,
    validateRequest({
        query: announcementListQuerySchema,
    }),
    getAnnouncementsController,
);


/*
|--------------------------------------------------------------------------
| Get Announcement
|--------------------------------------------------------------------------
*/

router.get(
    "/:announcementId",
    ownerOrAdminAuth,
    requireVerifiedAdministrativeAccess,
    validateRequest({
        params: announcementIdParamSchema,
    }),
    getAnnouncementController,
);


/*
|--------------------------------------------------------------------------
| Update Announcement
|--------------------------------------------------------------------------
*/

router.patch(
    "/:announcementId",
    ownerOrAdminAuth,
    requireVerifiedAdministrativeAccess,
    validateRequest({
        params: announcementIdParamSchema,
        body: updateAnnouncementSchema,
    }),
    updateAnnouncementController,
);


/*
|--------------------------------------------------------------------------
| Publish Announcement
|--------------------------------------------------------------------------
*/

router.post(
    "/:announcementId/publish",
    ownerOrAdminAuth,
    requireVerifiedAdministrativeAccess,
    validateRequest({
        params: announcementIdParamSchema,
    }),
    publishAnnouncementController,
);


/*
|--------------------------------------------------------------------------
| Archive Announcement
|--------------------------------------------------------------------------
*/

router.patch(
    "/:announcementId/archive",
    ownerOrAdminAuth,
    requireVerifiedAdministrativeAccess,
    validateRequest({
        params: announcementIdParamSchema,
    }),
    archiveAnnouncementController,
);


/*
|--------------------------------------------------------------------------
| Mark Announcement As Read
|--------------------------------------------------------------------------
*/

router.patch(
    "/:announcementId/read",
    ownerOrAdminAuth,
    requireVerifiedAdministrativeAccess,
    validateRequest({
        params: announcementIdParamSchema,
    }),
    markAnnouncementAsReadController,
);


/*
|--------------------------------------------------------------------------
| Dismiss Announcement
|--------------------------------------------------------------------------
*/

router.patch(
    "/:announcementId/dismiss",
    ownerOrAdminAuth,
    requireVerifiedAdministrativeAccess,
    validateRequest({
        params: announcementIdParamSchema,
    }),
    dismissAnnouncementController,
);


export default router;
