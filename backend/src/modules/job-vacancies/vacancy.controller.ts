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
    getAuthenticatedOwnerUserId,
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
    deleteVacancy,
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
            const ownerUserId =
                getAuthenticatedOwnerUserId(
                    req,
                );

            const vacancy =
                await createVacancy(
                    ownerUserId,
                    req.body,
                );

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
| OWNER only
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
                    req.params.vacancyId,
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
| OWNER management listing
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
                data: result.vacancies,
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
                data: result.vacancies,
                pagination:
                    result.pagination,
            });
        },
    );

/*
|--------------------------------------------------------------------------
| Update Vacancy
|--------------------------------------------------------------------------
| OWNER only
|--------------------------------------------------------------------------
*/

export const updateVacancyController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const ownerUserId =
                getAuthenticatedOwnerUserId(
                    req,
                );

            const vacancyId =
                getRouteParam(
                    req.params.vacancyId,
                    "Vacancy ID",
                );

            const vacancy =
                await updateVacancy(
                    vacancyId,
                    ownerUserId,
                    req.body,
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
            const ownerUserId =
                getAuthenticatedOwnerUserId(
                    req,
                );

            const vacancyId =
                getRouteParam(
                    req.params.vacancyId,
                    "Vacancy ID",
                );

            const vacancy =
                await updateVacancyStatus(
                    vacancyId,
                    ownerUserId,
                    req.body,
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
            const ownerUserId =
                getAuthenticatedOwnerUserId(
                    req,
                );

            const vacancyId =
                getRouteParam(
                    req.params.vacancyId,
                    "Vacancy ID",
                );

            const vacancy =
                await publishVacancy(
                    vacancyId,
                    ownerUserId,
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
            const ownerUserId =
                getAuthenticatedOwnerUserId(
                    req,
                );

            const vacancyId =
                getRouteParam(
                    req.params.vacancyId,
                    "Vacancy ID",
                );

            const vacancy =
                await pauseVacancy(
                    vacancyId,
                    ownerUserId,
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
            const ownerUserId =
                getAuthenticatedOwnerUserId(
                    req,
                );

            const vacancyId =
                getRouteParam(
                    req.params.vacancyId,
                    "Vacancy ID",
                );

            const vacancy =
                await closeVacancy(
                    vacancyId,
                    ownerUserId,
                );

            res.status(200).json({
                success: true,
                message:
                    "Job vacancy closed successfully.",
                data: vacancy,
            });
        },
    );


/*
|--------------------------------------------------------------------------
| Delete Vacancy
|--------------------------------------------------------------------------
| OWNER only
|--------------------------------------------------------------------------
*/

export const deleteVacancyController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const ownerUserId =
                getAuthenticatedOwnerUserId(
                    req,
                );

            const vacancyId =
                getRouteParam(
                    req.params.vacancyId,
                    "Vacancy ID",
                );

            const result =
                await deleteVacancy(
                    vacancyId,
                    ownerUserId,
                );

            res.status(200).json({
                success: true,
                message:
                    "Job vacancy deleted successfully.",
                data: result,
            });
        },
    );
