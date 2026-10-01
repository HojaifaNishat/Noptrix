import {
    Document,
    Model,
    Schema,
    Types,
    model,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| Session Statuses
|--------------------------------------------------------------------------
*/

export const SESSION_STATUSES = {
    ACTIVE: "ACTIVE",
    REVOKED: "REVOKED",
    EXPIRED: "EXPIRED",
} as const;

export type SessionStatus =
    typeof SESSION_STATUSES[
        keyof typeof SESSION_STATUSES
    ];

/*
|--------------------------------------------------------------------------
| Session Interface
|--------------------------------------------------------------------------
*/

export interface ISession {
    _id: Types.ObjectId;

    userId: Types.ObjectId;

    refreshTokenHash: string;

    status: SessionStatus;

    /*
     * OWNER security state.
     *
     * When true, the Owner has successfully
     * completed secret verification for this
     * authenticated session.
     */
    secretVerified: boolean;

    userAgent?: string;
    ipAddress?: string;

    deviceId?: string;

    lastUsedAt?: Date;
    expiresAt: Date;
    revokedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| Session Document
|--------------------------------------------------------------------------
*/

export interface ISessionDocument
    extends ISession,
        Document {}

/*
|--------------------------------------------------------------------------
| Session Model
|--------------------------------------------------------------------------
*/

export type SessionModel =
    Model<ISessionDocument>;

/*
|--------------------------------------------------------------------------
| Session Schema
|--------------------------------------------------------------------------
*/

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
                            SESSION_STATUSES,
                        ),

                    message:
                        "Invalid session status.",
                },

                default:
                    SESSION_STATUSES.ACTIVE,

                index: true,
            },

            /*
             * OWNER secret verification state.
             *
             * This belongs to the session, not the
             * access token, because access tokens are
             * short-lived and are recreated during
             * refresh.
             */
            secretVerified: {
                type: Boolean,

                required: true,

                default: false,
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
        },
    );

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

sessionSchema.index(
    {
        userId: 1,
        status: 1,
        createdAt: -1,
    },
    {
        name:
            "session_user_status_createdAt",
    },
);

sessionSchema.index(
    {
        expiresAt: 1,
    },
    {
        expireAfterSeconds: 0,

        name:
            "session_ttl",
    },
);

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export const Session =
    model<ISessionDocument, SessionModel>(
        "Session",
        sessionSchema,
    );