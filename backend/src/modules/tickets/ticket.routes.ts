import { Router, type RequestHandler } from "express";

import { userAuth } from "../../middlewares/userAuth.middleware";
import {
  adminAuth,
  adminSecretVerified,
} from "../../middlewares/adminAuth.middleware";
import { hasPermissionMatch } from "../../middlewares/permission.middleware";

import {
  createTicketController,
  listCustomerTicketsController,
  getCustomerTicketController,
  customerReplyController,
  closeCustomerTicketController,
  listAdminTicketsController,
  getAdminTicketController,
  adminReplyController,
  adminInternalNoteController,
  updateTicketController,
  assignTicketController,
} from "./ticket.controller";

const router = Router();

function requireTicketPermission(permission: string): RequestHandler {
  return (req, res, next) => {
    const admin = req.adminAuth;

    if (!admin?.adminId) {
      res.status(401).json({
        success: false,
        message: "Admin authentication required.",
      });
      return;
    }

    if (admin.role?.trim().toUpperCase() === "OWNER") {
      next();
      return;
    }

    req.permissions = Object.freeze([...(admin.permissions ?? [])]);

    if (!hasPermissionMatch(req, permission)) {
      res.status(403).json({
        success: false,
        message: `Missing permission: ${permission}`,
      });
      return;
    }

    next();
  };
}

/*
 * Customer endpoints
 */
router.post("/", userAuth, createTicketController);
router.get("/my", userAuth, listCustomerTicketsController);
router.get("/:ticketId", userAuth, getCustomerTicketController);
router.post("/:ticketId/replies", userAuth, customerReplyController);
router.post("/:ticketId/close", userAuth, closeCustomerTicketController);

/*
 * Staff inbox endpoints.
 * OWNER is allowed by the permission guard when adminAuth
 * correctly identifies the token as OWNER.
 */
router.get(
  "/admin/inbox",
  adminAuth,
  requireTicketPermission("tickets.read"),
  listAdminTicketsController,
);

router.get(
  "/admin/:ticketId",
  adminAuth,
  requireTicketPermission("tickets.read"),
  getAdminTicketController,
);

router.post(
  "/admin/:ticketId/replies",
  adminAuth,
  adminSecretVerified,
  requireTicketPermission("tickets.update"),
  adminReplyController,
);

router.post(
  "/admin/:ticketId/internal-notes",
  adminAuth,
  adminSecretVerified,
  requireTicketPermission("tickets.update"),
  adminInternalNoteController,
);

router.patch(
  "/admin/:ticketId",
  adminAuth,
  adminSecretVerified,
  requireTicketPermission("tickets.update"),
  updateTicketController,
);

router.patch(
  "/admin/:ticketId/assignment",
  adminAuth,
  adminSecretVerified,
  requireTicketPermission("tickets.manage"),
  assignTicketController,
);

export default router;
