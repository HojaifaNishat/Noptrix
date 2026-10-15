import {
    Router,
    type Request,
    type Response,
    type RequestHandler,
    type NextFunction,
} from "express";

import {
    ownerOrAdminAuth,
} from "../../middlewares/ownerOrAdminAuth.middleware";

import {
    loadRolePermissions,
} from "../../middlewares/permission.middleware";

import {
    Admin,
} from "../admins/admin.model";

import {
    getMaintenanceController,
    updateMaintenanceController,
} from "./maintenance.controller";

const router = Router();

const isOwner = (req: Request): boolean =>
    Boolean(req.ownerAuth?.ownerId) &&
    req.ownerAuth?.role?.trim().toUpperCase() === "OWNER";

const requireMaintenancePermission: RequestHandler = (
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

        const record = await Admin.findById(admin.adminId)
            .select("roleId status")
            .exec();

        if (!record || String(record.get("status")).toUpperCase() !== "ACTIVE") {
            res.status(403).json({
                success: false,
                message: "Active administrative account required.",
            });
            return;
        }

        if (!record.roleId) {
            res.status(403).json({
                success: false,
                message: "Administrative role is not configured.",
            });
            return;
        }

        const permissions = await loadRolePermissions(
            record.roleId.toString(),
        );

        req.permissions = Object.freeze([...permissions]);

        const permission = req.method === "GET"
            ? "maintenance.read"
            : "maintenance.manage";

        if (!permissions.includes(permission)) {
            res.status(403).json({
                success: false,
                message: `Missing permission: ${permission}.`,
                code: "INSUFFICIENT_MAINTENANCE_PERMISSION",
            });
            return;
        }

        next();
    })().catch(next);
};

router.use(ownerOrAdminAuth);
router.use(requireMaintenancePermission);

router.get("/", getMaintenanceController);
router.patch("/", updateMaintenanceController);

export const maintenanceRoutes = router;
export default router;
