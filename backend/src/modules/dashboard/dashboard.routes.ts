import {
    Router,
} from "express";

import {
    ownerOrAdminAuth,
} from "../../middlewares/ownerOrAdminAuth.middleware";

import {
    getDashboardOverviewController,
} from "./dashboard.controller";


const router =
    Router();


/*
|--------------------------------------------------------------------------
| Dashboard Overview
|--------------------------------------------------------------------------
|
| GET /api/dashboard/overview
|
| Accessible by:
|
| - OWNER
| - ADMIN
|
*/

router.get(
    "/overview",
    ownerOrAdminAuth,
    getDashboardOverviewController,
);


export default router;
