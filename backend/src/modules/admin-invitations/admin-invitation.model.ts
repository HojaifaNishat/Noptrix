import {
    Document,
    Model,
    Schema,
    Types,
    model,
} from "mongoose";

export const ADMIN_INVITATION_STATUSES = {
    PENDING: "PENDING",
    ACCEPTED: "ACCEPTED",
    EXPIRED: "EXPIRED",
    REVOKED: "REVOKED",
} as const;

export type AdminInvitationStatus =
    (typeof ADMIN_INVITATION_STATUSES)[keyof typeof ADMIN_INVITATION_STATUSES];

export interface IAdminInvitation {
    _id: Types.ObjectId;
    employeeId: Types.ObjectId;
    userId: Types.ObjectId;
    roleId: Types.ObjectId;
    invitedBy: Types.ObjectId;
    email: string;
    name: string;
    tokenHash: string;
    status: AdminInvitationStatus;
    expiresAt: Date;
    acceptedAt?: Date;
    onboardingOtpHash?: string;
    onboardingOtpChannel?: "EMAIL" | "PHONE";
    onboardingOtpTarget?: string;
    onboardingOtpExpiresAt?: Date;
    onboardingOtpSentAt?: Date;
    onboardingOtpAttempts: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAdminInvitationDocument
    extends IAdminInvitation,
        Document {}

const adminInvitationSchema =
    new Schema<IAdminInvitationDocument>(
        {
            employeeId: {
                type: Schema.Types.ObjectId,
                ref: "Employee",
                required: true,
                index: true,
            },
            userId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
                index: true,
            },
            roleId: {
                type: Schema.Types.ObjectId,
                ref: "Role",
                required: true,
                index: true,
            },
            invitedBy: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            email: {
                type: String,
                required: true,
                trim: true,
                lowercase: true,
                maxlength: 254,
            },
            name: {
                type: String,
                required: true,
                trim: true,
                minlength: 2,
                maxlength: 150,
            },
            tokenHash: {
                type: String,
                required: true,
                unique: true,
                select: false,
            },
            status: {
                type: String,
                enum: Object.values(ADMIN_INVITATION_STATUSES),
                default: ADMIN_INVITATION_STATUSES.PENDING,
                index: true,
            },
            expiresAt: {
                type: Date,
                required: true,
                index: true,
            },
            acceptedAt: Date,
            onboardingOtpHash: String,
            onboardingOtpChannel: {
                type: String,
                enum: ["EMAIL", "PHONE"],
            },
            onboardingOtpTarget: String,
            onboardingOtpExpiresAt: Date,
            onboardingOtpSentAt: Date,
            onboardingOtpAttempts: {
                type: Number,
                default: 0,
                min: 0,
            },
        },
        {
            timestamps: true,
            versionKey: false,
        },
    );

adminInvitationSchema.index({
    employeeId: 1,
    status: 1,
    createdAt: -1,
});

export const AdminInvitation = model<IAdminInvitationDocument>(
    "AdminInvitation",
    adminInvitationSchema,
);
