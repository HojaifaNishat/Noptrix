import {
    Schema,
    model,
    models,
    type Model,
} from "mongoose";

export const ACTIVITY_ACTOR_TYPES = [
    "OWNER",
    "ADMIN",
    "EMPLOYEE",
    "SELLER",
    "RIDER",
    "USER",
    "SYSTEM",
] as const;

export const ACTIVITY_TYPES = [
    "AUTHENTICATION",
    "PROFILE",
    "PRODUCT",
    "ORDER",
    "PAYMENT",
    "INVENTORY",
    "SUPPORT",
    "COMMUNICATION",
    "SETTINGS",
    "SECURITY",
    "OTHER",
] as const;

export interface IActivityLog {
    actorId?: string;
    actorType: (typeof ACTIVITY_ACTOR_TYPES)[number];
    actorRole?: string;
    activityType: (typeof ACTIVITY_TYPES)[number];
    action: string;
    description: string;
    resource?: string;
    resourceId?: string;
    requestId?: string;
    method?: string;
    path?: string;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
    {
        actorId: {
            type: String,
            trim: true,
            maxlength: 128,
            immutable: true,
        },
        actorType: {
            type: String,
            enum: ACTIVITY_ACTOR_TYPES,
            required: true,
            immutable: true,
        },
        actorRole: {
            type: String,
            trim: true,
            maxlength: 100,
            immutable: true,
        },
        activityType: {
            type: String,
            enum: ACTIVITY_TYPES,
            required: true,
            immutable: true,
        },
        action: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
            immutable: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
            immutable: true,
        },
        resource: {
            type: String,
            trim: true,
            maxlength: 150,
            immutable: true,
        },
        resourceId: {
            type: String,
            trim: true,
            maxlength: 128,
            immutable: true,
        },
        requestId: {
            type: String,
            trim: true,
            maxlength: 128,
            immutable: true,
        },
        method: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: 12,
            immutable: true,
        },
        path: {
            type: String,
            trim: true,
            maxlength: 2048,
            immutable: true,
        },
        ipAddress: {
            type: String,
            trim: true,
            maxlength: 100,
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

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ actorId: 1, createdAt: -1 });
activityLogSchema.index({ activityType: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 });

export const ActivityLog: Model<IActivityLog> =
    (models.ActivityLog as Model<IActivityLog>) ||
    model<IActivityLog>("ActivityLog", activityLogSchema);
