import {
    Request,
    Response,
} from "express";

import {
    createMessage,
    getInbox,
    getSentMessages,
    getMessageById,
    markMessageAsRead,
    archiveMessage,
    deleteMessage,
} from "./message.service";

import {
    getAuthenticatedAdminId,
} from "../../../middlewares/adminAuth.middleware";

import {
    getAuthenticatedOwnerUserId,
} from "../../../middlewares/ownerAuth.middleware";

import {
    ApiError,
} from "../../../utils/ApiError";


/*
|--------------------------------------------------------------------------
| Authenticated User ID
|--------------------------------------------------------------------------
*/

const getAuthenticatedUserId = (
    req: Request,
): string => {
    if (req.ownerAuth) {
        return getAuthenticatedOwnerUserId(req);
    }

    if (req.adminAuth) {
        return getAuthenticatedAdminId(req);
    }

    throw new ApiError(
        "Authentication is required.",
        {
            statusCode: 401,
        },
    );
};


/*
|--------------------------------------------------------------------------
| Create Message
|--------------------------------------------------------------------------
*/

export const createMessageController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const senderId =
        getAuthenticatedUserId(req);

    const message =
        await createMessage(
            senderId,
            {
                recipientId: req.body.recipientId,
                subject: req.body.subject,
                body: req.body.body,
                priority: req.body.priority,
                attachments: req.body.attachments,
            },
        );

    res.status(201).json({
        success: true,
        message: "Message sent successfully.",
        data: message,
    });
};


/*
|--------------------------------------------------------------------------
| Inbox
|--------------------------------------------------------------------------
*/

export const getMessageInboxController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const recipientId =
        getAuthenticatedUserId(req);

    const result =
        await getInbox({
            userId: recipientId,
            page: req.query.page
                ? Number(req.query.page)
                : 1,
            limit: req.query.limit
                ? Number(req.query.limit)
                : 20,
            status:
                typeof req.query.status === "string"
                    ? req.query.status as any
                    : undefined,
            priority:
                typeof req.query.priority === "string"
                    ? req.query.priority as any
                    : undefined,
            search:
                typeof req.query.search === "string"
                    ? req.query.search
                    : undefined,
        });

    res.status(200).json({
        success: true,
        message: "Inbox retrieved successfully.",
        data: result,
    });
};


/*
|--------------------------------------------------------------------------
| Sent Messages
|--------------------------------------------------------------------------
*/

export const getSentMessagesController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const senderId =
        getAuthenticatedUserId(req);

    const result =
        await getSentMessages({
            userId: senderId,
            page: req.query.page
                ? Number(req.query.page)
                : 1,
            limit: req.query.limit
                ? Number(req.query.limit)
                : 20,
            status:
                typeof req.query.status === "string"
                    ? req.query.status as any
                    : undefined,
            priority:
                typeof req.query.priority === "string"
                    ? req.query.priority as any
                    : undefined,
            search:
                typeof req.query.search === "string"
                    ? req.query.search
                    : undefined,
        });

    res.status(200).json({
        success: true,
        message: "Sent messages retrieved successfully.",
        data: result,
    });
};


/*
|--------------------------------------------------------------------------
| Get Message
|--------------------------------------------------------------------------
*/

export const getMessageController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const userId =
        getAuthenticatedUserId(req);

    const message =
        await getMessageById(
            typeof req.params.messageId === "string"
                ? req.params.messageId
                : req.params.messageId[0],
            userId,
        );

    res.status(200).json({
        success: true,
        message: "Message retrieved successfully.",
        data: message,
    });
};


/*
|--------------------------------------------------------------------------
| Mark As Read
|--------------------------------------------------------------------------
*/

export const markMessageAsReadController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const userId =
        getAuthenticatedUserId(req);

    const message =
        await markMessageAsRead(
            typeof req.params.messageId === "string"
                ? req.params.messageId
                : req.params.messageId[0],
            userId,
        );

    res.status(200).json({
        success: true,
        message: "Message marked as read.",
        data: message,
    });
};


/*
|--------------------------------------------------------------------------
| Archive Message
|--------------------------------------------------------------------------
*/

export const archiveMessageController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const userId =
        getAuthenticatedUserId(req);

    const message =
        await archiveMessage(
            typeof req.params.messageId === "string"
                ? req.params.messageId
                : req.params.messageId[0],
            userId,
        );

    res.status(200).json({
        success: true,
        message: "Message archived successfully.",
        data: message,
    });
};


/*
|--------------------------------------------------------------------------
| Delete Message
|--------------------------------------------------------------------------
*/

export const deleteMessageController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const userId =
        getAuthenticatedUserId(req);

    const message =
        await deleteMessage(
            typeof req.params.messageId === "string"
                ? req.params.messageId
                : req.params.messageId[0],
            userId,
        );

    res.status(200).json({
        success: true,
        message: "Message deleted successfully.",
        data: message,
    });
};
