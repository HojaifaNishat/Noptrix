import {
    Schema,
    model,
    type HydratedDocument,
    type Model,
} from "mongoose";

import type {
    INotification,
    NotificationDelivery,
} from "./notification.types";

import {
    NOTIFICATION_CHANNELS,
    NOTIFICATION_DELIVERY_STATUSES,
    NOTIFICATION_PRIORITIES,
    NOTIFICATION_STATUSES,
    NOTIFICATION_TYPES,
} from "./notification.types";


/*
|--------------------------------------------------------------------------
| Delivery Schema
|--------------------------------------------------------------------------
*/

const notificationDeliverySchema =
    new Schema<NotificationDelivery>(
        {
            channel: {
                type: String,
                enum: Object.values(
                    NOTIFICATION_CHANNELS,
                ),
                required: true,
            },

            status: {
                type: String,
                enum: Object.values(
                    NOTIFICATION_DELIVERY_STATUSES,
                ),
                required: true,
                default:
                    NOTIFICATION_DELIVERY_STATUSES.PENDING,
            },

            sentAt: {
                type: Date,
            },

            deliveredAt: {
                type: Date,
            },

            failedAt: {
                type: Date,
            },

            errorCode: {
                type: String,
                trim: true,
                maxlength: 100,
            },

            errorMessage: {
                type: String,
                trim: true,
                maxlength: 1000,
            },

            provider: {
                type: String,
                trim: true,
                maxlength: 100,
            },

            providerMessageId: {
                type: String,
                trim: true,
                maxlength: 500,
            },

            attempts: {
                type: Number,
                required: true,
                default: 0,
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
| Notification Schema
|--------------------------------------------------------------------------
*/

const notificationSchema =
    new Schema<INotification>(
        {
            recipientId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
                index: true,
            },

            type: {
                type: String,
                enum: Object.values(
                    NOTIFICATION_TYPES,
                ),
                required: true,
                index: true,
            },

            priority: {
                type: String,
                enum: Object.values(
                    NOTIFICATION_PRIORITIES,
                ),
                required: true,
                default:
                    NOTIFICATION_PRIORITIES.NORMAL,
            },

            title: {
                type: String,
                required: true,
                trim: true,
                maxlength: 200,
            },

            message: {
                type: String,
                required: true,
                trim: true,
                maxlength: 5000,
            },

            channels: {
                type: [
                    {
                        type: String,
                        enum: Object.values(
                            NOTIFICATION_CHANNELS,
                        ),
                    },
                ],
                required: true,
                default: [
                    NOTIFICATION_CHANNELS.IN_APP,
                ],
            },

            status: {
                type: String,
                enum: Object.values(
                    NOTIFICATION_STATUSES,
                ),
                required: true,
                default:
                    NOTIFICATION_STATUSES.PENDING,
                index: true,
            },

            deliveries: {
                type: [
                    notificationDeliverySchema,
                ],
                default: [],
            },

            metadata: {
                type: Schema.Types.Mixed,
                default: undefined,
            },

            readAt: {
                type: Date,
                default: null,
                index: true,
            },

            expiresAt: {
                type: Date,
                default: null,
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

notificationSchema.index({
    recipientId: 1,
    createdAt: -1,
});

notificationSchema.index({
    recipientId: 1,
    readAt: 1,
    createdAt: -1,
});

notificationSchema.index({
    recipientId: 1,
    type: 1,
    createdAt: -1,
});

notificationSchema.index({
    status: 1,
    createdAt: -1,
});

notificationSchema.index(
    {
        expiresAt: 1,
    },
    {
        expireAfterSeconds: 0,
    },
);


/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

export type NotificationDocument =
    HydratedDocument<INotification>;

export const Notification: Model<INotification> =
    model<INotification>(
        "Notification",
        notificationSchema,
    );
