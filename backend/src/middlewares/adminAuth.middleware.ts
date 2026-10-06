import {
    Request,
    Response,
    NextFunction,
    RequestHandler,
} from "express";

import {
    verifyAccessToken,
    type AccessTokenPayload,
} from "../utils/token";

/*
|--------------------------------------------------------------------------
| Admin Auth Context
|--------------------------------------------------------------------------
|
| Administrative authentication context.
|
| OWNER is intentionally supported here.
|
| Authorization hierarchy:
|
| OWNER
|   → Full A-Z system authority
|
| ADMIN / STAFF
|   → Role + explicitly assigned permissions
|
|--------------------------------------------------------------------------
*/

export interface AdminAuthContext {
    readonly adminId: string;

    readonly role?: string;

    readonly permissions: readonly string[];

    readonly secretVerified: boolean;

    readonly tokenIssuedAt?: number;

    readonly tokenExpiresAt?: number;

    readonly claims: Readonly<
        Record<string, unknown>
    >;
}

/*
|--------------------------------------------------------------------------
| Express Request Extension
|--------------------------------------------------------------------------
*/

declare global {
    namespace Express {
        interface Request {
            adminAuth?: AdminAuthContext;
        }
    }
}

/*
|--------------------------------------------------------------------------
| Extract Bearer Token
|--------------------------------------------------------------------------
*/

const extractBearerToken = (
    authorizationHeader?: string
): string | null => {
    if (
        typeof authorizationHeader !==
        "string"
    ) {
        return null;
    }

    const normalized =
        authorizationHeader.trim();

    if (!normalized) {
        return null;
    }

    const parts =
        normalized.split(/\s+/);

    if (
        parts.length !== 2 ||
        parts[0]?.toLowerCase() !==
            "bearer"
    ) {
        return null;
    }

    const token =
        parts[1]?.trim();

    if (!token) {
        return null;
    }

    return token;
};

/*
|--------------------------------------------------------------------------
| Normalize Administrative Role
|--------------------------------------------------------------------------
*/

const normalizeAdminRole = (
    role: unknown
): string | undefined => {
    if (
        typeof role !== "string"
    ) {
        return undefined;
    }

    const normalized =
        role.trim().toUpperCase();

    return normalized || undefined;
};

/*
|--------------------------------------------------------------------------
| Normalize Permissions
|--------------------------------------------------------------------------
*/

const normalizeAdminPermissions = (
    permissions: unknown
): string[] => {
    if (!Array.isArray(permissions)) {
        return [];
    }

    return [
        ...new Set(
            permissions
                .filter(
                    (
                        permission
                    ): permission is string =>
                        typeof permission ===
                        "string"
                )
                .map((permission) =>
                    permission
                        .trim()
                        .toLowerCase()
                )
                .filter(Boolean)
        ),
    ];
};

/*
|--------------------------------------------------------------------------
| Build Admin Auth Context
|--------------------------------------------------------------------------
*/

export const buildAdminAuthContext = (
    payload: AccessTokenPayload
): AdminAuthContext => {
    const {
        sub,
        tokenType: _tokenType,
        iat,
        exp,
        ...additionalClaims
    } = payload;

    const claims =
        additionalClaims as Record<
            string,
            unknown
        >;

    const role =
        normalizeAdminRole(
            claims.role
        );

    const permissions =
        normalizeAdminPermissions(
            claims.permissions
        );

    const secretVerified =
        claims.secretVerified === true;

    return Object.freeze({
        adminId: sub,

        ...(role
            ? {
                  role,
              }
            : {}),

        permissions:
            Object.freeze([
                ...permissions,
            ]),

        secretVerified,

        ...(typeof iat === "number"
            ? {
                  tokenIssuedAt: iat,
              }
            : {}),

        ...(typeof exp === "number"
            ? {
                  tokenExpiresAt: exp,
              }
            : {}),

        claims:
            Object.freeze({
                ...claims,
            }),
    });
};

/*
|--------------------------------------------------------------------------
| Admin Authentication
|--------------------------------------------------------------------------
|
| Valid administrative access tokens are accepted here.
|
| OWNER is NOT rejected.
|
| OWNER must be allowed through the same authenticated
| administrative pipeline because OWNER is the highest
| administrative authority in NOPTRIX.
|
| Permission middleware will recognize OWNER and provide
| automatic full access.
|
|--------------------------------------------------------------------------
*/

