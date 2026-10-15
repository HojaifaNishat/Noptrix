import { Schema, model, models, type Model } from "mongoose";

export const SYSTEM_LOG_LEVELS = [
    "DEBUG",
    "INFO",
    "WARN",
    "ERROR",
    "FATAL",
] as const;

export const SYSTEM_LOG_SOURCES = [
    "API",
    "DATABASE",
    "REDIS",
    "AUTH",
    "PAYMENT",
    "INTEGRATION",
    "BACKGROUND_JOB",
    "SYSTEM",
] as const;

export interface ISystemLog {
    level: (typeof SYSTEM_LOG_LEVELS)[number];
    source: (typeof SYSTEM_LOG_SOURCES)[number];
    message: string;
    requestId?: string;
    correlationId?: string;
    errorCode?: string;
    path?: string;
    method?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}

const systemLogSchema = new Schema<ISystemLog>(
    {
        level: {
            type: String,
            enum: SYSTEM_LOG_LEVELS,
            required: true,
            immutable: true,
        },
        source: {
            type: String,
            enum: SYSTEM_LOG_SOURCES,
            required: true,
            immutable: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
            immutable: true,
        },
        requestId: {
            type: String,
            trim: true,
            maxlength: 128,
            immutable: true,
        },
        correlationId: {
            type: String,
            trim: true,
            maxlength: 128,
            immutable: true,
        },
        errorCode: {
            type: String,
            trim: true,
            maxlength: 150,
            immutable: true,
        },
        path: {
            type: String,
            trim: true,
            maxlength: 2048,
            immutable: true,
        },
        method: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: 12,
            immutable: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
            immutable: true,
        },
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false,
        },
        versionKey: false,
        strict: true,
        minimize: false,
    },
);

systemLogSchema.index({ createdAt: -1 });
systemLogSchema.index({ level: 1, createdAt: -1 });
systemLogSchema.index({ source: 1, createdAt: -1 });
systemLogSchema.index({ requestId: 1 }, { sparse: true });
systemLogSchema.index({ correlationId: 1 }, { sparse: true });

export const SystemLog: Model<ISystemLog> =
    (models.SystemLog as Model<ISystemLog>) ||
    model<ISystemLog>("SystemLog", systemLogSchema);
