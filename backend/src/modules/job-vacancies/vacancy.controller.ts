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
    Admin,
} from "../admins/admin.model";

import {
    getAuthenticatedAdminId,
    getAuthenticatedAdminRole,
} from "../../middlewares/adminAuth.middleware";

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
                    .replace(/\s+/g, "_")
                    .toUpperCase()}_REQUIRED`,
            },
        );
    }

    return value.trim();
};

/*
|--------------------------------------------------------------------------
| Resolve Actor User ID
|--------------------------------------------------------------------------
|
| Vacancy service stores createdBy / updatedBy as User references.
|
| OWNER:
|   Owner auth directly provides Owner User ID.
|
| ADMIN:
|   adminAuth provides Admin._id, so resolve Admin.userId.
|
|--------------------------------------------------------------------------
*/

const getAuthenticatedActorUserId =
    async (
        req: Request,
    ): Promise<string> => {
        const role =
            getAuthenticatedAdminRole(
                req,
            );

        if (
            role
                ?.trim()
                .toUpperCase() ===
            "OWNER"
        ) {
            return getAuthenticatedOwnerUserId(
                req,
            );
        }

        const adminId =
            getAuthenticatedAdminId(
                req,
            );

        const admin =
            await Admin.findById(
                adminId,
            )
                .select("userId status")
                .lean()
                .exec();

        if (!admin) {
            throw ApiError.forbidden(
                "Admin account not found.",
                {
                    code:
                        "ADMIN_ACCOUNT_NOT_FOUND",
                },
            );
        }

        if (
            admin.status !==
            "ACTIVE"
        ) {
            throw ApiError.forbidden(
                "Inactive admins cannot manage job vacancies.",
                {
                    code:
                        "ADMIN_INACTIVE",
                },
            );
        }

        if (!admin.userId) {
            throw ApiError.internal(
                "Admin user account is not configured.",
                {
                    code:
                        "ADMIN_USER_ACCOUNT_MISSING",
                },
            );
        }

        return admin.userId.toString();
    };

/*
|--------------------------------------------------------------------------
| Create Vacancy
|--------------------------------------------------------------------------
*/

export const createVacancyController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const actorUserId =
                await getAuthenticatedActorUserId(
                    req,
                );

            const vacancy =
                await createVacancy(
                    actorUserId,
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
| PUBLIC
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
                data:
                    result.vacancies,
                pagination:
                    result.pagination,
            });
        },
    );

/*
|--------------------------------------------------------------------------
| Get Public Vacancies
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
                data:
                    result.vacancies,
                pagination:
                    result.pagination,
            });
        },
    );

/*
|--------------------------------------------------------------------------
| Update Vacancy
|--------------------------------------------------------------------------
*/

export const updateVacancyController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const actorUserId =
                await getAuthenticatedActorUserId(
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
                    actorUserId,
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
*/

export const updateVacancyStatusController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const actorUserId =
                await getAuthenticatedActorUserId(
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
                    actorUserId,
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
*/

export const publishVacancyController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const actorUserId =
                await getAuthenticatedActorUserId(
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
                    actorUserId,
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
*/

export const pauseVacancyController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const actorUserId =
                await getAuthenticatedActorUserId(
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
                    actorUserId,
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
*/

export const closeVacancyController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const actorUserId =
                await getAuthenticatedActorUserId(
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
                    actorUserId,
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
*/

export const deleteVacancyController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const actorUserId =
                await getAuthenticatedActorUserId(
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
                    actorUserId,
                );

            res.status(200).json({
                success: true,
                message:
                    "Job vacancy deleted successfully.",
                data: result,
            });
        },
    );
