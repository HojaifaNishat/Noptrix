import {
    Request,
    Response,
    NextFunction,
    RequestHandler,
} from "express";

import {
    TOKEN_TYPES,
    type AccessTokenPayload,
    verifyAccessToken,
} from "../utils/token";

/*
|--------------------------------------------------------------------------
| Authenticated Request Context
|--------------------------------------------------------------------------
|
| This context becomes the foundation for:
|
| Auth
|   ↓
| Role
|   ↓
| Permission
|   ↓
| Resource Authorization
|
|--------------------------------------------------------------------------
*/

export interface AuthContext {
    readonly userId: string;
    readonly tokenType: typeof TOKEN_TYPES.ACCESS;
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
            auth?: AuthContext;
        }
    }
}

/*
|--------------------------------------------------------------------------
| Authorization Header Parser
|--------------------------------------------------------------------------
*/

const extractBearerToken = (
    authorizationHeader:
        | string
        | undefined
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
        parts[1].trim();

    if (!token) {
        return null;
    }

    return token;
};

/*
|--------------------------------------------------------------------------
| Access Token Payload → Auth Context
|--------------------------------------------------------------------------
*/

const buildAuthContext = (
    payload: AccessTokenPayload
): AuthContext => {
    const {
        sub,
        tokenType,
        iat,
        exp,
        ...additionalClaims
    } = payload;

    return Object.freeze({
        userId: sub,
        tokenType,
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
            ...additionalClaims,
        }),
    });
};

/*
|--------------------------------------------------------------------------
| Authentication Middleware
|--------------------------------------------------------------------------
*/

export const authenticate: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const token =
        extractBearerToken(
            req.headers.authorization
        );

    /*
     * No token
     */
    if (!token) {
        res.status(401).json({
            success: false,
            message:
                "Authentication required.",
        });

        return;
    }

    try {
        /*
         * verifyAccessToken() already validates:
         *
         * - JWT signature
         * - HS256 algorithm
         * - expiration
         * - access token secret
         * - tokenType
         * - subject
         */
        const payload =
            verifyAccessToken(token);

        /*
         * Build a trusted request context.
         *
         * IMPORTANT:
         * Never use jwt.decode() or manually decoded
         * values for authorization.
         */
        req.auth =
            buildAuthContext(payload);

        next();
    } catch (error) {
        /*
         * Do not expose JWT library internals.
         *
         * Examples:
         * - jwt expired
         * - invalid signature
         * - malformed token
         * - invalid algorithm
         *
         * All become the same external response.
         */
        res.status(401).json({
            success: false,
            message:
                "Invalid or expired authentication token.",
        });

        return;
    }
};

/*
|--------------------------------------------------------------------------
| Optional Authentication
|--------------------------------------------------------------------------
|
| Useful for endpoints such as:
|
| - public product details
| - public reviews
| - personalized recommendations
| - wishlist-aware product pages
|
| If a valid access token exists:
|     req.auth = ...
|
| If no/invalid token exists:
|     request continues as guest
|
*/

export const optionalAuthenticate: RequestHandler = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const token =
        extractBearerToken(
            req.headers.authorization
        );

    if (!token) {
        next();
        return;
    }

    try {
        const payload =
            verifyAccessToken(token);

        req.auth =
            buildAuthContext(payload);
    } catch {
        /*
         * Invalid optional authentication must not
         * automatically block a public endpoint.
         *
         * The route remains a guest request.
         */
    }

    next();
};

/*
|--------------------------------------------------------------------------
| Require Authentication Helper
|--------------------------------------------------------------------------
|
| Useful when another middleware/controller needs
| to guarantee that authentication has already happened.
|
*/

export const requireAuthentication =
    (): RequestHandler => {
        return (
            req: Request,
            res: Response,
            next: NextFunction
        ) => {
            if (!req.auth) {
                res.status(401).json({
                    success: false,
                    message:
                        "Authentication required.",
                });

                return;
            }

            next();
        };
    };

/*
|--------------------------------------------------------------------------
| Auth Context Helpers
|--------------------------------------------------------------------------
*/

export const getAuthenticatedUserId = (
    req: Request
): string => {
    if (!req.auth?.userId) {
        throw new Error(
            "Authenticated user context is missing."
        );
    }

    return req.auth.userId;
};

/*
|--------------------------------------------------------------------------
| Authorization State Helper
|--------------------------------------------------------------------------
*/

export const isAuthenticated = (
    req: Request
): boolean => {
    return Boolean(req.auth);
};