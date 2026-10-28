import { Router } from "express";
import { validate } from "../../../middlewares/validation.middleware";
import {
  createAccountHandler,
  filteredAccountsHandler,
  getAccountHandler,
  updateAccountHandler,
} from "../core/accounting-core.controller";
import {
  createAccountSchema,
  listAccountsQuerySchema,
  objectIdParamSchema,
  updateAccountSchema,
} from "../core/accounting-core.validator";

const router = Router();

router.get(
  "/",
  validate(listAccountsQuerySchema, "query"),
  filteredAccountsHandler,
);
router.post("/", validate(createAccountSchema), createAccountHandler);
router.get("/:id", validate(objectIdParamSchema, "params"), getAccountHandler);
router.patch(
  "/:id",
  validate(objectIdParamSchema, "params"),
  validate(updateAccountSchema),
  updateAccountHandler,
);

export default router;
