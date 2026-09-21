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
| Rider Auth Context
|--------------------------------------------------------------------------
*/

export interface RiderAuthContext {
    readonly riderId: string;

    readonly role?: string;

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
            riderAuth?: RiderAuthContext;
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
| Build Rider Auth Context
|--------------------------------------------------------------------------
*/

const buildRiderAuthContext = (
    payload: AccessTokenPayload
): RiderAuthContext => {
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
            : undefined;

    return Object.freeze({
        riderId: sub,

        ...(role
            ? {
                  role,
              }
            : {}),

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
| Rider Authentication
|--------------------------------------------------------------------------
*/

export const riderAuth: RequestHandler = (
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
                "Rider authentication required.",
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
                    "Invalid rider authentication token.",
            });

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Rider Context
        |--------------------------------------------------------------------------
        */

        req.riderAuth =
            buildRiderAuthContext(
                payload
            );

        next();
    } catch {
        res.status(401).json({
            success: false,
            message:
                "Invalid or expired rider authentication token.",
        });

        return;
    }
};

/*
|--------------------------------------------------------------------------
| Require Rider
|--------------------------------------------------------------------------
*/

export const requireRider: RequestHandler = (
    req,
    res,
    next
) => {
    if (!req.riderAuth?.riderId) {
        res.status(401).json({
            success: false,
            message:
                "Rider authentication required.",
        });

        return;
    }

    next();
};

/*
|--------------------------------------------------------------------------
| Require Rider Role
|--------------------------------------------------------------------------
*/

export const requireRiderRole: RequestHandler = (
    req,
    res,
    next
) => {
    if (!req.riderAuth?.riderId) {
        res.status(401).json({
            success: false,
            message:
                "Rider authentication required.",
        });

        return;
    }

    if (
        req.riderAuth.role !==
        "RIDER"
    ) {
        res.status(403).json({
            success: false,
            message:
                "Rider access required.",
        });

        return;
    }

    next();
};

/*
|--------------------------------------------------------------------------
| Get Authenticated Rider ID
|--------------------------------------------------------------------------
*/

export const getAuthenticatedRiderId = (
    req: Request
): string => {
    const riderId =
        req.riderAuth?.riderId;

    if (!riderId) {
        throw new Error(
            "Authenticated rider context is missing."
        );
    }

    return riderId;
};

/*
|--------------------------------------------------------------------------
| Get Rider Role
|--------------------------------------------------------------------------
*/

export const getAuthenticatedRiderRole = (
    req: Request
): string | undefined => {
    return req.riderAuth?.role;
};

/*
|--------------------------------------------------------------------------
| Check Rider Authentication
|--------------------------------------------------------------------------
*/

export const isRiderAuthenticated = (
    req: Request
): boolean => {
    return Boolean(
        req.riderAuth?.riderId
    );
};