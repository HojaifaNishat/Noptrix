import {
    Request,
    Response,
    NextFunction,
} from "express";

import {
    verifyAccessToken,
} from "../utils/token";

import {
    ApiError,
} from "../utils/ApiError";


/*
|--------------------------------------------------------------------------
| Seller Auth Context
|--------------------------------------------------------------------------
*/

export interface SellerAuthContext {
    readonly sellerId: string;
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
            sellerAuth?:
                SellerAuthContext;
        }
    }
}


/*
|--------------------------------------------------------------------------
| Extract Bearer Token
|--------------------------------------------------------------------------
*/

const extractBearerToken = (
    req: Request
): string | null => {

    const authorization =
        req.headers.authorization;

    if (
        !authorization ||
        typeof authorization !==
            "string"
    ) {
        return null;
    }

    const [
        scheme,
        token,
    ] =
        authorization.trim().split(
            /\s+/
        );

    if (
        scheme?.toLowerCase() !==
            "bearer" ||
        !token
    ) {
        return null;
    }

    return token;
};


/*
|--------------------------------------------------------------------------
| Build Seller Auth Context
|--------------------------------------------------------------------------
*/

const buildSellerAuthContext = (
    payload: Record<string, unknown>
): SellerAuthContext => {

    const sellerId =
        typeof payload.sub ===
        "string"
            ? payload.sub
            : "";

    if (!sellerId) {
        throw ApiError.unauthorized(
            "Seller token subject is missing.",
            {
                code:
                    "SELLER_TOKEN_SUBJECT_MISSING",
            }
        );
    }


    return {
        sellerId,

        role:
            typeof payload.role ===
            "string"
                ? payload.role
                : undefined,

        tokenIssuedAt:
            typeof payload.iat ===
            "number"
                ? payload.iat
                : undefined,

        tokenExpiresAt:
            typeof payload.exp ===
            "number"
                ? payload.exp
                : undefined,

        claims:
            payload as Readonly<
                Record<string, unknown>
            >,
    };
};


/*
|--------------------------------------------------------------------------
| Seller Authentication Middleware
|--------------------------------------------------------------------------
*/

export const sellerAuth = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {

    try {

        const token =
            extractBearerToken(req);


        if (!token) {
            throw ApiError.unauthorized(
                "Seller authentication required.",
                {
                    code:
                        "SELLER_AUTH_REQUIRED",
                }
            );
        }


        const payload =
            verifyAccessToken(
                token
            );


        /*
        |--------------------------------------------------------------------------
        | Token Type
        |--------------------------------------------------------------------------
        */

        if (
            payload.tokenType !==
            "access"
        ) {
            throw ApiError.unauthorized(
                "Invalid seller access token.",
                {
                    code:
                        "INVALID_TOKEN_TYPE",
                }
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Seller Role
        |--------------------------------------------------------------------------
        */

        if (
            payload.role !==
            "SELLER"
        ) {
            throw ApiError.forbidden(
                "Seller access required.",
                {
                    code:
                        "SELLER_ROLE_REQUIRED",
                }
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Seller ID
        |--------------------------------------------------------------------------
        */

        if (
            typeof payload.sub !==
                "string" ||
            !payload.sub.trim()
        ) {
            throw ApiError.unauthorized(
                "Seller token subject is invalid.",
                {
                    code:
                        "INVALID_SELLER_SUBJECT",
                }
            );
        }


        req.sellerAuth =
            buildSellerAuthContext(
                payload as Record<
                    string,
                    unknown
                >
            );


        next();

    } catch (error) {
        next(error);
    }
};


/*
|--------------------------------------------------------------------------
| Require Seller
|--------------------------------------------------------------------------
*/

export const requireSeller = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {

    if (
        !req.sellerAuth?.sellerId
    ) {
        next(
            ApiError.unauthorized(
                "Seller authentication required.",
                {
                    code:
                        "SELLER_AUTH_REQUIRED",
                }
            )
        );

        return;
    }

    next();
};


/*
|--------------------------------------------------------------------------
| Require Seller Role
|--------------------------------------------------------------------------
*/

export const requireSellerRole = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {

    if (
        !req.sellerAuth?.sellerId
    ) {
        next(
            ApiError.unauthorized(
                "Seller authentication required.",
                {
                    code:
                        "SELLER_AUTH_REQUIRED",
                }
            )
        );

        return;
    }


    if (
        req.sellerAuth.role !==
        "SELLER"
    ) {
        next(
            ApiError.forbidden(
                "Seller role required.",
                {
                    code:
                        "SELLER_ROLE_REQUIRED",
                }
            )
        );

        return;
    }

    next();
};


/*
|--------------------------------------------------------------------------
| Get Authenticated Seller ID
|--------------------------------------------------------------------------
*/

export const getAuthenticatedSellerId = (
    req: Request
): string => {

    const sellerId =
        req.sellerAuth?.sellerId;

    if (!sellerId) {
        throw ApiError.unauthorized(
            "Seller authentication required.",
            {
                code:
                    "SELLER_AUTH_REQUIRED",
            }
        );
    }

    return sellerId;
};


/*
|--------------------------------------------------------------------------
| Get Authenticated Seller Role
|--------------------------------------------------------------------------
*/

export const getAuthenticatedSellerRole = (
    req: Request
): string | undefined => {

    return req.sellerAuth?.role;
};


/*
|--------------------------------------------------------------------------
| Seller Authentication Check
|--------------------------------------------------------------------------
*/

export const isSellerAuthenticated = (
    req: Request
): boolean => {

    return Boolean(
        req.sellerAuth?.sellerId
    );
};