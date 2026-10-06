import {
    Types,
} from "mongoose";

import {
    Message,
    type IMessageDocument,
} from "./message.model";

import {
    MESSAGE_STATUSES,
    type MessagePriority,
} from "./message.types";

import {
    User,
    USER_STATUSES,
} from "../../users/user.model";

import {
    Owner,
    OWNER_STATUSES,
} from "../../owners/owner.model";

import {
    Admin,
    ADMIN_STATUSES,
} from "../../admins/admin.model";

import {
    Role,
    ROLE_STATUSES,
} from "../../roles/role.model";

import {
    ApiError,
} from "../../../utils/ApiError";


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface CreateMessageServiceInput {
    recipientId: string;
    subject: string;
    body: string;
    priority?: MessagePriority;
    attachments?: {
        name: string;
        url: string;
        mimeType: string;
        size: number;
    }[];
}

export interface MessageListServiceInput {
    userId: string;
    page: number;
    limit: number;
    status?: string;
    priority?: string;
    search?: string;
}


/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const OWNER_HIERARCHY_LEVEL =
    Number.MAX_SAFE_INTEGER;


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const validateObjectId = (
    value: string,
    fieldName: string,
): Types.ObjectId => {

    if (!Types.ObjectId.isValid(value)) {
        throw ApiError.badRequest(
            `Invalid ${fieldName}.`,
            {
                code:
                    "INVALID_OBJECT_ID",
            },
        );
    }

    return new Types.ObjectId(value);
};


const validateActiveUser = async (
    userId: Types.ObjectId,
): Promise<void> => {

    const user =
        await User.findById(
            userId,
        )
            .select("_id status")
            .lean()
            .exec();

    if (!user) {
        throw ApiError.notFound(
            "User not found.",
            {
                code:
                    "USER_NOT_FOUND",
            },
        );
    }

    if (
        user.status !==
        USER_STATUSES.ACTIVE
    ) {
        throw ApiError.forbidden(
            "The user account is not active.",
            {
                code:
                    "USER_NOT_ACTIVE",
            },
        );
    }
};


/*
|--------------------------------------------------------------------------
| Get Account Hierarchy
|--------------------------------------------------------------------------
|
| OWNER is outside the Role collection and therefore receives the
| highest possible hierarchy level.
|
| ADMIN accounts use:
|
| User → Admin → Role
|
*/

const getAccountHierarchyLevel =
    async (
        userId: Types.ObjectId,
    ): Promise<number> => {

        const owner =
            await Owner.findOne({
                userId,
                status:
                    OWNER_STATUSES.ACTIVE,
            })
                .select("_id userId status")
                .lean()
                .exec();

        if (owner) {
            return OWNER_HIERARCHY_LEVEL;
        }


        const admin =
            await Admin.findOne({
                userId,
                status:
                    ADMIN_STATUSES.ACTIVE,
            })
                .select(
                    "_id userId roleId status",
                )
                .lean()
                .exec();

        if (!admin) {
            throw ApiError.forbidden(
                "Only OWNER and active ADMIN accounts can use internal messaging.",
                {
                    code:
                        "COMMUNICATION_ACCOUNT_FORBIDDEN",
                },
            );
        }


        const role =
            await Role.findOne({
                _id:
                    admin.roleId,
                status:
                    ROLE_STATUSES.ACTIVE,
            })
                .select(
                    "_id slug hierarchyLevel status",
                )
                .lean()
                .exec();

        if (!role) {
            throw ApiError.forbidden(
                "The admin role is missing or inactive.",
                {
                    code:
                        "ADMIN_ROLE_INVALID",
                },
            );
        }


        return role.hierarchyLevel;
    };


/*
|--------------------------------------------------------------------------
| Verify Internal Communication Authority
|--------------------------------------------------------------------------
|
| Higher hierarchy → lower hierarchy
| Same hierarchy       → allowed
| Lower hierarchy      → forbidden
|
*/

const assertCanMessage =
    async (
        senderId: Types.ObjectId,
        recipientId: Types.ObjectId,
    ): Promise<void> => {

        if (
            senderId.equals(
                recipientId,
            )
        ) {
            throw ApiError.badRequest(
                "You cannot send a message to yourself.",
                {
                    code:
                        "SELF_MESSAGE_FORBIDDEN",
                },
            );
        }


        await validateActiveUser(
            senderId,
        );

        await validateActiveUser(
            recipientId,
        );


        const senderLevel =
            await getAccountHierarchyLevel(
                senderId,
            );

        const recipientLevel =
            await getAccountHierarchyLevel(
                recipientId,
            );


        if (
            senderLevel <
            recipientLevel
        ) {
            throw ApiError.forbidden(
                "You cannot send an internal message to a higher-level account.",
                {
                    code:
                        "MESSAGE_HIERARCHY_FORBIDDEN",
                },
            );
        }
    };


/*
|--------------------------------------------------------------------------
| Create Message
|--------------------------------------------------------------------------
*/

export const createMessage =
    async (
        senderId: string,
        data: CreateMessageServiceInput,
    ): Promise<IMessageDocument> => {

        const senderObjectId =
            validateObjectId(
                senderId,
                "sender ID",
            );

        const recipientObjectId =
            validateObjectId(
                data.recipientId,
                "recipient ID",
            );


        await assertCanMessage(
            senderObjectId,
            recipientObjectId,
        );


        const message =
            await Message.create({
                senderId:
                    senderObjectId,

                recipientId:
                    recipientObjectId,

                subject:
                    data.subject.trim(),

                body:
                    data.body.trim(),

                priority:
                    data.priority ?? "NORMAL",

                status:
                    MESSAGE_STATUSES.SENT,

                attachments:
                    data.attachments,
            });


        return message;
    };


