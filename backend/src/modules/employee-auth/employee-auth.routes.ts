import { Router } from "express";
import { adminAuth } from "../../middlewares/adminAuth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import {
  loginEmployeeController,
  logoutEmployeeController,
  refreshEmployeeTokenController,
} from "./employee-auth.controller";
import { employeeLoginSchema } from "./employee-auth.validator";

const router = Router();

router.post(
  "/login",
  validate(employeeLoginSchema, "body"),
  loginEmployeeController,
);

router.post("/refresh", refreshEmployeeTokenController);

router.post("/logout", adminAuth, logoutEmployeeController);

export default router;
