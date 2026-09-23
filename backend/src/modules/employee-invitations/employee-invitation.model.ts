import { Document, Model, Schema, Types, model } from "mongoose";
import type { EmploymentType } from "../employees/employee.model";

export const INVITATION_STATUSES = {
    PENDING: "PENDING",
    ACCEPTED: "ACCEPTED",
    EXPIRED: "EXPIRED",
} as const;

export type EmployeeInvitationStatus =
    typeof INVITATION_STATUSES[keyof typeof INVITATION_STATUSES];

export interface IEmployeeInvitation {
    _id: Types.ObjectId;
    email: string;
    roleId: Types.ObjectId;
    invitedBy: Types.ObjectId;
    employmentType: EmploymentType;
    employeeCode: string;
    department?: string;
    jobTitle?: string;
    expiresAt: Date;
    status: EmployeeInvitationStatus;
    tokenHash: string;
    acceptedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IEmployeeInvitationDocument
    extends IEmployeeInvitation, Document {}

const employeeInvitationSchema =
    new Schema<IEmployeeInvitationDocument>(
        {
            email: { type: String, required: true, lowercase: true, trim: true, index: true },
            roleId: { type: Schema.Types.ObjectId, ref: "Role", required: true },
            invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
            employmentType: { type: String, required: true },
            employeeCode: { type: String, required: true, uppercase: true, trim: true },
            department: String,
            jobTitle: String,
            expiresAt: { type: Date, required: true, index: true },
            status: { type: String, enum: Object.values(INVITATION_STATUSES), default: INVITATION_STATUSES.PENDING, index: true },
            tokenHash: { type: String, required: true, unique: true, select: false },
            acceptedAt: Date,
        },
        { timestamps: true }
    );

export const EmployeeInvitation: Model<IEmployeeInvitationDocument> =
    model<IEmployeeInvitationDocument>(
        "EmployeeInvitation",
        employeeInvitationSchema
    );