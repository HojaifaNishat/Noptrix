import {
  Router,
  type Request,
  type Response,
  type RequestHandler,
  type NextFunction,
} from "express";

import { ownerOrAdminAuth } from "../../middlewares/ownerOrAdminAuth.middleware";

import { loadRolePermissions } from "../../middlewares/permission.middleware";

import { Admin } from "../admins/admin.model";

import { listSystemLogsController } from "./system-log.controller";

const router = Router();

const isOwner = (req: Request): boolean =>
  Boolean(req.ownerAuth?.ownerId) &&
  req.ownerAuth?.role?.trim().toUpperCase() === "OWNER";

const requireSystemLogReadPermission: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  void (async () => {
    if (isOwner(req)) {
      next();
      return;
    }

    const admin = req.adminAuth;

    if (!admin?.adminId) {
      res.status(401).json({
        success: false,
        message: "Administrative authentication is required.",
      });
      return;
    }

    const adminRecord = await Admin.findById(admin.adminId)
      .select("roleId status")
      .exec();

    if (!adminRecord) {
      res.status(403).json({
        success: false,
        message: "Administrative account not found.",
      });
      return;
    }

    if (String(adminRecord.get("status")).toUpperCase() !== "ACTIVE") {
      res.status(403).json({
        success: false,
        message: "Administrative account is not active.",
      });
      return;
    }

    if (!adminRecord.roleId) {
      res.status(403).json({
        success: false,
        message: "Administrative role is not configured.",
      });
      return;
    }

    const permissions = await loadRolePermissions(
      adminRecord.roleId.toString(),
    );

    req.permissions = Object.freeze([...permissions]);

    if (!permissions.includes("system-logs.read")) {
      res.status(403).json({
        success: false,
        message: "Missing permission: system-logs.read.",
        code: "INSUFFICIENT_SYSTEM_LOG_PERMISSION",
      });
      return;
    }

    next();
  })().catch(next);
};

router.use(ownerOrAdminAuth);
router.use(requireSystemLogReadPermission);

router.get("/", listSystemLogsController);

export const systemLogsRoutes = router;
export default router;
