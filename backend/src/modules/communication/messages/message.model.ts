import {
    Document,
    Model,
    Schema,
    Types,
    model,
} from "mongoose";

import {
    IMessage,
    MESSAGE_PRIORITIES,
    MESSAGE_STATUSES,
    MessagePriority,
    MessageStatus,
    MessageAttachment,
} from "./message.types";

/*
|--------------------------------------------------------------------------
| Message Document
|--------------------------------------------------------------------------
*/

export interface IMessageDocument
    extends IMessage,
        Document {}

/*
|--------------------------------------------------------------------------
| Message Model
|--------------------------------------------------------------------------
*/

export type MessageModel =
    Model<IMessageDocument>;

/*
|--------------------------------------------------------------------------
| Attachment Schema
|--------------------------------------------------------------------------
*/

const attachmentSchema =
    new Schema<MessageAttachment>(
        {
            name: {
                type: String,
                required: true,
                trim: true,
                maxlength: 255,
            },

            url: {
                type: String,
                required: true,
                trim: true,
            },

            mimeType: {
                type: String,
                required: true,
                trim: true,
                maxlength: 150,
            },

            size: {
                type: Number,
                required: true,
                min: 0,
            },
        },
        {
            _id: false,
            versionKey: false,
        },
    );

/*
|--------------------------------------------------------------------------
| Message Schema
|--------------------------------------------------------------------------
*/

const messageSchema =
    new Schema<IMessageDocument>(
        {
            senderId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: [
                    true,
                    "Sender ID is required.",
                ],
                index: true,
            },

            recipientId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: [
                    true,
                    "Recipient ID is required.",
                ],
                index: true,
            },

            subject: {
                type: String,
                required: [
                    true,
                    "Message subject is required.",
                ],
                trim: true,
                minlength: [
                    1,
                    "Message subject cannot be empty.",
                ],
                maxlength: [
                    250,
                    "Message subject cannot exceed 250 characters.",
                ],
            },

            body: {
                type: String,
                required: [
                    true,
                    "Message body is required.",
                ],
                trim: true,
                minlength: [
                    1,
                    "Message body cannot be empty.",
                ],
                maxlength: [
                    10000,
                    "Message body cannot exceed 10000 characters.",
                ],
            },

            priority: {
                type: String,
                enum: {
                    values:
                        Object.values(
                            MESSAGE_PRIORITIES,
                        ),
                    message:
                        "Invalid message priority.",
                },
                default:
                    MESSAGE_PRIORITIES.NORMAL,
                index: true,
            },

            status: {
                type: String,
                enum: {
                    values:
                        Object.values(
                            MESSAGE_STATUSES,
                        ),
                    message:
                        "Invalid message status.",
                },
                default:
                    MESSAGE_STATUSES.SENT,
                index: true,
            },

            attachments: {
                type: [
                    attachmentSchema,
                ],
                default: undefined,
            },

            readAt: {
                type: Date,
            },

            archivedAt: {
                type: Date,
            },

            deletedAt: {
                type: Date,
            },
        },
        {
            timestamps: true,
            versionKey: false,
        },
    );

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

messageSchema.index(
    {
        recipientId: 1,
        status: 1,
        createdAt: -1,
    },
    {
        name:
            "message_recipient_status_createdAt",
    },
);

messageSchema.index(
    {
        senderId: 1,
        createdAt: -1,
    },
    {
        name:
            "message_sender_createdAt",
    },
);

messageSchema.index(
    {
        recipientId: 1,
        readAt: 1,
        createdAt: -1,
    },
    {
        name:
            "message_recipient_read_createdAt",
    },
);

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

export const Message =
    model<
        IMessageDocument,
        MessageModel
    >(
        "Message",
        messageSchema,
    );
