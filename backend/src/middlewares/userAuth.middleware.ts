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
| User Auth Context
|--------------------------------------------------------------------------
*/

export interface UserAuthContext {
    readonly userId: string;

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
            userAuth?: UserAuthContext;
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
| Build User Auth Context
|--------------------------------------------------------------------------
*/

const buildUserAuthContext = (
    payload: AccessTokenPayload
): UserAuthContext => {
    const {
        sub,
        tokenType,
        iat,
        exp,
        ...additionalClaims
    } = payload;

    return Object.freeze({
        userId: sub,

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
| User Authentication
|--------------------------------------------------------------------------
*/

export const userAuth: RequestHandler = (
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
                "User authentication required.",
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
                    "Invalid user authentication token.",
            });

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Build User Context
        |--------------------------------------------------------------------------
        */

        req.userAuth =
            buildUserAuthContext(
                payload
            );

        next();
    } catch {
        res.status(401).json({
            success: false,
            message:
                "Invalid or expired user authentication token.",
        });

        return;
    }
};

/*
|--------------------------------------------------------------------------
| Require User
|--------------------------------------------------------------------------
*/

export const requireUser: RequestHandler = (
    req,
    res,
    next
) => {
    if (!req.userAuth?.userId) {
        res.status(401).json({
            success: false,
            message:
                "User authentication required.",
        });

        return;
    }

    next();
};

/*
|--------------------------------------------------------------------------
| Get Authenticated User ID
|--------------------------------------------------------------------------
*/

export const getAuthenticatedUserId = (
    req: Request
): string => {
    const userId =
        req.userAuth?.userId;

    if (!userId) {
        throw new Error(
            "Authenticated user context is missing."
        );
    }

    return userId;
};

/*
|--------------------------------------------------------------------------
| Check User Authentication
|--------------------------------------------------------------------------
*/

export const isUserAuthenticated = (
    req: Request
): boolean => {
    return Boolean(
        req.userAuth?.userId
    );
};