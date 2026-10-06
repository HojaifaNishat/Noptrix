import {
    Request,
    Response,
    NextFunction,
    RequestHandler,
} from "express";

/*
|--------------------------------------------------------------------------
| Role Value
|--------------------------------------------------------------------------
*/

export type RoleValue =
    | string
    | readonly string[];

/*
|--------------------------------------------------------------------------
| Express Request Role Context
|--------------------------------------------------------------------------
*/

declare global {
    namespace Express {
        interface Request {
            role?: string;
            roles?: readonly string[];
        }
    }
}

/*
|--------------------------------------------------------------------------
| Normalize Role
|--------------------------------------------------------------------------
*/

const normalizeRole = (
    role: string
): string => {
    return role
        .trim()
        .toUpperCase();
};

/*
|--------------------------------------------------------------------------
| Normalize Roles
|--------------------------------------------------------------------------
*/

const normalizeRoles = (
    roles: RoleValue
): string[] => {
    const roleList =
        Array.isArray(roles)
            ? roles
            : [roles];

    return [
        ...new Set(
            roleList
                .filter(
                    (
                        role
                    ): role is string =>
                        typeof role ===
                        "string"
                )
                .map(normalizeRole)
                .filter(Boolean)
        ),
    ];
};

/*
|--------------------------------------------------------------------------
| Check OWNER
|--------------------------------------------------------------------------
|
| Only an authenticated administrative OWNER receives
| the root-level role bypass.
|
| Normal USER auth context can never activate this.
|
|--------------------------------------------------------------------------
*/

const isOwnerRequest = (
    req: Request
): boolean => {
    const role =
        req.adminAuth?.role;

    return (
        typeof role === "string" &&
        role.trim().toUpperCase() ===
            "OWNER"
    );
};

/*
|--------------------------------------------------------------------------
| Get Request Roles
|--------------------------------------------------------------------------
|
| Priority:
|
| 1. Explicit req.roles
| 2. Explicit req.role
| 3. Administrative role from req.adminAuth
|
|--------------------------------------------------------------------------
*/

const getRequestRoles = (
    req: Request
): string[] => {
    if (
        Array.isArray(req.roles) &&
        req.roles.length > 0
    ) {
        return normalizeRoles(
            req.roles
        );
    }

    if (
        typeof req.role ===
        "string" &&
        req.role.trim()
    ) {
        return normalizeRoles(
            req.role
        );
    }

    if (
        typeof req.adminAuth?.role ===
        "string"
    ) {
        return normalizeRoles(
            req.adminAuth.role
        );
    }

    return [];
};

/*
|--------------------------------------------------------------------------
| Attach Roles
|--------------------------------------------------------------------------
*/

export const attachRoles = (
    roles: RoleValue
): RequestHandler => {
    return (
        req: Request,
        _res: Response,
        next: NextFunction
    ) => {
        const normalizedRoles =
            normalizeRoles(roles);

        req.roles =
            Object.freeze([
                ...normalizedRoles,
            ]);

        req.role =
            normalizedRoles[0];

        next();
    };
};

/*
|--------------------------------------------------------------------------
| Require Authentication
|--------------------------------------------------------------------------
|
| Supports both:
|
| req.adminAuth
| req.auth
|
|--------------------------------------------------------------------------
*/

