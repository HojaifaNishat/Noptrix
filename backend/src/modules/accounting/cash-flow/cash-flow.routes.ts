import { Router } from "express";
import { validate } from "../../../middlewares/validation.middleware";
import { financialReportHandler } from "../core/accounting-records.controller";
import { accountingReportQuerySchema } from "../core/accounting-records.validator";

const router = Router();

router.get(
  "/",
  validate(accountingReportQuerySchema, "query"),
  financialReportHandler("CASH_FLOW"),
);

export default router;
