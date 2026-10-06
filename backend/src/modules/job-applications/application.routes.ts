import {
    Router,
} from "express";

import {
    userAuth,
} from "../../middlewares/userAuth.middleware";

import {
    ownerAuth,
    ownerSecretVerified,
} from "../../middlewares/ownerAuth.middleware";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    createJobApplicationController,
    getMyJobApplicationsController,
    getMyJobApplicationController,
    withdrawJobApplicationController,
    getAllJobApplicationsController,
    getJobApplicationController,
    updateJobApplicationStatusController,
    getVacancyApplicationSummaryController,
} from "./application.controller";

import {
    createJobApplicationSchema,
    updateJobApplicationStatusSchema,
    jobApplicationIdParamSchema,
    jobApplicationQuerySchema,
    vacancyIdParamSchema,
} from "./application.validator";

const router = Router();

/*
|--------------------------------------------------------------------------
| USER / APPLICANT
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Apply
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    userAuth,
    validate(
        createJobApplicationSchema,
        "body",
    ),
    createJobApplicationController,
);

/*
|--------------------------------------------------------------------------
| My Applications
|--------------------------------------------------------------------------
*/

router.get(
    "/me",
    userAuth,
    validate(
        jobApplicationQuerySchema,
        "query",
    ),
    getMyJobApplicationsController,
);

/*
|--------------------------------------------------------------------------
| My Single Application
|--------------------------------------------------------------------------
*/

router.get(
    "/me/:applicationId",
    userAuth,
    validate(
        jobApplicationIdParamSchema,
        "params",
    ),
    getMyJobApplicationController,
);

/*
|--------------------------------------------------------------------------
| Withdraw
|--------------------------------------------------------------------------
*/

router.post(
    "/me/:applicationId/withdraw",
    userAuth,
    validate(
        jobApplicationIdParamSchema,
        "params",
    ),
    withdrawJobApplicationController,
);

/*
|--------------------------------------------------------------------------
| OWNER MANAGEMENT
|--------------------------------------------------------------------------
*/

const ownerOnly = [
    ownerAuth,
    ownerSecretVerified,
];

/*
|--------------------------------------------------------------------------
| Vacancy Application Summary
|--------------------------------------------------------------------------
|
| IMPORTANT:
| This MUST remain before /:applicationId.
|
|--------------------------------------------------------------------------
*/

router.get(
    "/vacancy/:vacancyId/summary",
    ...ownerOnly,
    validate(
        vacancyIdParamSchema,
        "params",
    ),
    getVacancyApplicationSummaryController,
);

/*
|--------------------------------------------------------------------------
| All Applications
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    ...ownerOnly,
    validate(
        jobApplicationQuerySchema,
        "query",
    ),
    getAllJobApplicationsController,
);

/*
|--------------------------------------------------------------------------
| Update Application Status
|--------------------------------------------------------------------------
*/

router.patch(
    "/:applicationId/status",
    ...ownerOnly,
    validate(
        jobApplicationIdParamSchema,
        "params",
    ),
    validate(
        updateJobApplicationStatusSchema,
        "body",
    ),
    updateJobApplicationStatusController,
);

/*
|--------------------------------------------------------------------------
| Get Application By ID
|--------------------------------------------------------------------------
|
| Keep this generic route AFTER all specific routes.
|
|--------------------------------------------------------------------------
*/

router.get(
    "/:applicationId",
    ...ownerOnly,
    validate(
        jobApplicationIdParamSchema,
        "params",
    ),
    getJobApplicationController,
);

export default router;
