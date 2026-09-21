import {
    Request,
    Response,
    NextFunction,
    RequestHandler,
} from "express";

import {
    Role,
} from "../modules/roles/role.model";

import {
    RolePermission,
} from "../modules/role-permissions/role.permission.model";

import {
    Permission,
} from "../modules/permissions/permission.model";

import {
    ApiError,
} from "../utils/ApiError";

/*
|--------------------------------------------------------------------------
| Permission Value
|--------------------------------------------------------------------------
|
| A permission can be represented as:
|
| - One permission
| - Multiple permissions
|
| Example:
|
| "product.read"
| "product.create"
| "order.manage"
|
|--------------------------------------------------------------------------
*/

export type PermissionValue =
    | string
    | readonly string[];

/*
|--------------------------------------------------------------------------
| Express Request Permission Context
|--------------------------------------------------------------------------
|
| Permissions should normally be attached after authentication
| and role resolution.
|
|--------------------------------------------------------------------------
*/

declare global {
    namespace Express {
        interface Request {
            permissions?: readonly string[];
        }
    }
}

/*
|--------------------------------------------------------------------------
| Permission Normalizer
|--------------------------------------------------------------------------
*/

const normalizePermission = (
    permission: string
): string => {
    return permission
        .trim()
        .toLowerCase();
};

/*
|--------------------------------------------------------------------------
| Normalize Permissions
|--------------------------------------------------------------------------
*/

const normalizePermissions = (
    permissions: PermissionValue
): string[] => {
    const permissionList =
        Array.isArray(permissions)
            ? permissions
            : [permissions];

    return [
        ...new Set(
            permissionList
                .filter(
                    (
                        permission
                    ): permission is string =>
                        typeof permission ===
                        "string"
                )
                .map(
                    normalizePermission
                )
                .filter(Boolean)
        ),
    ];
};

/*
|--------------------------------------------------------------------------
| Load Permissions From Database
|--------------------------------------------------------------------------
|
| Role
|   ↓
| RolePermission
|   ↓
| Permission
|   ↓
| permission.key
|
|--------------------------------------------------------------------------
*/

export const loadRolePermissions =
    async (
        roleId: string
    ): Promise<string[]> => {
        const role =
            await Role.findById(
                roleId
            )
                .select(
                    "_id status"
                )
                .lean()
                .exec();

        if (!role) {
            throw ApiError.notFound(
                "Role not found.",
                {
                    code:
                        "ROLE_NOT_FOUND",
                }
            );
        }

        if (
            role.status !==
            "ACTIVE"
        ) {
            throw ApiError.forbidden(
                "Role is inactive.",
                {
                    code:
                        "ROLE_INACTIVE",
                }
            );
        }

        const assignments =
            await RolePermission.find({
                roleId: role._id,
            })
                .select(
                    "permissionId"
                )
                .lean()
                .exec();

        if (
            assignments.length === 0
        ) {
            return [];
        }

        const permissionIds =
            assignments.map(
                (
                    assignment
                ) =>
                    assignment.permissionId
            );

        const permissions =
            await Permission.find({
                _id: {
                    $in:
                        permissionIds,
                },
                status:
                    "ACTIVE",
            })
                .select(
                    "key"
                )
                .lean()
                .exec();

        return [
            ...new Set(
                permissions
                    .map(
                        (
                            permission
                        ) =>
                            permission.key
                    )
                    .filter(Boolean)
            ),
        ];
    };

/*
|--------------------------------------------------------------------------
| Get Request Permissions
|--------------------------------------------------------------------------
*/

const getRequestPermissions = (
    req: Request
): string[] => {
    return normalizePermissions(
        req.permissions ?? []
    );
};

/*
|--------------------------------------------------------------------------
| Attach Permissions
|--------------------------------------------------------------------------
|
| Used by authentication / authorization
| resolution layers.
|
|--------------------------------------------------------------------------
*/

export const attachPermissions = (
    permissions: PermissionValue
): RequestHandler => {
    return (
        req: Request,
        _res: Response,
        next: NextFunction
    ) => {
        const normalizedPermissions =
            normalizePermissions(
                permissions
            );

        req.permissions =
            Object.freeze([
                ...normalizedPermissions,
            ]);

        next();
    };
};

