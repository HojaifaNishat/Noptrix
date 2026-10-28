import { Router } from "express";
import { validate } from "../../../middlewares/validation.middleware";
import {
  createJournalHandler,
  getJournalHandler,
  listJournalHandler,
  postJournalHandler,
  reverseJournalHandler,
} from "../core/accounting-core.controller";
import {
  createJournalSchema,
  listJournalQuerySchema,
  objectIdParamSchema,
  reverseJournalSchema,
} from "../core/accounting-core.validator";

const router = Router();

router.get("/", validate(listJournalQuerySchema, "query"), listJournalHandler);
router.post("/", validate(createJournalSchema), createJournalHandler);
router.get("/:id", validate(objectIdParamSchema, "params"), getJournalHandler);
router.post(
  "/:id/post",
  validate(objectIdParamSchema, "params"),
  postJournalHandler,
);
router.post(
  "/:id/reverse",
  validate(objectIdParamSchema, "params"),
  validate(reverseJournalSchema),
  reverseJournalHandler,
);

export default router;
