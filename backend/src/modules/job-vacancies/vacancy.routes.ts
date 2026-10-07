import {
    Router,
} from "express";

import {
    adminAuth,
    adminSecretVerified,
} from "../../middlewares/adminAuth.middleware";

import {
    requirePermissionMatch,
} from "../../middlewares/permission.middleware";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    createVacancyController,
    getVacancyController,
    getVacancyBySlugController,
    getVacanciesController,
    getPublicVacanciesController,
    updateVacancyController,
    updateVacancyStatusController,
    publishVacancyController,
    pauseVacancyController,
    closeVacancyController,
    deleteVacancyController,
} from "./vacancy.controller";

import {
    createVacancySchema,
    updateVacancySchema,
    vacancyIdParamSchema,
    updateVacancyStatusSchema,
    vacancyQuerySchema,
} from "./vacancy.validator";

const router = Router();

/*
|--------------------------------------------------------------------------
| PUBLIC
|--------------------------------------------------------------------------
*/

router.get(
    "/public",
    validate(
        vacancyQuerySchema,
        "query",
    ),
    getPublicVacanciesController,
);

router.get(
    "/public/:slug",
    getVacancyBySlugController,
);

/*
|--------------------------------------------------------------------------
| ADMIN / OWNER MANAGEMENT AUTH
|--------------------------------------------------------------------------
*/

const managementAuth = [
    adminAuth,
    adminSecretVerified,
];

/*
|--------------------------------------------------------------------------
| CREATE
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    ...managementAuth,
    requirePermissionMatch(
        "job_vacancies.create",
        "job_vacancies.manage",
    ),
    validate(
        createVacancySchema,
        "body",
    ),
    createVacancyController,
);

/*
|--------------------------------------------------------------------------
| LIST
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    ...managementAuth,
    requirePermissionMatch(
        "job_vacancies.read",
        "job_vacancies.manage",
    ),
    validate(
        vacancyQuerySchema,
        "query",
    ),
    getVacanciesController,
);

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

router.patch(
    "/:vacancyId/status",
    ...managementAuth,
    requirePermissionMatch(
        "job_vacancies.update",
        "job_vacancies.manage",
    ),
    validate(
        vacancyIdParamSchema,
        "params",
    ),
    validate(
        updateVacancyStatusSchema,
        "body",
    ),
    updateVacancyStatusController,
);

/*
|--------------------------------------------------------------------------
| PUBLISH
|--------------------------------------------------------------------------
*/

router.post(
    "/:vacancyId/publish",
    ...managementAuth,
    requirePermissionMatch(
        "job_vacancies.update",
        "job_vacancies.manage",
    ),
    validate(
        vacancyIdParamSchema,
        "params",
    ),
    publishVacancyController,
);

/*
|--------------------------------------------------------------------------
| PAUSE
|--------------------------------------------------------------------------
*/

router.post(
    "/:vacancyId/pause",
    ...managementAuth,
    requirePermissionMatch(
        "job_vacancies.update",
        "job_vacancies.manage",
    ),
    validate(
        vacancyIdParamSchema,
        "params",
    ),
    pauseVacancyController,
);

/*
|--------------------------------------------------------------------------
| CLOSE
|--------------------------------------------------------------------------
*/

router.post(
    "/:vacancyId/close",
    ...managementAuth,
    requirePermissionMatch(
        "job_vacancies.update",
        "job_vacancies.manage",
    ),
    validate(
        vacancyIdParamSchema,
        "params",
    ),
    closeVacancyController,
);

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/

router.delete(
    "/:vacancyId",
    ...managementAuth,
    requirePermissionMatch(
        "job_vacancies.delete",
        "job_vacancies.manage",
    ),
    validate(
        vacancyIdParamSchema,
        "params",
    ),
    deleteVacancyController,
);

/*
|--------------------------------------------------------------------------
| UPDATE
|--------------------------------------------------------------------------
*/

router.patch(
    "/:vacancyId",
    ...managementAuth,
    requirePermissionMatch(
        "job_vacancies.update",
        "job_vacancies.manage",
    ),
    validate(
        vacancyIdParamSchema,
        "params",
    ),
    validate(
        updateVacancySchema,
        "body",
    ),
    updateVacancyController,
);

/*
|--------------------------------------------------------------------------
| GET BY ID
|--------------------------------------------------------------------------
*/

router.get(
    "/:vacancyId",
    ...managementAuth,
    requirePermissionMatch(
        "job_vacancies.read",
        "job_vacancies.manage",
    ),
    validate(
        vacancyIdParamSchema,
        "params",
    ),
    getVacancyController,
);

export default router;
