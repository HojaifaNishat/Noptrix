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
} from "./application.validator";

const router = Router();

/*
|--------------------------------------------------------------------------
| USER / APPLICANT ROUTES
|--------------------------------------------------------------------------
*/

/**
 * Submit a job application
 *
 * POST /job-applications
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

/**
 * Get my job applications
 *
 * GET /job-applications/me
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

/**
 * Get my single job application
 *
 * GET /job-applications/me/:applicationId
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

/**
 * Withdraw my job application
 *
 * POST /job-applications/me/:applicationId/withdraw
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
| OWNER MANAGEMENT ROUTES
|--------------------------------------------------------------------------
|
| Only OWNER can manage job applications.
|
*/

const ownerOnly = [
    ownerAuth,
    ownerSecretVerified,
];

/**
 * Get all job applications
 *
 * GET /job-applications
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

/**
 * Get application by ID
 *
 * GET /job-applications/:applicationId
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

/**
 * Update application status
 *
 * PATCH /job-applications/:applicationId/status
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

/**
 * Get vacancy application summary
 *
 * GET /job-applications/vacancy/:vacancyId/summary
 */
router.get(
    "/vacancy/:vacancyId/summary",
    ...ownerOnly,
    getVacancyApplicationSummaryController,
);

export default router;