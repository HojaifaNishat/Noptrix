import {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    hasPermissionMatch,
} from "../../middlewares/permission.middleware";

import {
    ApiError,
} from "../../utils/ApiError";

/*
|--------------------------------------------------------------------------
| Job Application Status Permission
|--------------------------------------------------------------------------
|
| SELECTED
|   -> job_applications.approve
|
| REJECTED
|   -> job_applications.reject
|
| Other statuses
|   -> job_applications.update
|
| job_applications.manage
|   -> Full access
|
| OWNER
|   -> Automatically allowed by permission middleware
|
|--------------------------------------------------------------------------
*/

export const requireJobApplicationStatusPermission = (
    req: Request,
    _res: Response,
    next: NextFunction,
): void => {
    const status =
        typeof req.body?.status === "string"
            ? req.body.status
                .trim()
                .toUpperCase()
            : "";

    let allowed = false;

    /*
    |--------------------------------------------------------------------------
    | SELECTED
    |--------------------------------------------------------------------------
    */

    if (status === "SELECTED") {
        allowed =
            hasPermissionMatch(
                req,
                "job_applications.approve",
            ) ||
            hasPermissionMatch(
                req,
                "job_applications.manage",
            );
    }

    /*
    |--------------------------------------------------------------------------
    | REJECTED
    |--------------------------------------------------------------------------
    */

    else if (status === "REJECTED") {
        allowed =
            hasPermissionMatch(
                req,
                "job_applications.reject",
            ) ||
            hasPermissionMatch(
                req,
                "job_applications.manage",
            );
    }

    /*
    |--------------------------------------------------------------------------
    | Other Status Updates
    |--------------------------------------------------------------------------
    */

    else {
        allowed =
            hasPermissionMatch(
                req,
                "job_applications.update",
            ) ||
            hasPermissionMatch(
                req,
                "job_applications.manage",
            );
    }

    /*
    |--------------------------------------------------------------------------
    | Authorization Failure
    |--------------------------------------------------------------------------
    */

    if (!allowed) {
        throw ApiError.forbidden(
            "You do not have permission to perform this job application status action.",
        );
    }

    next();
};
