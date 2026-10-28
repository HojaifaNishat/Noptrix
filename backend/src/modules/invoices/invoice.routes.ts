import { Router } from "express";
import { ownerOrAdminAuth } from "../../middlewares/ownerOrAdminAuth.middleware";
import {
  validate,
  validateRequest,
} from "../../middlewares/validation.middleware";
import {
  createInvoiceController,
  getInvoiceController,
  listInvoicesController,
  updateInvoiceStatusController,
} from "./invoice.controller";
import {
  createInvoiceSchema,
  invoiceIdParamsSchema,
  invoiceListQuerySchema,
  invoiceStatusSchema,
} from "./invoice.validator";

const router = Router();

// Management routes are restricted to Owner/Admin.
router.use(ownerOrAdminAuth);

router.get(
  "/",
  validateRequest({ query: invoiceListQuerySchema.shape.query }),
  listInvoicesController,
);

router.post(
  "/",
  validateRequest({ body: createInvoiceSchema.shape.body }),
  createInvoiceController,
);

router.get(
  "/:invoiceId",
  validate(invoiceIdParamsSchema, "params"),
  getInvoiceController,
);

router.patch(
  "/:invoiceId/status",
  validateRequest({
    params: invoiceStatusSchema.shape.params,
    body: invoiceStatusSchema.shape.body,
  }),
  updateInvoiceStatusController,
);

export default router;
