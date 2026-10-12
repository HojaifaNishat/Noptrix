import type { Request, Response } from "express";

import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import {
    getAuthenticatedUserId,
} from "../../middlewares/userAuth.middleware";
import {
    getAuthenticatedAdminId,
} from "../../middlewares/adminAuth.middleware";
import {
    getAuthenticatedOwnerUserId,
} from "../../middlewares/ownerAuth.middleware";

import { notifyLiveChatAssignment } from "./live-chat.socket";

import {
    createCustomerConversation,
    listCustomerConversations,
    listSupportInbox,
    listConversationMessages,
    sendConversationMessage,
    markConversationRead,
    resolveConversation,
    assignConversationToAdmin,
} from "./live-chat.service";

const customerId = (req: Request): string => {
    const id = getAuthenticatedUserId(req);

    if (!id) {
        throw ApiError.unauthorized();
    }

    return id;
};

const adminId = (req: Request): string => {
    const id = getAuthenticatedAdminId(req);

    if (!id) {
        throw ApiError.unauthorized("Support authentication required.");
    }

    return id;
};

const ownerUserId = (req: Request): string => {
    const id = getAuthenticatedOwnerUserId(req);

    if (!id) {
        throw ApiError.unauthorized("OWNER authentication required.");
    }

    return id;
};

export const createConversation = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const data = await createCustomerConversation(customerId(req), req.body ?? {});

    res.status(201).json(
        new ApiResponse(data, {
            statusCode: 201,
            message: "Support conversation created.",
        }),
    );
};

export const getMyConversations = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const data = await listCustomerConversations(
        customerId(req),
        req.query.page,
        req.query.limit,
    );

    res.status(200).json(new ApiResponse(data));
};

export const getSupportInbox = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const data = await listSupportInbox(
        adminId(req),
        req.query.page,
        req.query.limit,
        req.query.status,
    );

    res.status(200).json(new ApiResponse(data));
};

export const getCustomerMessages = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const data = await listConversationMessages(
        (Array.isArray(req.params.conversationId) ? req.params.conversationId[0] : req.params.conversationId) ?? "",
        { id: customerId(req), type: "CUSTOMER" },
        req.query.page,
        req.query.limit,
    );

    res.status(200).json(new ApiResponse(data));
};

export const getSupportMessages = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const data = await listConversationMessages(
        (Array.isArray(req.params.conversationId) ? req.params.conversationId[0] : req.params.conversationId) ?? "",
        { id: adminId(req), type: "SUPPORT" },
        req.query.page,
        req.query.limit,
    );

    res.status(200).json(new ApiResponse(data));
};

export const sendCustomerMessage = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const data = await sendConversationMessage(
        (Array.isArray(req.params.conversationId) ? req.params.conversationId[0] : req.params.conversationId) ?? "",
        { id: customerId(req), type: "CUSTOMER" },
        req.body?.body,
    );

    res.status(201).json(
        new ApiResponse(data, {
            statusCode: 201,
            message: "Message sent.",
        }),
    );
};

export const sendSupportMessage = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const data = await sendConversationMessage(
        (Array.isArray(req.params.conversationId) ? req.params.conversationId[0] : req.params.conversationId) ?? "",
        { id: adminId(req), type: "SUPPORT" },
        req.body?.body,
    );

    res.status(201).json(
        new ApiResponse(data, {
            statusCode: 201,
            message: "Reply sent.",
        }),
    );
};

export const markCustomerRead = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const data = await markConversationRead(
        (Array.isArray(req.params.conversationId) ? req.params.conversationId[0] : req.params.conversationId) ?? "",
        { id: customerId(req), type: "CUSTOMER" },
    );

    res.status(200).json(new ApiResponse(data, { message: "Messages marked as read." }));
};

export const markSupportRead = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const data = await markConversationRead(
        (Array.isArray(req.params.conversationId) ? req.params.conversationId[0] : req.params.conversationId) ?? "",
        { id: adminId(req), type: "SUPPORT" },
    );

    res.status(200).json(new ApiResponse(data, { message: "Messages marked as read." }));
};


// OWNER support endpoints use the linked User ID as the support identity.
export const getOwnerSupportInbox = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const data = await listSupportInbox(
        ownerUserId(req),
        req.query.page,
        req.query.limit,
        req.query.status,
    );

    res.status(200).json(new ApiResponse(data));
};

export const getOwnerSupportMessages = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const data = await listConversationMessages(
        (Array.isArray(req.params.conversationId)
            ? req.params.conversationId[0]
            : req.params.conversationId) ?? "",
        { id: ownerUserId(req), type: "SUPPORT" },
        req.query.page,
        req.query.limit,
    );

    res.status(200).json(new ApiResponse(data));
};

export const sendOwnerSupportMessage = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const data = await sendConversationMessage(
        (Array.isArray(req.params.conversationId)
            ? req.params.conversationId[0]
            : req.params.conversationId) ?? "",
        { id: ownerUserId(req), type: "SUPPORT" },
        req.body?.body,
    );

    res.status(201).json(
        new ApiResponse(data, {
            statusCode: 201,
            message: "Reply sent.",
        }),
    );
};

export const markOwnerSupportRead = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const data = await markConversationRead(
        (Array.isArray(req.params.conversationId)
            ? req.params.conversationId[0]
            : req.params.conversationId) ?? "",
        { id: ownerUserId(req), type: "SUPPORT" },
    );

    res.status(200).json(
        new ApiResponse(data, { message: "Messages marked as read." }),
    );
};

export const resolveOwnerSupportConversation = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const data = await resolveConversation(
        (Array.isArray(req.params.conversationId)
            ? req.params.conversationId[0]
            : req.params.conversationId) ?? "",
        ownerUserId(req),
    );

    res.status(200).json(
        new ApiResponse(data, { message: "Conversation resolved." }),
    );
};

export const resolveSupportConversation = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const data = await resolveConversation(
        (Array.isArray(req.params.conversationId) ? req.params.conversationId[0] : req.params.conversationId) ?? "",
        adminId(req),
    );

    res.status(200).json(
        new ApiResponse(data, { message: "Conversation resolved." }),
    );
};

export const assignOwnerSupportConversation = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const conversationId = Array.isArray(req.params.conversationId)
        ? req.params.conversationId[0]
        : req.params.conversationId;

    const data = await assignConversationToAdmin(
        conversationId ?? "",
        ownerUserId(req),
        req.body?.adminId,
    );

    notifyLiveChatAssignment(data);

    res.status(200).json(
        new ApiResponse(data, {
            message: "Support conversation assigned successfully.",
        }),
    );
};
