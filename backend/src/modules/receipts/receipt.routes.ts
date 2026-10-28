import { Router } from "express";
import { userAuth } from "../../middlewares/userAuth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import {
  createReceipt,
  getReceipt,
  getReceiptByOrder,
  listReceipts,
} from "./receipt.controller";
import {
  receiptIdParamSchema,
  receiptOrderParamSchema,
} from "./receipt.validator";

const router = Router();

// All receipt endpoints are customer-owned endpoints.
router.use(userAuth);

router.get("/", listReceipts);

router.post(
  "/orders/:orderId",
  validate(receiptOrderParamSchema),
  createReceipt,
);

router.get(
  "/orders/:orderId",
  validate(receiptOrderParamSchema),
  getReceiptByOrder,
);

router.get("/:receiptId", validate(receiptIdParamSchema), getReceipt);

export default router;