const ensureAuthenticated = (
    req: Request,
    res: Response
): boolean => {
    if (
        !req.adminAuth &&
        !req.auth
    ) {
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
| Require At Least One Role
|--------------------------------------------------------------------------
*/

export const requireRole = (
    ...requiredRoles: string[]
): RequestHandler => {
    const normalizedRequiredRoles =
        normalizeRoles(
            requiredRoles
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
            normalizedRequiredRoles.length ===
            0
        ) {
            res.status(403).json({
                success: false,
                message:
                    "No valid role requirement was provided.",
            });

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | OWNER Full Role Access
        |--------------------------------------------------------------------------
        */

        if (isOwnerRequest(req)) {
            next();
            return;
        }

        const userRoles =
            getRequestRoles(req);

        const hasRequiredRole =
            normalizedRequiredRoles.some(
                (requiredRole) =>
                    userRoles.includes(
                        requiredRole
                    )
            );

        if (!hasRequiredRole) {
            res.status(403).json({
                success: false,
                message:
                    "You do not have permission to access this resource.",
            });

            return;
        }

        next();
    };
};

/*
|--------------------------------------------------------------------------
| Require All Roles
|--------------------------------------------------------------------------
*/

export const requireAllRoles = (
    ...requiredRoles: string[]
): RequestHandler => {
    const normalizedRequiredRoles =
        normalizeRoles(
            requiredRoles
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
            normalizedRequiredRoles.length ===
            0
        ) {
            res.status(403).json({
                success: false,
                message:
                    "No valid role requirement was provided.",
            });

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | OWNER Full Role Access
        |--------------------------------------------------------------------------
        */

        if (isOwnerRequest(req)) {
            next();
            return;
        }

        const userRoles =
            getRequestRoles(req);

        const hasAllRequiredRoles =
            normalizedRequiredRoles.every(
                (requiredRole) =>
                    userRoles.includes(
                        requiredRole
                    )
            );

        if (!hasAllRequiredRoles) {
            res.status(403).json({
                success: false,
                message:
                    "You do not have all the required roles.",
            });

            return;
        }

        next();
    };
};

/*
|--------------------------------------------------------------------------
| Has Role
|--------------------------------------------------------------------------
*/

export const hasRole = (
    req: Request,
    role: string
): boolean => {
    const normalizedRole =
        normalizeRole(role);

    if (!normalizedRole) {
        return false;
    }

    /*
    |--------------------------------------------------------------------------
    | OWNER Full Role Authority
    |--------------------------------------------------------------------------
    */

    if (isOwnerRequest(req)) {
        return true;
    }

    const userRoles =
        getRequestRoles(req);

    return userRoles.includes(
        normalizedRole
    );
};

/*
|--------------------------------------------------------------------------
| Has Any Role
|--------------------------------------------------------------------------
*/

export const hasAnyRole = (
    req: Request,
    roles: readonly string[]
): boolean => {
    /*
    |--------------------------------------------------------------------------
    | OWNER Full Role Authority
    |--------------------------------------------------------------------------
    */

    if (isOwnerRequest(req)) {
        return true;
    }

    const userRoles =
        getRequestRoles(req);

    const normalizedRoles =
        normalizeRoles(roles);

    if (
        normalizedRoles.length ===
        0
    ) {
        return false;
    }

    return normalizedRoles.some(
        (role) =>
            userRoles.includes(
                role
            )
    );
};

/*
|--------------------------------------------------------------------------
| Has All Roles
|--------------------------------------------------------------------------
*/

export const hasAllRoles = (
    req: Request,
    roles: readonly string[]
): boolean => {
    /*
    |--------------------------------------------------------------------------
    | OWNER Full Role Authority
    |--------------------------------------------------------------------------
    */

    if (isOwnerRequest(req)) {
        return true;
    }

    const userRoles =
        getRequestRoles(req);

    const normalizedRoles =
        normalizeRoles(roles);

    if (
        normalizedRoles.length ===
        0
    ) {
        return false;
    }

    return normalizedRoles.every(
        (role) =>
            userRoles.includes(
                role
            )
    );
};

/*
|--------------------------------------------------------------------------
| Get Primary Role
|--------------------------------------------------------------------------
*/

export const getPrimaryRole = (
    req: Request
): string | null => {
    const roles =
        getRequestRoles(req);

    return roles[0] ?? null;
};

/*
|--------------------------------------------------------------------------
| Get All Roles
|--------------------------------------------------------------------------
*/

export const getRoles = (
    req: Request
): readonly string[] => {
    /*
    |--------------------------------------------------------------------------
    | OWNER
    |--------------------------------------------------------------------------
    |
    | OWNER is not represented as every possible role.
    | The immutable OWNER identity remains the primary role.
    |
    |--------------------------------------------------------------------------
    */

    return Object.freeze([
        ...getRequestRoles(req),
    ]);
};

/*
|--------------------------------------------------------------------------
| Role Guard Factory
|--------------------------------------------------------------------------
*/

export const createRoleGuard = (
    options: {
        anyOf?: readonly string[];
        allOf?: readonly string[];
    }
): RequestHandler => {
    const anyOf =
        options.anyOf
            ? normalizeRoles(
                  options.anyOf
              )
            : [];

    const allOf =
        options.allOf
            ? normalizeRoles(
                  options.allOf
              )
            : [];

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
            anyOf.length === 0 &&
            allOf.length === 0
        ) {
            res.status(403).json({
                success: false,
                message:
                    "No valid role requirement was provided.",
            });

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | OWNER Full Role Authority
        |--------------------------------------------------------------------------
        */

        if (isOwnerRequest(req)) {
            next();
            return;
        }

        const userRoles =
            getRequestRoles(req);

        /*
        |--------------------------------------------------------------------------
        | ANY Rule
        |--------------------------------------------------------------------------
        */

        if (
            anyOf.length > 0 &&
            !anyOf.some(
                (role) =>
                    userRoles.includes(
                        role
                    )
            )
        ) {
            res.status(403).json({
                success: false,
                message:
                    "Required role was not found.",
            });

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | ALL Rule
        |--------------------------------------------------------------------------
        */

        if (
            allOf.length > 0 &&
            !allOf.every(
                (role) =>
                    userRoles.includes(
                        role
                    )
            )
        ) {
            res.status(403).json({
                success: false,
                message:
                    "Required roles were not found.",
            });

            return;
        }

        next();
    };
};
