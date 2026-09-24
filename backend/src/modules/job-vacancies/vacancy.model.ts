import {
    Document,
    Model,
    Schema,
    Types,
    model,
} from "mongoose";

export const VACANCY_STATUSES = {
    DRAFT: "DRAFT",
    PUBLISHED: "PUBLISHED",
    CLOSED: "CLOSED",
} as const;

export type VacancyStatus =
    typeof VACANCY_STATUSES[
        keyof typeof VACANCY_STATUSES
    ];

export interface IJobVacancy {
    _id: Types.ObjectId;
    title: string;
    slug: string;
    department: string;
    location: string;
    employmentType: string;
    description: string;
    requirements: string[];
    status: VacancyStatus;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface IJobVacancyDocument
    extends IJobVacancy,
        Document {}

export type JobVacancyModel =
    Model<IJobVacancyDocument>;

const jobVacancySchema =
    new Schema<IJobVacancyDocument>(
        {
            title: {
                type: String,
                required: [true, "Job title is required."],
                trim: true,
                maxlength: [150, "Title cannot exceed 150 characters."],
            },
            slug: {
                type: String,
                required: [true, "Slug is required."],
                unique: true,
                lowercase: true,
                trim: true,
                index: true,
            },
            department: {
                type: String,
                required: [true, "Department is required."],
                trim: true,
            },
            location: {
                type: String,
                required: [true, "Location is required."],
                trim: true,
                default: "Remote",
            },
            employmentType: {
                type: String,
                required: [true, "Employment type is required."],
                trim: true,
            },
            description: {
                type: String,
                required: [true, "Job description is required."],
                trim: true,
            },
            requirements: {
                type: [String],
                required: [true, "Requirements are required."],
            },
            status: {
                type: String,
                enum: Object.values(VACANCY_STATUSES),
                default: VACANCY_STATUSES.DRAFT,
                index: true,
            },
            createdBy: {
                type: Schema.Types.ObjectId,
                ref: "Admin",
                required: true,
            },
        },
        {
            timestamps: true,
            versionKey: false,
        }
    );

export const JobVacancy =
    model<IJobVacancyDocument, JobVacancyModel>(
        "JobVacancy",
        jobVacancySchema
    );
