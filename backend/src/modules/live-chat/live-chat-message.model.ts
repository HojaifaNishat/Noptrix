import {
    Schema,
    model,
    models,
    Types,
    type HydratedDocument,
} from "mongoose";

import {
    LIVE_CHAT_MESSAGE_STATUSES,
    LIVE_CHAT_SENDER_TYPES,
    type LiveChatMessageStatus,
    type LiveChatSenderType,
} from "./live-chat.types";

export interface ILiveChatMessage {
    conversationId: Types.ObjectId;
    senderId: Types.ObjectId;
    senderType: LiveChatSenderType;
    body: string;
    status: LiveChatMessageStatus;
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export type LiveChatMessageDocument =
    HydratedDocument<ILiveChatMessage>;

const liveChatMessageSchema =
    new Schema<ILiveChatMessage>(
        {
            conversationId: {
                type: Schema.Types.ObjectId,
                ref: "LiveChatConversation",
                required: true,
            },

            senderId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },

            senderType: {
                type: String,
                enum: Object.values(LIVE_CHAT_SENDER_TYPES),
                required: true,
            },

            body: {
                type: String,
                required: true,
                trim: true,
                minlength: 1,
                maxlength: 2000,
            },

            status: {
                type: String,
                enum: Object.values(LIVE_CHAT_MESSAGE_STATUSES),
                default: LIVE_CHAT_MESSAGE_STATUSES.SENT,
                required: true,
            },

            readAt: Date,
        },
        {
            timestamps: true,
            versionKey: false,
        },
    );

liveChatMessageSchema.index({
    conversationId: 1,
    createdAt: 1,
});

liveChatMessageSchema.index({
    conversationId: 1,
    status: 1,
    senderType: 1,
});

export const LiveChatMessage =
    models.LiveChatMessage ??
    model<ILiveChatMessage>(
        "LiveChatMessage",
        liveChatMessageSchema,
    );
