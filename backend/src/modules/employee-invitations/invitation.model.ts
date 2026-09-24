import {
    Document,
    Model,
    Schema,
    Types,
    model,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| Invitation Status
|--------------------------------------------------------------------------
*/

export const INVITATION_STATUSES = {
    PENDING: "PENDING",
    ACCEPTED: "ACCEPTED",
    EXPIRED: "EXPIRED",
    REVOKED: "REVOKED",
} as const;

export type InvitationStatus =
    typeof INVITATION_STATUSES[
        keyof typeof INVITATION_STATUSES
    ];

/*
|--------------------------------------------------------------------------
| Invitation Interface
|--------------------------------------------------------------------------
*/

export interface IInvitation {
    _id: Types.ObjectId;

    email: string;
    name: string;

    tokenHash: string;

    invitedBy: Types.ObjectId;

    roleId: Types.ObjectId;

    status: InvitationStatus;

    expiresAt: Date;

    acceptedAt?: Date;
    acceptedUserId?: Types.ObjectId;

    revokedAt?: Date;
    revokedBy?: Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

export interface IInvitationDocument
    extends IInvitation,
        Document {}

export type InvitationModel =
    Model<IInvitationDocument>;

/*
|--------------------------------------------------------------------------
| Schema
|--------------------------------------------------------------------------
*/

const invitationSchema =
    new Schema<IInvitationDocument>(
        {
            email: {
                type: String,
                required: [
                    true,
                    "Invitation email is required.",
                ],
                trim: true,
                lowercase: true,
                maxlength: [
                    254,
                    "Invitation email cannot exceed 254 characters.",
                ],
                index: true,
            },

            name: {
                type: String,
                required: [
                    true,
                    "Invitation name is required.",
                ],
                trim: true,
                minlength: [
                    2,
                    "Invitation name must be at least 2 characters.",
                ],
                maxlength: [
                    100,
                    "Invitation name cannot exceed 100 characters.",
                ],
            },

            tokenHash: {
                type: String,
                required: [
                    true,
                    "Invitation token hash is required.",
                ],
                unique: true,
                index: true,
                select: false,
            },

            invitedBy: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: [
                    true,
                    "Invited by user is required.",
                ],
                index: true,
            },

            roleId: {
                type: Schema.Types.ObjectId,
                ref: "Role",
                required: [
                    true,
                    "Invitation role is required.",
                ],
                index: true,
            },

            status: {
                type: String,
                enum: {
                    values: Object.values(
                        INVITATION_STATUSES,
                    ),
                    message:
                        "Invalid invitation status.",
                },
                default:
                    INVITATION_STATUSES.PENDING,
                required: true,
                index: true,
            },

            expiresAt: {
                type: Date,
                required: [
                    true,
                    "Invitation expiration date is required.",
                ],
                index: true,
            },

            acceptedAt: {
                type: Date,
            },

            acceptedUserId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                index: true,
            },

            revokedAt: {
                type: Date,
            },

            revokedBy: {
                type: Schema.Types.ObjectId,
                ref: "User",
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

invitationSchema.index(
    {
        email: 1,
        status: 1,
        createdAt: -1,
    },
    {
        name: "invitation_email_status_createdAt",
    },
);

invitationSchema.index(
    {
        status: 1,
        expiresAt: 1,
    },
    {
        name: "invitation_status_expiresAt",
    },
);

invitationSchema.index(
    {
        invitedBy: 1,
        createdAt: -1,
    },
    {
        name: "invitation_invitedBy_createdAt",
    },
);

invitationSchema.index(
    {
        roleId: 1,
        status: 1,
        createdAt: -1,
    },
    {
        name: "invitation_role_status_createdAt",
    },
);

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

export const Invitation =
    model<IInvitationDocument, InvitationModel>(
        "Invitation",
        invitationSchema,
    );