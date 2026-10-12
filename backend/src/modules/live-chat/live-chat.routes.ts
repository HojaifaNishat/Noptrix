import { Router } from "express";

import { userAuth } from "../../middlewares/userAuth.middleware";
import { adminAuth } from "../../middlewares/adminAuth.middleware";
import {
    ownerAuth,
    ownerSecretVerified,
} from "../../middlewares/ownerAuth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";

import {
    createConversation,
    getMyConversations,
    getSupportInbox,
    getCustomerMessages,
    getSupportMessages,
    sendCustomerMessage,
    sendSupportMessage,
    markCustomerRead,
    markSupportRead,
    resolveSupportConversation,
    getOwnerSupportInbox,
    getOwnerSupportMessages,
    sendOwnerSupportMessage,
    markOwnerSupportRead,
    resolveOwnerSupportConversation,
    assignOwnerSupportConversation,
} from "./live-chat.controller";

const router = Router();

// Customer endpoints: authentication and ownership are checked server-side.
router.post("/", userAuth, asyncHandler(createConversation));
router.get("/mine", userAuth, asyncHandler(getMyConversations));
router.get(
    "/:conversationId/messages",
    userAuth,
    asyncHandler(getCustomerMessages),
);
router.post(
    "/:conversationId/messages",
    userAuth,
    asyncHandler(sendCustomerMessage),
);
router.patch(
    "/:conversationId/read",
    userAuth,
    asyncHandler(markCustomerRead),
);

// Support endpoints: service verifies active admin, role and permissions.
router.get(
    "/support/inbox",
    adminAuth,
    asyncHandler(getSupportInbox),
);
router.get(
    "/support/:conversationId/messages",
    adminAuth,
    asyncHandler(getSupportMessages),
);
router.post(
    "/support/:conversationId/messages",
    adminAuth,
    asyncHandler(sendSupportMessage),
);
router.patch(
    "/support/:conversationId/read",
    adminAuth,
    asyncHandler(markSupportRead),
);
router.patch(
    "/support/:conversationId/resolve",
    adminAuth,
    asyncHandler(resolveSupportConversation),
);


// OWNER endpoints require both OWNER authentication and verified secret.
router.get(
    "/owner/inbox",
    ownerAuth,
    ownerSecretVerified,
    asyncHandler(getOwnerSupportInbox),
);
router.get(
    "/owner/:conversationId/messages",
    ownerAuth,
    ownerSecretVerified,
    asyncHandler(getOwnerSupportMessages),
);
router.post(
    "/owner/:conversationId/messages",
    ownerAuth,
    ownerSecretVerified,
    asyncHandler(sendOwnerSupportMessage),
);
router.patch(
    "/owner/:conversationId/read",
    ownerAuth,
    ownerSecretVerified,
    asyncHandler(markOwnerSupportRead),
);
router.patch(
    "/owner/:conversationId/resolve",
    ownerAuth,
    ownerSecretVerified,
    asyncHandler(resolveOwnerSupportConversation),
);

router.patch(
    "/owner/:conversationId/assign",
    ownerAuth,
    ownerSecretVerified,
    asyncHandler(assignOwnerSupportConversation),
);

export default router;
