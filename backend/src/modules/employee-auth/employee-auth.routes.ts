import { Router } from "express";
import { adminAuth } from "../../middlewares/adminAuth.middleware";
import {
  authRateLimiter,
  otpRateLimiter,
} from "../../middlewares/rateLimit.middleware";
import { validate } from "../../middlewares/validation.middleware";
import {
  loginEmployeeController,
  logoutEmployeeController,
  resendEmployeeLoginCodeController,
  refreshEmployeeTokenController,
  verifyEmployeeLoginController,
} from "./employee-auth.controller";
import {
  employeeLoginSchema,
  employeeLoginVerificationSchema,
  resendEmployeeLoginVerificationSchema,
} from "./employee-auth.validator";
import { createPasswordRecoveryHandlers } from "../password-recovery/password-recovery.controller";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../password-recovery/password-recovery.validator";

const router = Router();
const { forgotPasswordController, resetPasswordController } =
  createPasswordRecoveryHandlers("EMPLOYEE");

router.post(
  "/login",
  authRateLimiter,
  validate(employeeLoginSchema, "body"),
  loginEmployeeController,
);

router.post(
  "/forgot-password",
  otpRateLimiter,
  validate(forgotPasswordSchema, "body"),
  forgotPasswordController,
);

router.post(
  "/reset-password",
  authRateLimiter,
  validate(resetPasswordSchema, "body"),
  resetPasswordController,
);

router.post(
  "/verify-login",
  authRateLimiter,
  validate(employeeLoginVerificationSchema, "body"),
  verifyEmployeeLoginController,
);

router.post(
  "/resend-login-code",
  authRateLimiter,
  validate(resendEmployeeLoginVerificationSchema, "body"),
  resendEmployeeLoginCodeController,
);

router.post("/refresh", refreshEmployeeTokenController);

router.post("/logout", adminAuth, logoutEmployeeController);

export default router;
