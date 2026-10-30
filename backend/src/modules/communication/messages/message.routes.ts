import { Router } from "express";

import { ownerOrAdminAuth } from "../../../middlewares/ownerOrAdminAuth.middleware";

import { ownerSecretVerified } from "../../../middlewares/ownerAuth.middleware";

import { validateRequest } from "../../../middlewares/validation.middleware";
import { uploadCommon } from "../../../middlewares/upload.middleware";

import {
  createMessageSchema,
  messageIdParamSchema,
  messageListQuerySchema,
  messageRecipientsQuerySchema,
  messageReplySchema,
  messageBulkActionSchema,
} from "./message.validator";

import {
  createMessageController,
  getMessageInboxController,
  getSentMessagesController,
  getMessageController,
  markMessageAsReadController,
  archiveMessageController,
  deleteMessageController,
  getMessageRecipientsController,
  uploadMessageAttachmentsController,
  createMessageReplyController,
  getMessageThreadController,
  getUnreadMessageCountController,
  markMessageAsUnreadController,
  performBulkMessageActionController,
} from "./message.controller";

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
|
|--------------------------------------------------------------------------
*/

const requireAdministrativeAccess = (
  req: Parameters<typeof ownerOrAdminAuth>[0],
  res: Parameters<typeof ownerOrAdminAuth>[1],
  next: Parameters<typeof ownerOrAdminAuth>[2],
): void => {
  if (req.ownerAuth) {
    ownerSecretVerified(req, res, next);

    return;
  }

  if (req.adminAuth) {
    next();

    return;
  }

  res.status(401).json({
    success: false,
    message: "Administrative authentication required.",
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
  requireAdministrativeAccess,
  validateRequest({
    body: createMessageSchema,
  }),
  createMessageController,
);

router.post(
  "/attachments",
  ownerOrAdminAuth,
  requireAdministrativeAccess,
  uploadCommon.array("files", 10),
  uploadMessageAttachmentsController,
);

/*
|--------------------------------------------------------------------------
| Inbox
|--------------------------------------------------------------------------
*/

router.get(
  "/recipients",
  ownerOrAdminAuth,
  requireAdministrativeAccess,
  validateRequest({
    query: messageRecipientsQuerySchema,
  }),
  getMessageRecipientsController,
);

router.get(
  "/inbox",
  ownerOrAdminAuth,
  requireAdministrativeAccess,
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
  requireAdministrativeAccess,
  validateRequest({
    query: messageListQuerySchema,
  }),
  getSentMessagesController,
);

router.get(
  "/unread-count",
  ownerOrAdminAuth,
  requireAdministrativeAccess,
  getUnreadMessageCountController,
);

router.post(
  "/bulk-action",
  ownerOrAdminAuth,
  requireAdministrativeAccess,
  validateRequest({
    body: messageBulkActionSchema,
  }),
  performBulkMessageActionController,
);

/*
|--------------------------------------------------------------------------
| Get Message
|--------------------------------------------------------------------------
*/

router.get(
  "/:messageId/thread",
  ownerOrAdminAuth,
  requireAdministrativeAccess,
  validateRequest({
    params: messageIdParamSchema,
  }),
  getMessageThreadController,
);

router.post(
  "/:messageId/replies",
  ownerOrAdminAuth,
  requireAdministrativeAccess,
  validateRequest({
    params: messageIdParamSchema,
    body: messageReplySchema,
  }),
  createMessageReplyController,
);

router.get(
  "/:messageId",
  ownerOrAdminAuth,
  requireAdministrativeAccess,
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
  requireAdministrativeAccess,
  validateRequest({
    params: messageIdParamSchema,
  }),
  markMessageAsReadController,
);

router.patch(
  "/:messageId/unread",
  ownerOrAdminAuth,
  requireAdministrativeAccess,
  validateRequest({
    params: messageIdParamSchema,
  }),
  markMessageAsUnreadController,
);

/*
|--------------------------------------------------------------------------
| Archive
|--------------------------------------------------------------------------
*/

router.patch(
  "/:messageId/archive",
  ownerOrAdminAuth,
  requireAdministrativeAccess,
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
  requireAdministrativeAccess,
  validateRequest({
    params: messageIdParamSchema,
  }),
  deleteMessageController,
);

export default router;