/*
|--------------------------------------------------------------------------
| Get Inbox
|--------------------------------------------------------------------------
*/

export const getInbox =
    async (
        input: MessageListServiceInput,
    ): Promise<{
        messages: IMessageDocument[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }> => {

        const userObjectId =
            validateObjectId(
                input.userId,
                "user ID",
            );


        const filter: Record<
            string,
            unknown
        > = {
            recipientId:
                userObjectId,
        };


        if (input.status) {
            filter.status =
                input.status;
        }

        if (input.priority) {
            filter.priority =
                input.priority;
        }

        if (input.search) {
            const escapedSearch =
                input.search.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&",
                );

            filter.$or = [
                {
                    subject: {
                        $regex:
                            escapedSearch,
                        $options: "i",
                    },
                },
                {
                    body: {
                        $regex:
                            escapedSearch,
                        $options: "i",
                    },
                },
            ];
        }


        const skip =
            (input.page - 1) *
            input.limit;


        const [
            messages,
            total,
        ] = await Promise.all([
            Message.find(filter)
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(input.limit)
                .exec(),

            Message.countDocuments(
                filter,
            ),
        ]);


        return {
            messages,
            page: input.page,
            limit: input.limit,
            total,
            totalPages:
                Math.ceil(
                    total /
                    input.limit,
                ),
        };
    };


/*
|--------------------------------------------------------------------------
| Get Sent Messages
|--------------------------------------------------------------------------
*/

export const getSentMessages =
    async (
        input: MessageListServiceInput,
    ): Promise<{
        messages: IMessageDocument[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }> => {

        const userObjectId =
            validateObjectId(
                input.userId,
                "user ID",
            );


        const filter: Record<
            string,
            unknown
        > = {
            senderId:
                userObjectId,
        };


        if (input.status) {
            filter.status =
                input.status;
        }

        if (input.priority) {
            filter.priority =
                input.priority;
        }

        if (input.search) {
            const escapedSearch =
                input.search.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&",
                );

            filter.$or = [
                {
                    subject: {
                        $regex:
                            escapedSearch,
                        $options: "i",
                    },
                },
                {
                    body: {
                        $regex:
                            escapedSearch,
                        $options: "i",
                    },
                },
            ];
        }


        const skip =
            (input.page - 1) *
            input.limit;


        const [
            messages,
            total,
        ] = await Promise.all([
            Message.find(filter)
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(input.limit)
                .exec(),

            Message.countDocuments(
                filter,
            ),
        ]);


        return {
            messages,
            page: input.page,
            limit: input.limit,
            total,
            totalPages:
                Math.ceil(
                    total /
                    input.limit,
                ),
        };
    };


/*
|--------------------------------------------------------------------------
| Get Message By ID
|--------------------------------------------------------------------------
*/

export const getMessageById =
    async (
        messageId: string,
        userId: string,
    ): Promise<IMessageDocument> => {

        const messageObjectId =
            validateObjectId(
                messageId,
                "message ID",
            );

        const userObjectId =
            validateObjectId(
                userId,
                "user ID",
            );


        const message =
            await Message.findOne({
                _id:
                    messageObjectId,

                $or: [
                    {
                        senderId:
                            userObjectId,
                    },
                    {
                        recipientId:
                            userObjectId,
                    },
                ],
            }).exec();


        if (!message) {
            throw ApiError.notFound(
                "Message not found.",
                {
                    code:
                        "MESSAGE_NOT_FOUND",
                },
            );
        }


        return message;
    };


/*
|--------------------------------------------------------------------------
| Mark As Read
|--------------------------------------------------------------------------
*/

export const markMessageAsRead =
    async (
        messageId: string,
        userId: string,
    ): Promise<IMessageDocument> => {

        const message =
            await getMessageById(
                messageId,
                userId,
            );

        const userObjectId =
            validateObjectId(
                userId,
                "user ID",
            );


        if (
            !message.recipientId.equals(
                userObjectId,
            )
        ) {
            throw ApiError.forbidden(
                "Only the recipient can mark a message as read.",
                {
                    code:
                        "MESSAGE_READ_FORBIDDEN",
                },
            );
        }


        if (
            message.status ===
            MESSAGE_STATUSES.DELETED
        ) {
            throw ApiError.badRequest(
                "Deleted messages cannot be marked as read.",
                {
                    code:
                        "MESSAGE_DELETED",
                },
            );
        }


        message.status =
            MESSAGE_STATUSES.READ;

        message.readAt =
            new Date();

        await message.save();

        return message;
    };


/*
|--------------------------------------------------------------------------
| Archive Message
|--------------------------------------------------------------------------
*/

export const archiveMessage =
    async (
        messageId: string,
        userId: string,
    ): Promise<IMessageDocument> => {

        const message =
            await getMessageById(
                messageId,
                userId,
            );


        if (
            message.status ===
            MESSAGE_STATUSES.DELETED
        ) {
            throw ApiError.badRequest(
                "Deleted messages cannot be archived.",
                {
                    code:
                        "MESSAGE_DELETED",
                },
            );
        }


        message.status =
            MESSAGE_STATUSES.ARCHIVED;

        message.archivedAt =
            new Date();

        await message.save();

        return message;
    };


/*
|--------------------------------------------------------------------------
| Delete Message
|--------------------------------------------------------------------------
*/

export const deleteMessage =
    async (
        messageId: string,
        userId: string,
    ): Promise<void> => {

        const message =
            await getMessageById(
                messageId,
                userId,
            );


        if (
            message.status ===
            MESSAGE_STATUSES.DELETED
        ) {
            return;
        }


        message.status =
            MESSAGE_STATUSES.DELETED;

        message.deletedAt =
            new Date();

        await message.save();
    };
