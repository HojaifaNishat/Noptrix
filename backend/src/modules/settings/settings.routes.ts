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
    ownerSecretVerified,
} from "../../middlewares/ownerAuth.middleware";

import {
    adminSecretVerified,
} from "../../middlewares/adminAuth.middleware";

import {
    loadRolePermissions,
} from "../../middlewares/permission.middleware";

import {
    Admin,
} from "../admins/admin.model";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    uploadSingleImage,
} from "../../middlewares/upload.middleware";

import {
    updateSettingsSchema,
} from "./settings.validator";

import {
    getAllSettingsController,
    getSettingsByCategoryController,
    updateSettingsController,
    getPublicGeneralSettingsController,
    uploadSettingsLogoController,
} from "./settings.controller";

import {
    SETTINGS_CATEGORIES,
    type SettingsCategory,
} from "./settings.types";

const router = Router();

const isOwner = (
    req: Request,
): boolean => (
    Boolean(req.ownerAuth?.ownerId) &&
    req.ownerAuth?.role
        ?.trim()
        .toUpperCase() === "OWNER"
);

/*
|--------------------------------------------------------------------------
| Permission Guard
|--------------------------------------------------------------------------
|
| OWNER:
|   Uses the dedicated OWNER auth context.
|
| ADMIN:
|   Resolves active role permissions from the database.
|   Does not trust JWT permission claims as the sole
|   authorization source.
|
|--------------------------------------------------------------------------
*/

const requireSettingsPermission = (
    permission: string,
    requireSecret = false,
): RequestHandler => (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    void (async () => {
        if (isOwner(req)) {
            if (requireSecret) {
                ownerSecretVerified(
                    req,
                    res,
                    next,
                );
                return;
            }

            next();
            return;
        }

        const admin = req.adminAuth;

        if (!admin?.adminId) {
            res.status(401).json({
                success: false,
                message:
                    "Administrative authentication is required.",
            });
            return;
        }

        const adminRecord =
            await Admin.findById(admin.adminId)
                .select("roleId")
                .exec();

        if (!adminRecord) {
            res.status(403).json({
                success: false,
                message:
                    "The administrative account is not configured.",
                code:
                    "ADMIN_ACCOUNT_NOT_CONFIGURED",
            });
            return;
        }

        const permissions =
            await loadRolePermissions(
                adminRecord.roleId.toString(),
            );

        req.permissions =
            Object.freeze([
                ...permissions,
            ]);

        if (
            !permissions.includes(
                permission.trim().toLowerCase(),
            )
        ) {
            res.status(403).json({
                success: false,
                message:
                    "You do not have permission to perform this action.",
                code:
                    "INSUFFICIENT_SETTINGS_PERMISSION",
            });
            return;
        }

        if (requireSecret) {
            adminSecretVerified(
                req,
                res,
                next,
            );
            return;
        }

        next();
    })().catch(next);
};

/*
|--------------------------------------------------------------------------
| Category-specific Update Authorization
|--------------------------------------------------------------------------
*/

const requireUpdatePermission: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    const rawCategory =
        req.params.category;

    if (
        typeof rawCategory !== "string" ||
        !SETTINGS_CATEGORIES.includes(
            rawCategory as SettingsCategory,
        )
    ) {
        res.status(400).json({
            success: false,
            message:
                "Unsupported settings category.",
            code:
                "INVALID_SETTINGS_CATEGORY",
        });
        return;
    }

    const category =
        rawCategory as SettingsCategory;

    const permission =
        category === "security"
            ? "settings.manage"
            : "settings.update";

    const requiresSecret =
        category === "security";

    requireSettingsPermission(
        permission,
        requiresSecret,
    )(
        req,
        res,
        next,
    );
};

router.get(
    "/public/general",
    getPublicGeneralSettingsController,
);

/*
|--------------------------------------------------------------------------
| GET /api/settings
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    ownerOrAdminAuth,
    requireSettingsPermission(
        "settings.read",
    ),
    getAllSettingsController,
);

/*
|--------------------------------------------------------------------------
| GET /api/settings/:category
|--------------------------------------------------------------------------
*/

router.get(
    "/:category",
    ownerOrAdminAuth,
    requireSettingsPermission(
        "settings.read",
    ),
    getSettingsByCategoryController,
);

/*
|--------------------------------------------------------------------------
| PATCH /api/settings/:category
|--------------------------------------------------------------------------
*/

router.patch(
    "/:category",
    ownerOrAdminAuth,
    requireUpdatePermission,
    validate(
        updateSettingsSchema,
        "body",
    ),
    updateSettingsController,
);

router.post(
    "/general/logo",
    ownerOrAdminAuth,
    requireSettingsPermission("settings.update"),
    uploadSingleImage,
    uploadSettingsLogoController,
);

export default router;
