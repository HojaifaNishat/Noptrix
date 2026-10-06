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
| Public
|--------------------------------------------------------------------------
*/

router.get(
    "/public",
    validate(vacancyQuerySchema, "query"),
    getPublicVacanciesController,
);

router.get(
    "/public/:slug",
    getVacancyBySlugController,
);

/*
|--------------------------------------------------------------------------
| OWNER
|--------------------------------------------------------------------------
*/

const ownerOnly = [
    ownerAuth,
    ownerSecretVerified,
];

router.post(
    "/",
    ...ownerOnly,
    validate(createVacancySchema, "body"),
    createVacancyController,
);

router.get(
    "/",
    ...ownerOnly,
    validate(vacancyQuerySchema, "query"),
    getVacanciesController,
);

router.patch(
    "/:vacancyId/status",
    ...ownerOnly,
    validate(vacancyIdParamSchema, "params"),
    validate(updateVacancyStatusSchema, "body"),
    updateVacancyStatusController,
);

router.post(
    "/:vacancyId/publish",
    ...ownerOnly,
    validate(vacancyIdParamSchema, "params"),
    publishVacancyController,
);

router.post(
    "/:vacancyId/pause",
    ...ownerOnly,
    validate(vacancyIdParamSchema, "params"),
    pauseVacancyController,
);

router.post(
    "/:vacancyId/close",
    ...ownerOnly,
    validate(vacancyIdParamSchema, "params"),
    closeVacancyController,
);

router.delete(
    "/:vacancyId",
    ...ownerOnly,
    validate(vacancyIdParamSchema, "params"),
    deleteVacancyController,
);

router.patch(
    "/:vacancyId",
    ...ownerOnly,
    validate(vacancyIdParamSchema, "params"),
    validate(updateVacancySchema, "body"),
    updateVacancyController,
);

router.get(
    "/:vacancyId",
    ...ownerOnly,
    validate(vacancyIdParamSchema, "params"),
    getVacancyController,
);

export default router;
