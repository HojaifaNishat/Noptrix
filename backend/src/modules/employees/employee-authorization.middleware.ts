import {
    RequestHandler,
} from "express";

import {
    Admin,
} from "../admins/admin.model";

import {
    loadRolePermissions,
} from "../../middlewares/permission.middleware";

import {
    getAuthenticatedAdminId,
    getAuthenticatedAdminRole,
} from "../../middlewares/adminAuth.middleware";

import {
    ApiError,
} from "../../utils/ApiError";

import {
    asyncHandler,
} from "../../utils/asyncHandler";

/*
|--------------------------------------------------------------------------
| Employee Permission Authorization
|--------------------------------------------------------------------------
|
| Authentication:
|     adminAuth
|
| Authorization:
|     Admin
|       ↓
|     Admin.roleId
|       ↓
|     Role
|       ↓
|     RolePermission
|       ↓
|     Permission
|
| IMPORTANT:
|     Employee records are NOT required for Admin authorization.
|
| OWNER:
|     Full employee management access.
|
|--------------------------------------------------------------------------
*/

export const requireEmployeePermission = (
    ...requiredPermissions: string[]
): RequestHandler =>
    asyncHandler(
        async (
            req,
            _res,
            next,
        ) => {
            /*
            |--------------------------------------------------------------------------
            | Get Authenticated Admin
            |--------------------------------------------------------------------------
            */

            const adminId =
                getAuthenticatedAdminId(
                    req,
                );

            /*
            |--------------------------------------------------------------------------
            | Get Admin Role
            |--------------------------------------------------------------------------
            */

            const adminRole =
                getAuthenticatedAdminRole(
                    req,
                );

            /*
            |--------------------------------------------------------------------------
            | OWNER Full Access
            |--------------------------------------------------------------------------
            */

            if (
                adminRole
                    ?.trim()
                    .toUpperCase() ===
                "OWNER"
            ) {
                next();

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | Find Admin
            |--------------------------------------------------------------------------
            |
            | adminId represents Admin._id.
            |
            | Admin.roleId directly references
            | the Role assigned to this Admin.
            |
            |--------------------------------------------------------------------------
            */

            const admin =
                await Admin.findById(
                    adminId,
                )
                    .select(
                        "roleId status",
                    )
                    .lean()
                    .exec();

            /*
            |--------------------------------------------------------------------------
            | Admin Required
            |--------------------------------------------------------------------------
            */

            if (!admin) {
                throw ApiError.forbidden(
                    "Admin access is required.",
                    {
                        code:
                            "ADMIN_ACCESS_REQUIRED",
                    },
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Admin Status
            |--------------------------------------------------------------------------
            */

            if (
                admin.status !==
                "ACTIVE"
            ) {
                throw ApiError.forbidden(
                    "Inactive admins cannot access employee management endpoints.",
                    {
                        code:
                            "ADMIN_INACTIVE",
                    },
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Load Role Permissions
            |--------------------------------------------------------------------------
            */

            const permissions =
                await loadRolePermissions(
                    admin.roleId.toString(),
                );

            /*
            |--------------------------------------------------------------------------
            | Normalize Required Permissions
            |--------------------------------------------------------------------------
            */

            const normalizedRequiredPermissions =
                requiredPermissions.map(
                    (
                        permission,
                    ) =>
                        permission
                            .trim()
                            .toLowerCase(),
                );

            /*
            |--------------------------------------------------------------------------
            | Normalize Assigned Permissions
            |--------------------------------------------------------------------------
            */

            const normalizedPermissions =
                permissions.map(
                    (
                        permission,
                    ) =>
                        permission
                            .trim()
                            .toLowerCase(),
                );

            /*
            |--------------------------------------------------------------------------
            | Employee Management Wildcard
            |--------------------------------------------------------------------------
            |
            | employees.manage grants access to
            | all Employee management operations.
            |
            |--------------------------------------------------------------------------
            */

            const hasManagePermission =
                normalizedPermissions.includes(
                    "employees.manage",
                );

            /*
            |--------------------------------------------------------------------------
            | Required Permissions
            |--------------------------------------------------------------------------
            */

            const hasRequiredPermission =
                normalizedRequiredPermissions.every(
                    (
                        requiredPermission,
                    ) =>
                        normalizedPermissions.includes(
                            requiredPermission,
                        ),
                );

            /*
            |--------------------------------------------------------------------------
            | Final Authorization Decision
            |--------------------------------------------------------------------------
            */

            if (
                !hasManagePermission &&
                !hasRequiredPermission
            ) {
                throw ApiError.forbidden(
                    "You do not have permission to manage employees.",
                    {
                        code:
                            "EMPLOYEE_PERMISSION_REQUIRED",
                    },
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Authorized
            |--------------------------------------------------------------------------
            */

            next();
        },
    );