/*
|--------------------------------------------------------------------------
| Require Authentication
|--------------------------------------------------------------------------
*/

const ensureAuthenticated = (
    req: Request,
    res: Response
): boolean => {
    if (!req.auth) {
        res.status(401).json({
            success: false,
            message:
                "Authentication required.",
        });

        return false;
    }

    return true;
};

/*
|--------------------------------------------------------------------------
| Require Permission
|--------------------------------------------------------------------------
|
| ANY permission is enough.
|
| Example:
|
| requirePermission(
|     "product.read",
|     "product.manage"
| );
|
|--------------------------------------------------------------------------
*/

export const requirePermission = (
    ...requiredPermissions: string[]
): RequestHandler => {
    const normalizedRequiredPermissions =
        normalizePermissions(
            requiredPermissions
        );

    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        if (
            !ensureAuthenticated(
                req,
                res
            )
        ) {
            return;
        }

        if (
            normalizedRequiredPermissions.length ===
            0
        ) {
            res.status(403).json({
                success: false,
                message:
                    "No valid permission requirement was provided.",
            });

            return;
        }

        const userPermissions =
            getRequestPermissions(
                req
            );

        const hasPermission =
            normalizedRequiredPermissions.some(
                (permission) =>
                    userPermissions.includes(
                        permission
                    )
            );

        if (!hasPermission) {
            res.status(403).json({
                success: false,
                message:
                    "You do not have permission to perform this action.",
            });

            return;
        }

        next();
    };
};

/*
|--------------------------------------------------------------------------
| Require All Permissions
|--------------------------------------------------------------------------
|
| Every permission must exist.
|
|--------------------------------------------------------------------------
*/

export const requireAllPermissions = (
    ...requiredPermissions: string[]
): RequestHandler => {
    const normalizedRequiredPermissions =
        normalizePermissions(
            requiredPermissions
        );

    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        if (
            !ensureAuthenticated(
                req,
                res
            )
        ) {
            return;
        }

        if (
            normalizedRequiredPermissions.length ===
            0
        ) {
            res.status(403).json({
                success: false,
                message:
                    "No valid permission requirement was provided.",
            });

            return;
        }

        const userPermissions =
            getRequestPermissions(
                req
            );

        const hasAllPermissions =
            normalizedRequiredPermissions.every(
                (permission) =>
                    userPermissions.includes(
                        permission
                    )
            );

        if (!hasAllPermissions) {
            res.status(403).json({
                success: false,
                message:
                    "You do not have all the required permissions.",
            });

            return;
        }

        next();
    };
};

/*
|--------------------------------------------------------------------------
| Has Permission
|--------------------------------------------------------------------------
|
| Non-blocking permission check.
|
| Useful inside controllers/services.
|
|--------------------------------------------------------------------------
*/

export const hasPermission = (
    req: Request,
    permission: string
): boolean => {
    const normalizedPermission =
        normalizePermission(
            permission
        );

    if (!normalizedPermission) {
        return false;
    }

    const userPermissions =
        getRequestPermissions(
            req
        );

    return userPermissions.includes(
        normalizedPermission
    );
};

/*
|--------------------------------------------------------------------------
| Has Any Permission
|--------------------------------------------------------------------------
*/

export const hasAnyPermission = (
    req: Request,
    permissions: readonly string[]
): boolean => {
    const userPermissions =
        getRequestPermissions(
            req
        );

    const normalizedPermissions =
        normalizePermissions(
            permissions
        );

    if (
        normalizedPermissions.length ===
        0
    ) {
        return false;
    }

    return normalizedPermissions.some(
        (permission) =>
            userPermissions.includes(
                permission
            )
    );
};

/*
|--------------------------------------------------------------------------
| Has All Permissions
|--------------------------------------------------------------------------
*/

export const hasAllPermissions = (
    req: Request,
    permissions: readonly string[]
): boolean => {
    const userPermissions =
        getRequestPermissions(
            req
        );

    const normalizedPermissions =
        normalizePermissions(
            permissions
        );

    if (
        normalizedPermissions.length ===
        0
    ) {
        return false;
    }

    return normalizedPermissions.every(
        (permission) =>
            userPermissions.includes(
                permission
            )
    );
};

