import { Router } from "express";
import { validate } from "../../../middlewares/validation.middleware";
import { ledgerHandler } from "../core/accounting-core.controller";
import { listLedgerQuerySchema } from "../core/accounting-core.validator";

const router = Router();

router.get("/", validate(listLedgerQuerySchema, "query"), ledgerHandler);

export default router;
