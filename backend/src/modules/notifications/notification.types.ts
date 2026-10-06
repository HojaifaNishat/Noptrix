import {
    Types,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| Notification Types
|--------------------------------------------------------------------------
*/

export const NOTIFICATION_TYPES = {
    JOB_APPLICATION_STATUS: "JOB_APPLICATION_STATUS",
    JOB_APPLICATION_INTERVIEW: "JOB_APPLICATION_INTERVIEW",

    ORDER_STATUS: "ORDER_STATUS",
    PAYMENT_STATUS: "PAYMENT_STATUS",
    DELIVERY_STATUS: "DELIVERY_STATUS",

    PROMOTION: "PROMOTION",
    SYSTEM: "SYSTEM",
} as const;

export type NotificationType =
    (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];


/*
|--------------------------------------------------------------------------
| Notification Priorities
|--------------------------------------------------------------------------
*/

export const NOTIFICATION_PRIORITIES = {
    LOW: "low",
    NORMAL: "normal",
    HIGH: "high",
    CRITICAL: "critical",
} as const;

export type NotificationPriority =
    (typeof NOTIFICATION_PRIORITIES)[keyof typeof NOTIFICATION_PRIORITIES];


/*
|--------------------------------------------------------------------------
| Notification Status
|--------------------------------------------------------------------------
*/

export const NOTIFICATION_STATUSES = {
    PENDING: "PENDING",
    SENT: "SENT",
    PARTIAL: "PARTIAL",
    FAILED: "FAILED",
} as const;

export type NotificationStatus =
    (typeof NOTIFICATION_STATUSES)[keyof typeof NOTIFICATION_STATUSES];


/*
|--------------------------------------------------------------------------
| Delivery Status
|--------------------------------------------------------------------------
*/

export const NOTIFICATION_DELIVERY_STATUSES = {
    PENDING: "PENDING",
    SENT: "SENT",
    DELIVERED: "DELIVERED",
    FAILED: "FAILED",
    SKIPPED: "SKIPPED",
} as const;

export type NotificationDeliveryStatus =
    (typeof NOTIFICATION_DELIVERY_STATUSES)[keyof typeof NOTIFICATION_DELIVERY_STATUSES];


/*
|--------------------------------------------------------------------------
| Notification Channels
|--------------------------------------------------------------------------
*/

export const NOTIFICATION_CHANNELS = {
    IN_APP: "in-app",
    EMAIL: "email",
    PUSH: "push",
    SMS: "sms",
} as const;

export type NotificationChannel =
    (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];


/*
|--------------------------------------------------------------------------
| Delivery Record
|--------------------------------------------------------------------------
*/

export interface NotificationDelivery {
    channel: NotificationChannel;

    status: NotificationDeliveryStatus;

    sentAt?: Date;

    deliveredAt?: Date;

    failedAt?: Date;

    errorCode?: string;

    errorMessage?: string;

    provider?: string;

    providerMessageId?: string;

    attempts: number;
}


/*
|--------------------------------------------------------------------------
| Notification Metadata
|--------------------------------------------------------------------------
*/

export interface NotificationMetadata {
    applicationId?: string;

    vacancyId?: string;

    vacancySlug?: string;

    orderId?: string;

    paymentId?: string;

    deliveryId?: string;

    status?: string;

    previousStatus?: string;

    interviewAt?: Date | string;

    actionUrl?: string;

    [key: string]: unknown;
}


/*
|--------------------------------------------------------------------------
| Notification Document
|--------------------------------------------------------------------------
*/

export interface INotification {
    _id: Types.ObjectId;

    recipientId: Types.ObjectId;

    type: NotificationType;

    priority: NotificationPriority;

    title: string;

    message: string;

    channels: NotificationChannel[];

    status: NotificationStatus;

    deliveries: NotificationDelivery[];

    metadata?: NotificationMetadata;

    readAt?: Date;

    expiresAt?: Date;

    createdAt: Date;

    updatedAt: Date;
}


/*
|--------------------------------------------------------------------------
| Create Notification Input
|--------------------------------------------------------------------------
*/

export interface CreateNotificationInput {
    recipientId: string | Types.ObjectId;

    type: NotificationType;

    priority?: NotificationPriority;

    title: string;

    message: string;

    channels?: NotificationChannel[];

    metadata?: NotificationMetadata;

    expiresAt?: Date;
}