export const adminAuth: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const token =
        extractBearerToken(
            req.headers.authorization
        );

    if (!token) {
        res.status(401).json({
            success: false,
            message:
                "Admin authentication required.",
        });

        return;
    }

    try {
        const payload =
            verifyAccessToken(token);

        /*
        |--------------------------------------------------------------------------
        | Access Token Validation
        |--------------------------------------------------------------------------
        */

        if (
            payload.tokenType !==
            "access"
        ) {
            res.status(401).json({
                success: false,
                message:
                    "Invalid admin authentication token.",
            });

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Administrative Role Validation
        |--------------------------------------------------------------------------
        |
        | Normal customer/user tokens should not contain
        | an administrative role.
        |
        */

        const role =
            normalizeAdminRole(
                payload.role
            );

        if (!role) {
            res.status(403).json({
                success: false,
                message:
                    "Administrative role is required.",
            });

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Build Administrative Context
        |--------------------------------------------------------------------------
        */

        req.adminAuth =
            buildAdminAuthContext(
                payload
            );

        next();
    } catch {
        res.status(401).json({
            success: false,
            message:
                "Invalid or expired admin authentication token.",
        });

        return;
    }
};

/*
|--------------------------------------------------------------------------
| Require Admin
|--------------------------------------------------------------------------
*/

export const requireAdmin: RequestHandler = (
    req,
    res,
    next
) => {
    if (!req.adminAuth?.adminId) {
        res.status(401).json({
            success: false,
            message:
                "Admin authentication required.",
        });

        return;
    }

    next();
};

/*
|--------------------------------------------------------------------------
| Require Verified Admin
|--------------------------------------------------------------------------
*/

export const adminSecretVerified: RequestHandler = (
    req,
    res,
    next
) => {
    if (!req.adminAuth?.adminId) {
        res.status(401).json({
            success: false,
            message:
                "Admin authentication required.",
        });

        return;
    }

    if (
        req.adminAuth.secretVerified !==
        true
    ) {
        res.status(403).json({
            success: false,
            message:
                "Admin secret verification required.",
        });

        return;
    }

    next();
};

/*
|--------------------------------------------------------------------------
| Require Owner
|--------------------------------------------------------------------------
|
| OWNER is identified by the immutable OWNER role.
|
|--------------------------------------------------------------------------
*/

export const requireOwnerAccess: RequestHandler = (
    req,
    res,
    next
) => {
    if (!req.adminAuth?.adminId) {
        res.status(401).json({
            success: false,
            message:
                "Admin authentication required.",
        });

        return;
    }

    if (
        req.adminAuth.role
            ?.trim()
            .toUpperCase() !==
        "OWNER"
    ) {
        res.status(403).json({
            success: false,
            message:
                "Owner access is required.",
        });

        return;
    }

    next();
};

/*
|--------------------------------------------------------------------------
| Get Admin ID
|--------------------------------------------------------------------------
*/

export const getAuthenticatedAdminId = (
    req: Request
): string => {
    const adminId =
        req.adminAuth?.adminId;

    if (!adminId) {
        throw new Error(
            "Authenticated admin context is missing."
        );
    }

    return adminId;
};

/*
|--------------------------------------------------------------------------
| Backward-Compatible User ID Getter
|--------------------------------------------------------------------------
*/

export const getAuthenticatedUserId =
    getAuthenticatedAdminId;

/*
|--------------------------------------------------------------------------
| Get Admin Role
|--------------------------------------------------------------------------
*/

export const getAuthenticatedAdminRole = (
    req: Request
): string | undefined => {
    return req.adminAuth?.role;
};

/*
|--------------------------------------------------------------------------
| Get Admin Permissions
|--------------------------------------------------------------------------
*/

export const getAuthenticatedAdminPermissions = (
    req: Request
): readonly string[] => {
    return (
        req.adminAuth?.permissions ??
        []
    );
};

/*
|--------------------------------------------------------------------------
| Check Admin Authentication
|--------------------------------------------------------------------------
*/

export const isAdminAuthenticated = (
    req: Request
): boolean => {
    return Boolean(
        req.adminAuth?.adminId
    );
};

/*
|--------------------------------------------------------------------------
| Check Owner
|--------------------------------------------------------------------------
*/

export const isOwnerAuthenticated = (
    req: Request
): boolean => {
    return (
        req.adminAuth?.role
            ?.trim()
            .toUpperCase() ===
        "OWNER"
    );
};

/*
|--------------------------------------------------------------------------
| Check Secret Verification
|--------------------------------------------------------------------------
*/

export const isAdminSecretVerified = (
    req: Request
): boolean => {
    return (
        req.adminAuth
            ?.secretVerified === true
    );
};
