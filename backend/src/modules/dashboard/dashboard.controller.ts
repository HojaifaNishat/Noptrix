
import type { RequestHandler } from "express";

import {
    asyncHandler,
} from "../../utils/asyncHandler";

import {
    ApiResponse,
} from "../../utils/ApiResponse";

import {
    getDashboardOverview,
} from "./dashboard.service";

/*
|--------------------------------------------------------------------------
| Dashboard Overview Controller
|--------------------------------------------------------------------------
| Access is enforced by the dashboard route middleware.
| This controller passes the authenticated role and permissions to the
| dashboard service; it does not perform database queries directly.
|--------------------------------------------------------------------------
*/

export const getDashboardOverviewController: RequestHandler =
    asyncHandler(async (req, res) => {
        const ownerRole = req.ownerAuth?.role
            ?.trim()
            .toUpperCase();

        const adminRole = req.adminAuth?.role
            ?.trim()
            .toUpperCase();

        const isOwner =
            ownerRole === "OWNER" ||
            adminRole === "OWNER";

        const permissions = isOwner
            ? []
            : req.adminAuth?.permissions ?? [];

        const overview = await getDashboardOverview(
            permissions,
            isOwner,
        );

        res.status(200).json(
            ApiResponse.ok(
                overview,
                "Dashboard overview fetched successfully.",
            ).serialize(),
        );
    });
