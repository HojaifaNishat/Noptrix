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
| Dashboard Overview
|--------------------------------------------------------------------------
*/

export const getDashboardOverviewController =
    asyncHandler(
        async (
            req,
            res,
        ) => {
            const isOwner =
                req.ownerAuth?.role?.trim().toUpperCase() === "OWNER";
            const overview =
                await getDashboardOverview(
                    req.adminAuth?.permissions ?? [],
                    isOwner,
                );

            res
                .status(200)
                .json(
                    ApiResponse.ok(
                        overview,
                        "Dashboard overview fetched successfully.",
                    ).serialize(),
                );
        },
    );