/*
|--------------------------------------------------------------------------
| Get Permissions
|--------------------------------------------------------------------------
*/

export const getPermissions = (
    req: Request
): readonly string[] => {
    return Object.freeze([
        ...getRequestPermissions(
            req
        ),
    ]);
};

/*
|--------------------------------------------------------------------------
| Permission Wildcards
|--------------------------------------------------------------------------
|
| Supports future permission patterns such as:
|
| product.*
| order.*
| *
|
| This does NOT automatically grant wildcard
| permissions unless explicitly present.
|
|--------------------------------------------------------------------------
*/

const matchesPermission = (
    grantedPermission: string,
    requiredPermission: string
): boolean => {
    const granted =
        normalizePermission(
            grantedPermission
        );

    const required =
        normalizePermission(
            requiredPermission
        );

    if (
        !granted ||
        !required
    ) {
        return false;
    }

    /*
     * Full wildcard.
     */
    if (granted === "*") {
        return true;
    }

    /*
     * Exact permission.
     */
    if (granted === required) {
        return true;
    }

    /*
     * Resource wildcard.
     *
     * product.*
     * matches:
     * product.read
     * product.create
     * product.update
     */
    if (
        granted.endsWith(".*")
    ) {
        const resource =
            granted.slice(
                0,
                -2
            );

        return (
            required === resource ||
            required.startsWith(
                `${resource}.`
            )
        );
    }

    return false;
};

/*
|--------------------------------------------------------------------------
| Has Permission With Wildcard Support
|--------------------------------------------------------------------------
*/

export const hasPermissionMatch = (
    req: Request,
    permission: string
): boolean => {
    const required =
        normalizePermission(
            permission
        );

    if (!required) {
        return false;
    }

    const userPermissions =
        getRequestPermissions(
            req
        );

    return userPermissions.some(
        (grantedPermission) =>
            matchesPermission(
                grantedPermission,
                required
            )
    );
};

/*
|--------------------------------------------------------------------------
| Require Permission Match
|--------------------------------------------------------------------------
|
| Same as requirePermission,
| but supports wildcard permissions.
|
|--------------------------------------------------------------------------
*/

export const requirePermissionMatch = (
    ...requiredPermissions: string[]
): RequestHandler => {
    const normalizedRequiredPermissions =
        normalizePermissions(
            requiredPermissions
        );

    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        if (
            !ensureAuthenticated(
                req,
                res
            )
        ) {
            return;
        }

        if (
            normalizedRequiredPermissions.length ===
            0
        ) {
            res.status(403).json({
                success: false,
                message:
                    "No valid permission requirement was provided.",
            });

            return;
        }

        const hasPermission =
            normalizedRequiredPermissions.some(
                (requiredPermission) =>
                    hasPermissionMatch(
                        req,
                        requiredPermission
                    )
            );

        if (!hasPermission) {
            res.status(403).json({
                success: false,
                message:
                    "You do not have permission to perform this action.",
            });

            return;
        }

        next();
    };
};

/*
|--------------------------------------------------------------------------
| Require All Permission Matches
|--------------------------------------------------------------------------
*/

export const requireAllPermissionMatches = (
    ...requiredPermissions: string[]
): RequestHandler => {
    const normalizedRequiredPermissions =
        normalizePermissions(
            requiredPermissions
        );

    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        if (
            !ensureAuthenticated(
                req,
                res
            )
        ) {
            return;
        }

        if (
            normalizedRequiredPermissions.length ===
            0
        ) {
            res.status(403).json({
                success: false,
                message:
                    "No valid permission requirement was provided.",
            });

            return;
        }

        const hasAllPermissions =
            normalizedRequiredPermissions.every(
                (requiredPermission) =>
                    hasPermissionMatch(
                        req,
                        requiredPermission
                    )
            );

        if (!hasAllPermissions) {
            res.status(403).json({
                success: false,
                message:
                    "You do not have all the required permissions.",
            });

            return;
        }

        next();
    };
};