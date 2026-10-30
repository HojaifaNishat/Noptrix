import { Router } from "express";

import { userAuth } from "../../middlewares/userAuth.middleware";
import { adminAuth } from "../../middlewares/adminAuth.middleware";
import { requirePermission } from "../../middlewares/permission.middleware";

import { validate } from "../../middlewares/validation.middleware";

import {
  adminSessionParamsSchema,
  sessionIdParamSchema,
  userIdParamSchema,
} from "./session.validator";

import {
  getMySessions,
  revokeMySession,
  revokeAllMySessions,
  getCustomerSessions,
  revokeCustomerSession,
  revokeAllCustomerSessions,
} from "./session.controller";

const router = Router();

router.get(
  "/admin/:userId",
  adminAuth,
  requirePermission("customers.read"),
  validate(userIdParamSchema, "params"),
  getCustomerSessions,
);

router.post(
  "/admin/:userId/revoke-all",
  adminAuth,
  requirePermission("customers.update"),
  validate(userIdParamSchema, "params"),
  revokeAllCustomerSessions,
);

router.delete(
  "/admin/:userId/:sessionId",
  adminAuth,
  requirePermission("customers.update"),
  validate(adminSessionParamsSchema, "params"),
  revokeCustomerSession,
);

/*
|--------------------------------------------------------------------------
| Get My Active Sessions
|--------------------------------------------------------------------------
|
| GET /sessions/me
|
*/

router.get("/me", userAuth, getMySessions);

/*
|--------------------------------------------------------------------------
| Revoke All My Sessions
|--------------------------------------------------------------------------
|
| POST /sessions/revoke-all
|
*/

router.post("/revoke-all", userAuth, revokeAllMySessions);

/*
|--------------------------------------------------------------------------
| Revoke One Session
|--------------------------------------------------------------------------
|
| DELETE /sessions/:sessionId
|
*/

router.delete(
  "/:sessionId",
  userAuth,
  validate(sessionIdParamSchema, "params"),
  revokeMySession,
);

export default router;
