import {
    Router,
} from "express";

import {
    ownerAuth,
    ownerSecretVerified,
} from "../../middlewares/ownerAuth.middleware";

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
| Public Routes
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Get Open Vacancies
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


/*
|--------------------------------------------------------------------------
| Get Public Vacancy By Slug
|--------------------------------------------------------------------------
*/

router.get(
    "/public/:slug",
    getVacancyBySlugController,
);


/*
|--------------------------------------------------------------------------
| OWNER Routes
|--------------------------------------------------------------------------
*/

const ownerOnly = [
    ownerAuth,
    ownerSecretVerified,
];


/*
|--------------------------------------------------------------------------
| Create Vacancy
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    ...ownerOnly,
    validate(
        createVacancySchema,
        "body",
    ),
    createVacancyController,
);


/*
|--------------------------------------------------------------------------
| Get All Vacancies
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    ...ownerOnly,
    validate(
        vacancyQuerySchema,
        "query",
    ),
    getVacanciesController,
);


/*
|--------------------------------------------------------------------------
| Get Vacancy By ID
|--------------------------------------------------------------------------
*/

router.get(
    "/:vacancyId",
    ...ownerOnly,
    validate(
        vacancyIdParamSchema,
        "params",
    ),
    getVacancyController,
);


/*
|--------------------------------------------------------------------------
| Update Vacancy
|--------------------------------------------------------------------------
*/

router.patch(
    "/:vacancyId",
    ...ownerOnly,
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
| Update Vacancy Status
|--------------------------------------------------------------------------
*/

router.patch(
    "/:vacancyId/status",
    ...ownerOnly,
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
| Publish Vacancy
|--------------------------------------------------------------------------
*/

router.post(
    "/:vacancyId/publish",
    ...ownerOnly,
    validate(
        vacancyIdParamSchema,
        "params",
    ),
    publishVacancyController,
);


/*
|--------------------------------------------------------------------------
| Pause Vacancy
|--------------------------------------------------------------------------
*/

router.post(
    "/:vacancyId/pause",
    ...ownerOnly,
    validate(
        vacancyIdParamSchema,
        "params",
    ),
    pauseVacancyController,
);


/*
|--------------------------------------------------------------------------
| Close Vacancy
|--------------------------------------------------------------------------
*/

router.post(
    "/:vacancyId/close",
    ...ownerOnly,
    validate(
        vacancyIdParamSchema,
        "params",
    ),
    closeVacancyController,
);


export default router;