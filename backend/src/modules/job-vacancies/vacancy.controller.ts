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
    getAuthenticatedOwnerId,
} from "../../middlewares/ownerAuth.middleware";

import {
    createVacancy,
    getVacancyById,
    getVacancyBySlug,
    getVacancies,
    getPublicVacancies,
    updateVacancy,
    updateVacancyStatus,
    publishVacancy,
    pauseVacancy,
    closeVacancy,
} from "./vacancy.service";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getRouteParam = (
    value:
        | string
        | string[]
        | undefined,
    fieldName: string,
): string => {
    if (
        typeof value !==
            "string" ||
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
| Create Vacancy
|--------------------------------------------------------------------------
| OWNER only
|--------------------------------------------------------------------------
*/

export const createVacancyController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const ownerId =
                getAuthenticatedOwnerId(
                    req,
                );

            const vacancy =
                await createVacancy({
                    ...req.body,
                    createdBy:
                        ownerId,
                });

            res.status(201).json({
                success: true,
                message:
                    "Job vacancy created successfully.",
                data: vacancy,
            });
        },
    );

/*
|--------------------------------------------------------------------------
| Get Vacancy
|--------------------------------------------------------------------------
| OWNER / Authorized Management
|--------------------------------------------------------------------------
*/

export const getVacancyController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const vacancyId =
                getRouteParam(
                    req.params
                        .vacancyId,
                    "Vacancy ID",
                );

            const vacancy =
                await getVacancyById(
                    vacancyId,
                );

            res.status(200).json({
                success: true,
                message:
                    "Job vacancy retrieved successfully.",
                data: vacancy,
            });
        },
    );

/*
|--------------------------------------------------------------------------
| Get Vacancy By Slug
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/

export const getVacancyBySlugController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const slug =
                getRouteParam(
                    req.params.slug,
                    "Vacancy slug",
                );

            const vacancy =
                await getVacancyBySlug(
                    slug,
                );

            res.status(200).json({
                success: true,
                message:
                    "Job vacancy retrieved successfully.",
                data: vacancy,
            });
        },
    );

/*
|--------------------------------------------------------------------------
| Get Vacancies
|--------------------------------------------------------------------------
| Management Listing
|--------------------------------------------------------------------------
*/

export const getVacanciesController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const result =
                await getVacancies(
                    req.query as never,
                );

            res.status(200).json({
                success: true,
                message:
                    "Job vacancies retrieved successfully.",
                data: result.items,
                pagination:
                    result.pagination,
            });
        },
    );

/*
|--------------------------------------------------------------------------
| Get Public Vacancies
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/

export const getPublicVacanciesController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const result =
                await getPublicVacancies(
                    req.query as never,
                );

            res.status(200).json({
                success: true,
                message:
                    "Open job vacancies retrieved successfully.",
                data: result.items,
                pagination:
                    result.pagination,
            });
        },
    );

/*
|--------------------------------------------------------------------------
| Update Vacancy
|--------------------------------------------------------------------------
| OWNER / Authorized Management
|--------------------------------------------------------------------------
*/

export const updateVacancyController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const ownerId =
                getAuthenticatedOwnerId(
                    req,
                );

            const vacancyId =
                getRouteParam(
                    req.params
                        .vacancyId,
                    "Vacancy ID",
                );

            const vacancy =
                await updateVacancy(
                    vacancyId,
                    req.body,
                    ownerId,
                );

            res.status(200).json({
                success: true,
                message:
                    "Job vacancy updated successfully.",
                data: vacancy,
            });
        },
    );

/*
|--------------------------------------------------------------------------
| Update Vacancy Status
|--------------------------------------------------------------------------
| OWNER only
|--------------------------------------------------------------------------
*/

export const updateVacancyStatusController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const ownerId =
                getAuthenticatedOwnerId(
                    req,
                );

            const vacancyId =
                getRouteParam(
                    req.params
                        .vacancyId,
                    "Vacancy ID",
                );

            const vacancy =
                await updateVacancyStatus(
                    vacancyId,
                    req.body,
                    ownerId,
                );

            res.status(200).json({
                success: true,
                message:
                    "Job vacancy status updated successfully.",
                data: vacancy,
            });
        },
    );

/*
|--------------------------------------------------------------------------
| Publish Vacancy
|--------------------------------------------------------------------------
| OWNER only
|--------------------------------------------------------------------------
*/

export const publishVacancyController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const ownerId =
                getAuthenticatedOwnerId(
                    req,
                );

            const vacancyId =
                getRouteParam(
                    req.params
                        .vacancyId,
                    "Vacancy ID",
                );

            const vacancy =
                await publishVacancy(
                    vacancyId,
                    ownerId,
                );

            res.status(200).json({
                success: true,
                message:
                    "Job vacancy published successfully.",
                data: vacancy,
            });
        },
    );

/*
|--------------------------------------------------------------------------
| Pause Vacancy
|--------------------------------------------------------------------------
| OWNER only
|--------------------------------------------------------------------------
*/

export const pauseVacancyController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const ownerId =
                getAuthenticatedOwnerId(
                    req,
                );

            const vacancyId =
                getRouteParam(
                    req.params
                        .vacancyId,
                    "Vacancy ID",
                );

            const vacancy =
                await pauseVacancy(
                    vacancyId,
                    ownerId,
                );

            res.status(200).json({
                success: true,
                message:
                    "Job vacancy paused successfully.",
                data: vacancy,
            });
        },
    );

/*
|--------------------------------------------------------------------------
| Close Vacancy
|--------------------------------------------------------------------------
| OWNER only
|--------------------------------------------------------------------------
*/

export const closeVacancyController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const ownerId =
                getAuthenticatedOwnerId(
                    req,
                );

            const vacancyId =
                getRouteParam(
                    req.params
                        .vacancyId,
                    "Vacancy ID",
                );

            const vacancy =
                await closeVacancy(
                    vacancyId,
                    ownerId,
                );

            res.status(200).json({
                success: true,
                message:
                    "Job vacancy closed successfully.",
                data: vacancy,
            });
        },
    );