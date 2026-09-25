import {
    Request,
    Response,
} from "express";

import {
    asyncHandler,
} from "../../utils/asyncHandler";

import {
    ApiResponse,
} from "../../utils/ApiResponse";

import {
    getAuthenticatedUserId,
} from "../../middlewares/userAuth.middleware";

import {
    getAuthenticatedAdminId,
} from "../../middlewares/adminAuth.middleware";

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
    value: string | string[] | undefined,
    fieldName: string,
): string => {
    if (
        typeof value !== "string" ||
        value.length === 0
    ) {
        throw new Error(
            `Invalid ${fieldName}.`,
        );
    }

    return value;
};

/*
|--------------------------------------------------------------------------
| Applicant Controllers
|--------------------------------------------------------------------------
*/

/**
 * Apply for a job vacancy
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
 * Get my applications
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
 * Get my single application
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
                    "applicationId",
                );

            const application =
                await getJobApplicationById(
                    applicationId,
                );

            if (
                !application.applicantId.equals(
                    applicantId,
                )
            ) {
                throw new Error(
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
 * Withdraw my application
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
                    "applicationId",
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
| Admin Controllers
|--------------------------------------------------------------------------
*/

/**
 * Get all job applications
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
 * Get application by ID
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
                    "applicationId",
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
 * Update application status
 */
export const updateJobApplicationStatusController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ): Promise<void> => {
            const reviewerId =
                getAuthenticatedAdminId(
                    req,
                );

            const applicationId =
                getStringParam(
                    req.params.applicationId,
                    "applicationId",
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
 * Get vacancy application summary
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
                    "vacancyId",
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