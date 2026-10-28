import { Router } from "express";
import { validate } from "../../../middlewares/validation.middleware";
import { objectIdParamSchema } from "./accounting-core.validator";
import {
  approveRecordHandler,
  deleteRecordHandler,
  getRecordHandler,
  rejectRecordHandler,
  updateRecordHandler,
} from "./accounting-records.controller";
import { updateAccountingRecordSchema } from "./accounting-records.validator";

export const accountingRecordsRoutes = Router();

accountingRecordsRoutes.get(
  "/:id",
  validate(objectIdParamSchema, "params"),
  getRecordHandler,
);
accountingRecordsRoutes.patch(
  "/:id",
  validate(objectIdParamSchema, "params"),
  validate(updateAccountingRecordSchema),
  updateRecordHandler,
);
accountingRecordsRoutes.delete(
  "/:id",
  validate(objectIdParamSchema, "params"),
  deleteRecordHandler,
);
accountingRecordsRoutes.post(
  "/:id/approve",
  validate(objectIdParamSchema, "params"),
  approveRecordHandler,
);
accountingRecordsRoutes.post(
  "/:id/reject",
  validate(objectIdParamSchema, "params"),
  rejectRecordHandler,
);

export default accountingRecordsRoutes;
