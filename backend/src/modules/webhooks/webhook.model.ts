import {
    Schema,
    model,
    models,
    type Model,
    type Document,
} from "mongoose";

export const WEBHOOK_EVENT_STATUSES = [
    "received",
    "processing",
    "processed",
    "failed",
] as const;

export type WebhookEventStatus =
    (typeof WEBHOOK_EVENT_STATUSES)[number];

export interface IWebhookEvent {
    provider: string;
    eventId: string;
    eventType: string;
    status: WebhookEventStatus;
    transactionId?: string;
    failureCode?: string;
    processedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IWebhookEventDocument
    extends IWebhookEvent, Document {}

const webhookEventSchema = new Schema<IWebhookEventDocument>(
    {
        provider: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 50,
        },
        eventId: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        eventType: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        status: {
            type: String,
            enum: WEBHOOK_EVENT_STATUSES,
            required: true,
            default: "received",
        },
        transactionId: {
            type: String,
            trim: true,
            maxlength: 200,
        },
        failureCode: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        processedAt: Date,
    },
    {
        timestamps: true,
        versionKey: false,
        collection: "webhook_events",
        strict: "throw",
    },
);

webhookEventSchema.index(
    { provider: 1, eventId: 1 },
    { unique: true, name: "unique_provider_webhook_event" },
);

webhookEventSchema.index({ status: 1, createdAt: -1 });

export const WebhookEvent: Model<IWebhookEventDocument> =
    (models.WebhookEvent as Model<IWebhookEventDocument> | undefined) ??
    model<IWebhookEventDocument>("WebhookEvent", webhookEventSchema);
