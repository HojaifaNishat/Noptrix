import {
    RequestHandler,
} from "express";

import {
    Employee,
} from "./employee.model";

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
|     Employee Role
|         ↓
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
            |
            | OWNER does not need individual permission
            | assignments.
            |
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
            | Find Employee
            |--------------------------------------------------------------------------
            |
            | adminId represents the authenticated
            | admin/staff user's User ID.
            |
            | Employee stores that relationship
            | through userId.
            |
            */

            const employee =
                await Employee.findOne({
                    userId: adminId,
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
            | Permission Check
            |--------------------------------------------------------------------------
            |
            | employees.manage acts as a wildcard
            | for Employee management.
            |
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