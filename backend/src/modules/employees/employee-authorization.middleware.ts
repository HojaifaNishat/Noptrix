import {
    RequestHandler,
} from "express";

import {
    requirePermissionMatch,
} from "../../middlewares/permission.middleware";

/*
|--------------------------------------------------------------------------
| Employee Permission Authorization
|--------------------------------------------------------------------------
|
| Employee records are NOT required for Admin authorization.
|
| Authorization chain:
|
| ADMIN
|   ↓
| ADMIN.roleId
|   ↓
| ROLE
|   ↓
| ROLE PERMISSIONS
|   ↓
| PERMISSION
|
| OWNER:
|   Automatically receives full access through the central
|   permission middleware.
|
| ADMIN / STAFF:
|   Only explicitly granted permissions are accepted.
|
|--------------------------------------------------------------------------
*/

export const requireEmployeePermission = (
    ...requiredPermissions: string[]
): RequestHandler =>
    requirePermissionMatch(
        ...requiredPermissions,
    );
