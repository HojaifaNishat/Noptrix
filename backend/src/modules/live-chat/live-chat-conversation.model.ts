import {
    Schema,
    model,
    models,
    Types,
    type HydratedDocument,
} from "mongoose";

import {
    LIVE_CHAT_STATUSES,
    type LiveChatStatus,
} from "./live-chat.types";

export interface ILiveChatConversation {
    customerId: Types.ObjectId;
    assignedAdminId?: Types.ObjectId;
    subject: string;
    status: LiveChatStatus;
    lastMessage?: string;
    lastMessageAt?: Date;
    lastMessageSenderId?: Types.ObjectId;
    customerUnreadCount: number;
    supportUnreadCount: number;
    resolvedAt?: Date;
    closedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export type LiveChatConversationDocument =
    HydratedDocument<ILiveChatConversation>;

const liveChatConversationSchema =
    new Schema<ILiveChatConversation>(
        {
            customerId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },

            assignedAdminId: {
                type: Schema.Types.ObjectId,
                ref: "User",
            },

            subject: {
                type: String,
                trim: true,
                minlength: 2,
                maxlength: 150,
                default: "Customer Support",
            },

            status: {
                type: String,
                enum: Object.values(LIVE_CHAT_STATUSES),
                default: LIVE_CHAT_STATUSES.OPEN,
                required: true,
            },

            lastMessage: {
                type: String,
                trim: true,
                maxlength: 2000,
            },

            lastMessageAt: Date,

            lastMessageSenderId: {
                type: Schema.Types.ObjectId,
                ref: "User",
            },

            customerUnreadCount: {
                type: Number,
                default: 0,
                min: 0,
            },

            supportUnreadCount: {
                type: Number,
                default: 0,
                min: 0,
            },

            resolvedAt: Date,
            closedAt: Date,
        },
        {
            timestamps: true,
            versionKey: false,
        },
    );

liveChatConversationSchema.index({
    customerId: 1,
    updatedAt: -1,
});

liveChatConversationSchema.index({
    status: 1,
    lastMessageAt: -1,
});

liveChatConversationSchema.index({
    assignedAdminId: 1,
    status: 1,
    lastMessageAt: -1,
});

export const LiveChatConversation =
    models.LiveChatConversation ??
    model<ILiveChatConversation>(
        "LiveChatConversation",
        liveChatConversationSchema,
    );
