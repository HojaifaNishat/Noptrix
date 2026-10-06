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
            _req,
            res,
        ) => {
            const overview =
                await getDashboardOverview();

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
