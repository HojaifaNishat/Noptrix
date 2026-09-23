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
| Owner Auth Context
|--------------------------------------------------------------------------
*/

export interface OwnerAuthContext {
    readonly ownerId: string;

    readonly userId: string;

    readonly sessionId?: string;

    readonly role: string;

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
            ownerAuth?: OwnerAuthContext;
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
        parts[0].toLowerCase() !==
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
| Build Owner Auth Context
|--------------------------------------------------------------------------
*/

const buildOwnerAuthContext = (
    payload: AccessTokenPayload
): OwnerAuthContext => {
    const {
        sub,
        tokenType,
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
        typeof claims.role === "string"
            ? claims.role
            : "";

    const sessionId =
        typeof claims.sessionId === "string"
            ? claims.sessionId
            : undefined;

    const secretVerified =
        claims.secretVerified === true;

    return Object.freeze({
        ownerId: sub,
        userId: sub,
        sessionId,

        role,

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

        claims: Object.freeze({
            ...claims,
        }),
    });
};

/*
|--------------------------------------------------------------------------
| Owner Authentication
|--------------------------------------------------------------------------
*/

export const ownerAuth: RequestHandler = (
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
                "Owner authentication required.",
        });

        return;
    }

    try {
        const payload =
            verifyAccessToken(token);

        /*
        |--------------------------------------------------------------------------
        | Token Type Validation
        |--------------------------------------------------------------------------
        */

        if (
            payload.tokenType !==
            "access"
        ) {
            res.status(401).json({
                success: false,
                message:
                    "Invalid owner authentication token.",
            });

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Owner Role Validation
        |--------------------------------------------------------------------------
        */

        const role =
            typeof payload.role ===
            "string"
                ? payload.role
                : undefined;

        if (role !== "OWNER") {
            res.status(403).json({
                success: false,
                message:
                    "Owner access required.",
            });

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Build Owner Context
        |--------------------------------------------------------------------------
        */

        req.ownerAuth =
            buildOwnerAuthContext(
                payload
            );

        next();
    } catch {
        res.status(401).json({
            success: false,
            message:
                "Invalid or expired owner authentication token.",
        });

        return;
    }
};

/*
|--------------------------------------------------------------------------
| Require Verified Owner
|--------------------------------------------------------------------------
*/

export const ownerSecretVerified: RequestHandler = (
    req,
    res,
    next
) => {
    if (!req.ownerAuth?.ownerId) {
        res.status(401).json({
            success: false,
            message:
                "Owner authentication required.",
        });

        return;
    }

    if (
        req.ownerAuth.secretVerified !==
        true
    ) {
        res.status(403).json({
            success: false,
            message:
                "Owner secret verification required.",
        });

        return;
    }

    next();
};

/*
|--------------------------------------------------------------------------
| Get Authenticated Owner ID
|--------------------------------------------------------------------------
*/

export const getAuthenticatedOwnerId = (
    req: Request
): string => {
    const ownerId =
        req.ownerAuth?.ownerId;

    if (!ownerId) {
        throw new Error(
            "Authenticated owner context is missing."
        );
    }

    return ownerId;
};

/*
|--------------------------------------------------------------------------
| Get Owner Role
|--------------------------------------------------------------------------
*/

export const getAuthenticatedOwnerRole = (
    req: Request
): string | undefined => {
    return req.ownerAuth?.role;
};

/*
|--------------------------------------------------------------------------
| Check Owner Authentication
|--------------------------------------------------------------------------
*/

export const isOwnerAuthenticated = (
    req: Request
): boolean => {
    return Boolean(
        req.ownerAuth?.ownerId
    );
};

/*
|--------------------------------------------------------------------------
| Check Owner Secret Verification
|--------------------------------------------------------------------------
*/

export const isOwnerSecretVerified = (
    req: Request
): boolean => {
    return (
        req.ownerAuth
            ?.secretVerified === true
    );
};