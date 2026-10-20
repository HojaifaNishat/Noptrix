import { Router } from "express";

import {
    userAuth,
    requireUser,
} from "../../middlewares/userAuth.middleware";

import {
    getMyPaymentByTransactionId,
    getMyPayments,
    initiatePaymentController,
} from "./payment.controller";

const router = Router();

router.use(userAuth, requireUser);

router.post("/initiate", initiatePaymentController);
router.get("/my", getMyPayments);
router.get("/my/:transactionId", getMyPaymentByTransactionId);

export default router;
