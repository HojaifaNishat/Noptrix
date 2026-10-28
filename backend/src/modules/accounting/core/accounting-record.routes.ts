import { Router } from "express";
import { validate } from "../../../middlewares/validation.middleware";
import {
  createRecordHandler,
  listRecordsHandler,
} from "./accounting-records.controller";
import {
  accountingRecordListQuerySchema,
  accountingRecordSchema,
} from "./accounting-records.validator";
import type { IAccountingRecord } from "./accounting-records.model";

export function createAccountingRecordRouter(type: IAccountingRecord["type"]) {
  const router = Router();

  router.get(
    "/",
    validate(accountingRecordListQuerySchema, "query"),
    listRecordsHandler(type),
  );
  router.post("/", validate(accountingRecordSchema), createRecordHandler(type));

  return router;
}
