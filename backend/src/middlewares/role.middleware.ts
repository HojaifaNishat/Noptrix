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
|
| A request may contain:
|
| - One role
| - Multiple roles
|
| readonly is intentional.
| Middleware should not mutate the role collection.
|
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
    const roleList = Array.isArray(roles)
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
| Get Request Roles
|--------------------------------------------------------------------------
*/

const getRequestRoles = (
    req: Request
): string[] => {
    return normalizeRoles(
        req.roles ??
            req.role ??
            []
    );
};

/*
|--------------------------------------------------------------------------
| Attach Roles
|--------------------------------------------------------------------------
|
| This helper can be used by authentication or
| role-resolution middleware after roles are loaded.
|
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

        /*
         * Freeze the array so downstream middleware
         * cannot accidentally mutate authentication state.
         */
        req.roles = Object.freeze([
            ...normalizedRoles,
        ]);

        /*
         * Keep the first role as the primary role.
         *
         * This is mainly a compatibility convenience.
         * Permission checks should use req.roles.
         */
        req.role =
            normalizedRoles[0];

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
| Require At Least One Role
|--------------------------------------------------------------------------
|
| ANY matching role is sufficient.
|
| Example:
|
| requireRole(
|     "ADMIN",
|     "MANAGER"
| );
|
| ADMIN  -> allowed
| MANAGER -> allowed
| USER -> denied
|
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
        /*
         * Authentication must happen before
         * authorization.
         */
        if (
            !ensureAuthenticated(
                req,
                res
            )
        ) {
            return;
        }

        /*
         * Invalid middleware configuration.
         */
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
|
| Every requested role must be present.
|
| Example:
|
| requireAllRoles(
|     "ADMIN",
|     "MANAGER"
| );
|
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
|
| Non-blocking role check.
|
| Useful inside controllers/services.
|
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
            userRoles.includes(role)
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
            userRoles.includes(role)
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
    return Object.freeze([
        ...getRequestRoles(req),
    ]);
};

/*
|--------------------------------------------------------------------------
| Role Guard Factory
|--------------------------------------------------------------------------
|
| Generic guard for future role-based modules.
|
| This keeps controller code clean.
|
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

        const userRoles =
            getRequestRoles(req);

        /*
         * ANY rule
         */
        if (
            anyOf.length > 0 &&
            !anyOf.some((role) =>
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
         * ALL rule
         */
        if (
            allOf.length > 0 &&
            !allOf.every((role) =>
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

        /*
         * Prevent a completely empty guard
         * from accidentally allowing access.
         */
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

        next();
    };
};