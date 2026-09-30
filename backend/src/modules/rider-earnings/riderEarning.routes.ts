import {
    Router,
} from "express";

import {
    ownerAuth,
    ownerSecretVerified,
} from "../../middlewares/ownerAuth.middleware";

import {
    riderAuth,
    requireRiderRole,
} from "../../middlewares/riderAuth.middleware";

import {
    createRiderEarningController,
    getRiderEarningController,
    getAllRiderEarningsController,
    getRiderEarningsByRiderController,
    updateRiderEarningController,
    updateRiderEarningStatusController,
    deleteRiderEarningController,
    getMyRiderEarningsController,
    getMyRiderEarningController,
    getMyRiderEarningSummaryController,
} from "./riderEarning.controller";


const router = Router();


/*
|--------------------------------------------------------------------------
| RIDER — Self Service
|--------------------------------------------------------------------------
|
| These routes must appear before /:earningId.
|
|--------------------------------------------------------------------------
*/


// Get my earnings
router.get(
    "/me",
    riderAuth,
    requireRiderRole,
    getMyRiderEarningsController,
);


// Get my earnings summary
router.get(
    "/me/summary",
    riderAuth,
    requireRiderRole,
    getMyRiderEarningSummaryController,
);


// Get my earning by ID
router.get(
    "/me/:earningId",
    riderAuth,
    requireRiderRole,
    getMyRiderEarningController,
);


/*
|--------------------------------------------------------------------------
| OWNER — Rider Earnings
|--------------------------------------------------------------------------
*/


// Create earning
router.post(
    "/",
    ownerAuth,
    ownerSecretVerified,
    createRiderEarningController,
);


// List all earnings
router.get(
    "/",
    ownerAuth,
    ownerSecretVerified,
    getAllRiderEarningsController,
);


// Get earnings by rider
router.get(
    "/rider/:riderId",
    ownerAuth,
    ownerSecretVerified,
    getRiderEarningsByRiderController,
);


// Get earning by ID
router.get(
    "/:earningId",
    ownerAuth,
    ownerSecretVerified,
    getRiderEarningController,
);


// Update earning
router.patch(
    "/:earningId",
    ownerAuth,
    ownerSecretVerified,
    updateRiderEarningController,
);


// Update earning status
router.patch(
    "/:earningId/status",
    ownerAuth,
    ownerSecretVerified,
    updateRiderEarningStatusController,
);


// Delete earning
router.delete(
    "/:earningId",
    ownerAuth,
    ownerSecretVerified,
    deleteRiderEarningController,
);


export default router;