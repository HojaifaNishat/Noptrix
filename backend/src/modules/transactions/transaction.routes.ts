import { Router } from "express";

import { userAuth, requireUser } from "../../middlewares/userAuth.middleware";

import { ownerOrAdminAuth } from "../../middlewares/ownerOrAdminAuth.middleware";

import {
  loadRolePermissions,
  requirePermission,
} from "../../middlewares/permission.middleware";

import {
  getAdminTransactions,
  getMyTransactionById,
  getMyTransactions,
} from "./transaction.controller";

const router = Router();

/**
 * Customer transaction history.
 */
router.get("/my", userAuth, requireUser, getMyTransactions);

router.get("/my/:transactionId", userAuth, requireUser, getMyTransactionById);

/**
 * Read-only admin transaction search.
 * Ensure "transactions.read" exists in the role/permission seed.
 */
router.get(
  "/admin",
  ownerOrAdminAuth,
  loadRolePermissions,
  requirePermission("transactions.read"),
  getAdminTransactions,
);

export default router;
