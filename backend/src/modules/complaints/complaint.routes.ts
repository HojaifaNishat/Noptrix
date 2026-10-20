import { Router } from "express";
import { userAuth } from "../../middlewares/userAuth.middleware";
import {
  ownerAuth,
  ownerSecretVerified,
} from "../../middlewares/ownerAuth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import * as controller from "./complaint.controller";
import {
  addComplaintMessageSchema,
  complaintIdParamSchema,
  complaintQuerySchema,
  createComplaintSchema,
  updateComplaintSchema,
} from "./complaint.validator";

const router = Router();

// Customer endpoints
router.post(
  "/",
  userAuth,
  validate(createComplaintSchema),
  controller.createComplaint,
);

router.get(
  "/mine",
  userAuth,
  validate(complaintQuerySchema, "query"),
  controller.getMyComplaints,
);

router.get(
  "/mine/:complaintId",
  userAuth,
  validate(complaintIdParamSchema, "params"),
  controller.getMyComplaintById,
);

router.post(
  "/mine/:complaintId/messages",
  userAuth,
  validate(complaintIdParamSchema, "params"),
  validate(addComplaintMessageSchema),
  controller.addCustomerMessage,
);

// Owner-only management endpoints
router.use(ownerAuth, ownerSecretVerified);

router.get(
  "/",
  validate(complaintQuerySchema, "query"),
  controller.getAllComplaints,
);

router.get(
  "/:complaintId",
  validate(complaintIdParamSchema, "params"),
  controller.getComplaintById,
);

router.post(
  "/:complaintId/messages",
  validate(complaintIdParamSchema, "params"),
  validate(addComplaintMessageSchema),
  controller.addStaffMessage,
);

router.patch(
  "/:complaintId",
  validate(complaintIdParamSchema, "params"),
  validate(updateComplaintSchema),
  controller.updateComplaint,
);

router.delete(
  "/:complaintId",
  validate(complaintIdParamSchema, "params"),
  controller.deleteComplaint,
);

export default router;
