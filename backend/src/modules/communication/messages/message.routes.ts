import {
    Router,
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
    createMessageSchema,
    messageIdParamSchema,
    messageListQuerySchema,
} from "./message.validator";

import {
    createMessageController,
    getMessageInboxController,
    getSentMessagesController,
    getMessageController,
    markMessageAsReadController,
    archiveMessageController,
    deleteMessageController,
} from "./message.controller";


const router =
    Router();


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

const requireVerifiedAdministrativeAccess =
    (
        req: Parameters<
            typeof ownerOrAdminAuth
        >[0],
        res: Parameters<
            typeof ownerOrAdminAuth
        >[1],
        next: Parameters<
            typeof ownerOrAdminAuth
        >[2],
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
| Send Message
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    ownerOrAdminAuth,
    requireVerifiedAdministrativeAccess,
    validateRequest({
        body: createMessageSchema,
    }),
    createMessageController,
);


/*
|--------------------------------------------------------------------------
| Inbox
|--------------------------------------------------------------------------
*/

router.get(
    "/inbox",
    ownerOrAdminAuth,
    requireVerifiedAdministrativeAccess,
    validateRequest({
        query: messageListQuerySchema,
    }),
    getMessageInboxController,
);


/*
|--------------------------------------------------------------------------
| Sent Messages
|--------------------------------------------------------------------------
*/

router.get(
    "/sent",
    ownerOrAdminAuth,
    requireVerifiedAdministrativeAccess,
    validateRequest({
        query: messageListQuerySchema,
    }),
    getSentMessagesController,
);


/*
|--------------------------------------------------------------------------
| Get Message
|--------------------------------------------------------------------------
*/

router.get(
    "/:messageId",
    ownerOrAdminAuth,
    requireVerifiedAdministrativeAccess,
    validateRequest({
        params: messageIdParamSchema,
    }),
    getMessageController,
);


/*
|--------------------------------------------------------------------------
| Mark As Read
|--------------------------------------------------------------------------
*/

router.patch(
    "/:messageId/read",
    ownerOrAdminAuth,
    requireVerifiedAdministrativeAccess,
    validateRequest({
        params: messageIdParamSchema,
    }),
    markMessageAsReadController,
);


/*
|--------------------------------------------------------------------------
| Archive
|--------------------------------------------------------------------------
*/

router.patch(
    "/:messageId/archive",
    ownerOrAdminAuth,
    requireVerifiedAdministrativeAccess,
    validateRequest({
        params: messageIdParamSchema,
    }),
    archiveMessageController,
);


/*
|--------------------------------------------------------------------------
| Delete
|--------------------------------------------------------------------------
*/

router.delete(
    "/:messageId",
    ownerOrAdminAuth,
    requireVerifiedAdministrativeAccess,
    validateRequest({
        params: messageIdParamSchema,
    }),
    deleteMessageController,
);


export default router;
