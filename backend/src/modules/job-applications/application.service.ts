import { Types } from "mongoose";
import {
    JobApplication,
    APPLICATION_STATUSES,
    ApplicationStatus,
} from "./application.model";
import { Role } from "../roles/role.model";
import { CreateApplicationInput } from "./application.validator";
import { ApiError } from "../../utils/ApiError";

const validateObjectId = (
    value: string,
    fieldName: string
): Types.ObjectId => {
    if (!Types.ObjectId.isValid(value)) {
        throw ApiError.badRequest(
            `Invalid ${fieldName}.`,
            {
                code: "INVALID_OBJECT_ID",
            }
        );
    }
    return new Types.ObjectId(value);
};

export const submitApplication = async (
    input: CreateApplicationInput
) => {
    // Prevent duplicate active applications from the same email
    const existing =
        await JobApplication.findOne({
            email: input.email.toLowerCase(),
            status: {
                $in: [
                    APPLICATION_STATUSES.PENDING,
                    APPLICATION_STATUSES.SHORTLISTED,
                ],
            },
        });

    if (existing) {
        throw ApiError.conflict(
            "An active application with this email already exists.",
            {
                code: "APPLICATION_ALREADY_EXISTS",
            }
        );
    }

    let appliedRoleId:
        | Types.ObjectId
        | undefined = undefined;

    if (input.appliedRoleId) {
        appliedRoleId = validateObjectId(
            input.appliedRoleId,
            "applied role ID"
        );
        const role = await Role.findById(
            appliedRoleId
        );
        if (!role || role.status !== "ACTIVE") {
            throw ApiError.badRequest(
                "Selected role does not exist or is inactive.",
                {
                    code: "INVALID_OR_INACTIVE_ROLE",
                }
            );
        }
    }

    return JobApplication.create({
        ...input,
        appliedRoleId,
        status: APPLICATION_STATUSES.PENDING,
    });
};

export const getAllApplications =
    async () => {
        return JobApplication.find()
            .populate(
                "appliedRoleId",
                "name slug status"
            )
            .sort({ createdAt: -1 });
    };

export const getApplicationById = async (
    id: string
) => {
    const _id = validateObjectId(
        id,
        "application ID"
    );
    const application =
        await JobApplication.findById(
            _id
        ).populate(
            "appliedRoleId",
            "name slug status"
        );

    if (!application) {
        throw ApiError.notFound(
            "Job application not found.",
            {
                code: "APPLICATION_NOT_FOUND",
            }
        );
    }

    return application;
};

export const updateApplicationStatus =
    async (
        id: string,
        status: ApplicationStatus,
        notes?: string
    ) => {
        const _id = validateObjectId(
            id,
            "application ID"
        );
        const application =
            await JobApplication.findById(
                _id
            );

        if (!application) {
            throw ApiError.notFound(
                "Job application not found.",
                {
                    code: "APPLICATION_NOT_FOUND",
                }
            );
        }

        application.status = status;
        if (notes !== undefined) {
            application.notes = notes;
        }

        await application.save();
        return application;
    };

export const deleteApplication = async (
    id: string
) => {
    const _id = validateObjectId(
        id,
        "application ID"
    );
    const application =
        await JobApplication.findById(
            _id
        );

    if (!application) {
        throw ApiError.notFound(
            "Job application not found.",
            {
                code: "APPLICATION_NOT_FOUND",
            }
        );
    }

    await JobApplication.deleteOne({
        _id,
    });
    return application;
};
