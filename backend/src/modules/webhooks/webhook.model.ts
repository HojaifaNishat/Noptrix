import {
    Document,
    Model,
    Schema,
    model,
} from "mongoose";

export const WEBHOOK_STATUSES = {
    RECEIVED: "RECEIVED",
    PROCESSING: "PROCESSING",
    PROCESSED: "PROCESSED",
    FAILED: "FAILED",
    IGNORED: "IGNORED",
} as const;

export type WebhookStatus =
    typeof WEBHOOK_STATUSES[keyof typeof WEBHOOK_STATUSES];

export interface IWebhookEvent {
    provider: string;
    eventId: string;
    eventType: string;
    payloadHash: string;
    status: WebhookStatus;
    attempts: number;
    receivedAt: Date;
    processedAt?: Date;
    nextAttemptAt?: Date;
    lastErrorCode?: string;
    lastErrorMessage?: string;
}

export interface IWebhookEventDocument
    extends IWebhookEvent, Document {}

const webhookEventSchema = new Schema<IWebhookEventDocument>(
    {
        provider: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        eventId: {
            type: String,
            required: true,
            trim: true,
        },
        eventType: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        payloadHash: {
            type: String,
            required: true,
            match: /^[a-f0-9]{64}$/,
            select: false,
        },
        status: {
            type: String,
            required: true,
            enum: Object.values(WEBHOOK_STATUSES),
            default: WEBHOOK_STATUSES.RECEIVED,
            index: true,
        },
        attempts: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        receivedAt: {
            type: Date,
            required: true,
            default: Date.now,
            immutable: true,
        },
        processedAt: Date,
        nextAttemptAt: Date,
        lastErrorCode: {
            type: String,
            maxlength: 100,
        },
        lastErrorMessage: {
            type: String,
            maxlength: 500,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        strict: "throw",
    },
);

webhookEventSchema.index(
    { provider: 1, eventId: 1 },
    { unique: true },
);

webhookEventSchema.index({
    status: 1,
    nextAttemptAt: 1,
});

export const WebhookEvent: Model<IWebhookEventDocument> =
    model<IWebhookEventDocument>(
        "WebhookEvent",
        webhookEventSchema,
    );
