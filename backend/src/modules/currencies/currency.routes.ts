import {
    Router,
    type Request,
    type RequestHandler,
    type Response,
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
    createCurrencyController,
    getCurrencyController,
    getDefaultCurrencyController,
    listCurrenciesController,
    setDefaultCurrencyController,
    updateCurrencyController,
} from "./currency.controller";

const router = Router();

const isOwner = (req: Request): boolean => (
    Boolean(req.ownerAuth?.ownerId) &&
    req.ownerAuth?.role?.trim().toUpperCase() === "OWNER"
);

const requireCurrencyPermission = (
    permission: string,
): RequestHandler => (
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
            .select("roleId")
            .exec();

        if (!adminRecord) {
            res.status(403).json({
                success: false,
                message: "The administrative account is not configured.",
                code: "ADMIN_ACCOUNT_NOT_CONFIGURED",
            });
            return;
        }

        const permissions = await loadRolePermissions(
            adminRecord.roleId.toString(),
        );

        req.permissions = Object.freeze([...permissions]);

        if (!permissions.includes(permission)) {
            res.status(403).json({
                success: false,
                message: "You do not have permission to perform this action.",
                code: "INSUFFICIENT_CURRENCY_PERMISSION",
            });
            return;
        }

        next();
    })().catch(next);
};

/*
 * Public storefront endpoints. These expose ACTIVE currencies only.
 */
router.get("/", listCurrenciesController);
router.get("/default", getDefaultCurrencyController);

/*
 * Management endpoints require OWNER/ADMIN authentication and
 * a separate database-backed permission check for ADMIN accounts.
 */
router.use("/manage", ownerOrAdminAuth);

router.get(
    "/manage",
    requireCurrencyPermission("currencies.read"),
    (req: Request, res: Response, next: NextFunction) => {
        req.query.includeInactive = "true";
        return listCurrenciesController(req, res, next);
    },
);

router.post(
    "/manage",
    requireCurrencyPermission("currencies.create"),
    createCurrencyController,
);

router.get(
    "/manage/:currencyId",
    requireCurrencyPermission("currencies.read"),
    getCurrencyController,
);

router.patch(
    "/manage/:currencyId",
    requireCurrencyPermission("currencies.update"),
    updateCurrencyController,
);

router.patch(
    "/manage/:currencyId/default",
    requireCurrencyPermission("currencies.manage"),
    setDefaultCurrencyController,
);

export default router;
