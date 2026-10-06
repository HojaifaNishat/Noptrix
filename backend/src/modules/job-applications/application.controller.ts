import {
    Request,
    Response,
} from "express";

import {
    asyncHandler,
} from "../../utils/asyncHandler";

import {
    ApiError,
} from "../../utils/ApiError";

import {
    ApiResponse,
} from "../../utils/ApiResponse";

import {
    getAuthenticatedUserId,
} from "../../middlewares/userAuth.middleware";

import {
    getAuthenticatedOwnerUserId,
} from "../../middlewares/ownerAuth.middleware";

import {
    createJobApplication,
    getJobApplicationById,
    getMyJobApplications,
    getAllJobApplications,
    updateJobApplicationStatus,
    withdrawJobApplication,
    getVacancyApplicationSummary,
} from "./application.service";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getStringParam = (
    value:
        | string
        | string[]
        | undefined,
    fieldName: string,
): string => {
    if (
        typeof value !== "string" ||
        !value.trim()
    ) {
        throw ApiError.badRequest(
            `${fieldName} is required.`,
            {
                code: `${fieldName
                    .replace(
                        /\s+/g,
                        "_",
                    )
                    .toUpperCase()}_REQUIRED`,
            },
        );
    }

    return value.trim();
};

/*
|--------------------------------------------------------------------------
| Applicant Controllers
|--------------------------------------------------------------------------
*/

/**
 * Apply for a job vacancy.
 *
 * USER authentication required.
 */
export const createJobApplicationController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ): Promise<void> => {
            const applicantId =
                getAuthenticatedUserId(
                    req,
                );

            const application =
                await createJobApplication(
                    applicantId,
                    req.body,
                );

            res.status(201).json(
                ApiResponse.created(
                    application,
                    "Job application submitted successfully.",
                ).serialize(),
            );
        },
    );

/**
 * Get current user's applications.
 */
export const getMyJobApplicationsController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ): Promise<void> => {
            const applicantId =
                getAuthenticatedUserId(
                    req,
                );

            const result =
                await getMyJobApplications(
                    applicantId,
                    req.query as never,
                );

            res.status(200).json(
                ApiResponse.ok(
                    result,
                    "Applications retrieved successfully.",
                ).serialize(),
            );
        },
    );

/**
 * Get current user's single application.
 */
export const getMyJobApplicationController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ): Promise<void> => {
            const applicantId =
                getAuthenticatedUserId(
                    req,
                );

            const applicationId =
                getStringParam(
                    req.params.applicationId,
                    "application ID",
                );

            const application =
                await getJobApplicationById(
                    applicationId,
                );

            if (
                application.applicantId.toString() !==
                applicantId
            ) {
                throw ApiError.notFound(
                    "Job application not found.",
                );
            }

            res.status(200).json(
                ApiResponse.ok(
                    application,
                    "Application retrieved successfully.",
                ).serialize(),
            );
        },
    );

/**
 * Withdraw current user's application.
 */
export const withdrawJobApplicationController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ): Promise<void> => {
            const applicantId =
                getAuthenticatedUserId(
                    req,
                );

            const applicationId =
                getStringParam(
                    req.params.applicationId,
                    "application ID",
                );

            const application =
                await withdrawJobApplication(
                    applicationId,
                    applicantId,
                );

            res.status(200).json(
                ApiResponse.ok(
                    application,
                    "Job application withdrawn successfully.",
                ).serialize(),
            );
        },
    );

/*
|--------------------------------------------------------------------------
| OWNER MANAGEMENT CONTROLLERS
|--------------------------------------------------------------------------
*/

/**
 * Get all job applications.
 *
 * OWNER authentication + secret verification required.
 */
export const getAllJobApplicationsController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ): Promise<void> => {
            const result =
                await getAllJobApplications(
                    req.query as never,
                );

            res.status(200).json(
                ApiResponse.ok(
                    result,
                    "Job applications retrieved successfully.",
                ).serialize(),
            );
        },
    );

/**
 * Get application by ID.
 *
 * OWNER authentication + secret verification required.
 */
export const getJobApplicationController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ): Promise<void> => {
            const applicationId =
                getStringParam(
                    req.params.applicationId,
                    "application ID",
                );

            const application =
                await getJobApplicationById(
                    applicationId,
                );

            res.status(200).json(
                ApiResponse.ok(
                    application,
                    "Job application retrieved successfully.",
                ).serialize(),
            );
        },
    );

/**
 * Update application status.
 *
 * reviewedBy stores OWNER's User ID because the model
 * references User.
 */
export const updateJobApplicationStatusController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ): Promise<void> => {
            const reviewerId =
                getAuthenticatedOwnerUserId(
                    req,
                );

            const applicationId =
                getStringParam(
                    req.params.applicationId,
                    "application ID",
                );

            const application =
                await updateJobApplicationStatus(
                    applicationId,
                    reviewerId,
                    req.body,
                );

            res.status(200).json(
                ApiResponse.ok(
                    application,
                    "Job application status updated successfully.",
                ).serialize(),
            );
        },
    );

/**
 * Get application summary for a vacancy.
 */
export const getVacancyApplicationSummaryController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ): Promise<void> => {
            const vacancyId =
                getStringParam(
                    req.params.vacancyId,
                    "vacancy ID",
                );

            const summary =
                await getVacancyApplicationSummary(
                    vacancyId,
                );

            res.status(200).json(
                ApiResponse.ok(
                    summary,
                    "Application summary retrieved successfully.",
                ).serialize(),
            );
        },
    );
