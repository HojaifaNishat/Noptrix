import {
    Schema,
    model,
    models,
    type Document,
    type Model,
} from "mongoose";

export const AUDIT_ACTIONS = [
    "CREATE",
    "READ",
    "UPDATE",
    "DELETE",
    "LOGIN",
    "LOGOUT",
    "LOGIN_FAILED",
    "PASSWORD_CHANGED",
    "PASSWORD_RESET",
    "INVITATION_CREATED",
    "INVITATION_REVOKED",
    "PERMISSION_CHANGED",
    "STATUS_CHANGED",
    "APPROVED",
    "REJECTED",
    "EXPORTED",
    "IMPORTED",
    "SECURITY_EVENT",
    "OTHER",
] as const;

export const AUDIT_ACTOR_TYPES = [
    "OWNER",
    "ADMIN",
    "EMPLOYEE",
    "SELLER",
    "RIDER",
    "USER",
    "SYSTEM",
] as const;

export interface IAuditLog {
    actorId?: string;
    actorType: (typeof AUDIT_ACTOR_TYPES)[number];
    actorRole?: string;
    action: (typeof AUDIT_ACTIONS)[number];
    resource: string;
    resourceId?: string;
    description?: string;
    requestId?: string;
    method?: string;
    path?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
    success: boolean;
    createdAt: Date;
}

export interface AuditLogDocument
    extends IAuditLog, Document {}

const auditLogSchema = new Schema<IAuditLog>(
    {
        actorId: {
            type: String,
            trim: true,
            maxlength: 128,
        },
        actorType: {
            type: String,
            enum: AUDIT_ACTOR_TYPES,
            required: true,
            immutable: true,
        },
        actorRole: {
            type: String,
            trim: true,
            maxlength: 100,
            immutable: true,
        },
        action: {
            type: String,
            enum: AUDIT_ACTIONS,
            required: true,
            immutable: true,
        },
        resource: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 150,
            immutable: true,
        },
        resourceId: {
            type: String,
            trim: true,
            maxlength: 128,
            immutable: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
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
        userAgent: {
            type: String,
            trim: true,
            maxlength: 1000,
            immutable: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
            immutable: true,
        },
        success: {
            type: Boolean,
            required: true,
            default: true,
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

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ actorType: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 });
auditLogSchema.index({ requestId: 1 }, { sparse: true });

export const AuditLog: Model<IAuditLog> =
    (models.AuditLog as Model<IAuditLog>) ||
    model<IAuditLog>("AuditLog", auditLogSchema);
