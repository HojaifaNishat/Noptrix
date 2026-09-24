import {
    Document,
    Model,
    Schema,
    Types,
    model,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| Application Statuses
|--------------------------------------------------------------------------
*/

export const APPLICATION_STATUSES = {
    PENDING: "PENDING",
    SHORTLISTED: "SHORTLISTED",
    REJECTED: "REJECTED",
    ACCEPTED: "ACCEPTED",
} as const;

export type ApplicationStatus =
    typeof APPLICATION_STATUSES[
        keyof typeof APPLICATION_STATUSES
    ];

/*
|--------------------------------------------------------------------------
| Interface
|--------------------------------------------------------------------------
*/

export interface IJobApplication {
    _id: Types.ObjectId;
    fullName: string;
    email: string;
    phone: string;
    coverLetter?: string;
    resumeUrl: string;
    appliedRoleId?: Types.ObjectId;
    status: ApplicationStatus;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IJobApplicationDocument
    extends IJobApplication,
        Document {}

export type JobApplicationModel =
    Model<IJobApplicationDocument>;

/*
|--------------------------------------------------------------------------
| Schema
|--------------------------------------------------------------------------
*/

const jobApplicationSchema =
    new Schema<IJobApplicationDocument>(
        {
            fullName: {
                type: String,
                required: [
                    true,
                    "Full name is required.",
                ],
                trim: true,
                maxlength: [
                    100,
                    "Full name cannot exceed 100 characters.",
                ],
            },

            email: {
                type: String,
                required: [
                    true,
                    "Email is required.",
                ],
                trim: true,
                lowercase: true,
                index: true,
            },

            phone: {
                type: String,
                required: [
                    true,
                    "Phone number is required.",
                ],
                trim: true,
                maxlength: [
                    30,
                    "Phone number cannot exceed 30 characters.",
                ],
            },

            coverLetter: {
                type: String,
                trim: true,
                maxlength: [
                    3000,
                    "Cover letter cannot exceed 3000 characters.",
                ],
            },

            resumeUrl: {
                type: String,
                required: [
                    true,
                    "Resume URL is required.",
                ],
                trim: true,
            },

            appliedRoleId: {
                type: Schema.Types.ObjectId,
                ref: "Role",
                index: true,
            },

            status: {
                type: String,
                enum: {
                    values: Object.values(
                        APPLICATION_STATUSES
                    ),
                    message:
                        "Invalid application status.",
                },
                default:
                    APPLICATION_STATUSES.PENDING,
                index: true,
            },

            notes: {
                type: String,
                trim: true,
                maxlength: [
                    2000,
                    "Notes cannot exceed 2000 characters.",
                ],
            },
        },
        {
            timestamps: true,
            versionKey: false,
        }
    );

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

jobApplicationSchema.index(
    {
        status: 1,
        createdAt: -1,
    },
    {
        name: "app_status_createdAt",
    }
);

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

export const JobApplication =
    model<
        IJobApplicationDocument,
        JobApplicationModel
    >(
        "JobApplication",
        jobApplicationSchema
    );
