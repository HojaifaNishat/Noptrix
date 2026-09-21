import {
    Document,
    Model,
    Schema,
    Types,
    model,
} from "mongoose";

export const SESSION_STATUSES = {
    ACTIVE: "ACTIVE",
    REVOKED: "REVOKED",
    EXPIRED: "EXPIRED",
} as const;

export type SessionStatus =
    typeof SESSION_STATUSES[keyof typeof SESSION_STATUSES];

export interface ISession {
    _id: Types.ObjectId;

    userId: Types.ObjectId;

    refreshTokenHash: string;

    status: SessionStatus;

    userAgent?: string;
    ipAddress?: string;

    deviceId?: string;

    lastUsedAt?: Date;
    expiresAt: Date;
    revokedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

export interface ISessionDocument
    extends ISession,
        Document {}

export type SessionModel =
    Model<ISessionDocument>;

const sessionSchema =
    new Schema<ISessionDocument>(
        {
            userId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: [
                    true,
                    "User ID is required.",
                ],
                index: true,
            },

            refreshTokenHash: {
                type: String,
                required: [
                    true,
                    "Refresh token hash is required.",
                ],
                select: false,
            },

            status: {
                type: String,
                enum: {
                    values:
                        Object.values(
                            SESSION_STATUSES
                        ),
                    message:
                        "Invalid session status.",
                },
                default:
                    SESSION_STATUSES.ACTIVE,
                index: true,
            },

            userAgent: {
                type: String,
                trim: true,
                maxlength: 1000,
            },

            ipAddress: {
                type: String,
                trim: true,
                maxlength: 100,
            },

            deviceId: {
                type: String,
                trim: true,
                maxlength: 255,
            },

            lastUsedAt: {
                type: Date,
            },

            expiresAt: {
                type: Date,
                required: [
                    true,
                    "Session expiry is required.",
                ],
                index: true,
            },

            revokedAt: {
                type: Date,
            },
        },
        {
            timestamps: true,
            versionKey: false,
        }
    );

sessionSchema.index(
    {
        userId: 1,
        status: 1,
        createdAt: -1,
    },
    {
        name: "session_user_status_createdAt",
    }
);

sessionSchema.index(
    {
        expiresAt: 1,
    },
    {
        expireAfterSeconds: 0,
        name: "session_ttl",
    }
);

export const Session =
    model<ISessionDocument, SessionModel>(
        "Session",
        sessionSchema
    );