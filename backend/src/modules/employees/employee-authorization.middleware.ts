import {
    RequestHandler,
} from "express";

import {
    Employee,
} from "./employee.model";

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
|     Admin.userId
|       ↓
|     Employee
|       ↓
|     Employee.roleId
|       ↓
|     Role Permissions
|
| OWNER:
|     Full employee access
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
            next
        ) => {
            /*
            |--------------------------------------------------------------------------
            | Get Authenticated Admin
            |--------------------------------------------------------------------------
            */

            const adminId =
                getAuthenticatedAdminId(
                    req
                );

            /*
            |--------------------------------------------------------------------------
            | Get Admin Role
            |--------------------------------------------------------------------------
            */

            const adminRole =
                getAuthenticatedAdminRole(
                    req
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
            | Employee.userId references User._id.
            |
            | Therefore:
            |
            |     Admin._id
            |          ↓
            |     Admin.userId
            |          ↓
            |     Employee.userId
            |
            |--------------------------------------------------------------------------
            */

            const admin =
                await Admin.findById(
                    adminId
                )
                    .select(
                        "userId roleId status"
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
                    }
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
                    }
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Find Employee
            |--------------------------------------------------------------------------
            */

            const employee =
                await Employee.findOne({
                    userId: admin.userId,
                })
                    .select(
                        "roleId status"
                    )
                    .lean()
                    .exec();

            /*
            |--------------------------------------------------------------------------
            | Employee Required
            |--------------------------------------------------------------------------
            */

            if (!employee) {
                throw ApiError.forbidden(
                    "Employee access is required.",
                    {
                        code:
                            "EMPLOYEE_ACCESS_REQUIRED",
                    }
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Employee Status
            |--------------------------------------------------------------------------
            */

            if (
                employee.status !==
                "ACTIVE"
            ) {
                throw ApiError.forbidden(
                    "Inactive employees cannot access employee management endpoints.",
                    {
                        code:
                            "EMPLOYEE_INACTIVE",
                    }
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Load Role Permissions
            |--------------------------------------------------------------------------
            */

            const permissions =
                await loadRolePermissions(
                    employee.roleId.toString()
                );

            /*
            |--------------------------------------------------------------------------
            | Normalize Required Permissions
            |--------------------------------------------------------------------------
            */

            const normalizedRequiredPermissions =
                requiredPermissions.map(
                    (
                        permission
                    ) =>
                        permission
                            .trim()
                            .toLowerCase()
                );

            /*
            |--------------------------------------------------------------------------
            | Normalize Assigned Permissions
            |--------------------------------------------------------------------------
            */

            const normalizedPermissions =
                permissions.map(
                    (
                        permission
                    ) =>
                        permission
                            .trim()
                            .toLowerCase()
                );

            /*
            |--------------------------------------------------------------------------
            | Employee Management Wildcard
            |--------------------------------------------------------------------------
            */

            const hasManagePermission =
                normalizedPermissions.includes(
                    "employees.manage"
                );

            const hasRequiredPermission =
                normalizedRequiredPermissions.every(
                    (
                        requiredPermission
                    ) =>
                        normalizedPermissions.includes(
                            requiredPermission
                        )
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
                    }
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Authorized
            |--------------------------------------------------------------------------
            */

            next();
        }
    );