import jwt, {
    type Algorithm,
    type JwtPayload,
    type SignOptions,
    type VerifyOptions,
} from "jsonwebtoken";

import { env } from "../config/env";

/*
|--------------------------------------------------------------------------
| Token Types
|--------------------------------------------------------------------------
*/

export const TOKEN_TYPES = {
    ACCESS: "access",
    REFRESH: "refresh",
} as const;

export type TokenType =
    (typeof TOKEN_TYPES)[keyof typeof TOKEN_TYPES];

/*
|--------------------------------------------------------------------------
| JWT Algorithms
|--------------------------------------------------------------------------
|
| NOPTRIX currently uses HMAC-SHA256.
| Keeping the algorithm explicit prevents an unexpected
| algorithm from being accepted during verification.
|
*/

const JWT_ALGORITHM =
    "HS256" as const satisfies Algorithm;

/*
|--------------------------------------------------------------------------
| Token Payload Types
|--------------------------------------------------------------------------
*/

export interface AccessTokenPayload
    extends JwtPayload {
    readonly sub: string;
    readonly tokenType: typeof TOKEN_TYPES.ACCESS;
}

export interface RefreshTokenPayload
    extends JwtPayload {
    readonly sub: string;
    readonly tokenType: typeof TOKEN_TYPES.REFRESH;
}

export type AppTokenPayload =
    | AccessTokenPayload
    | RefreshTokenPayload;

/*
|--------------------------------------------------------------------------
| Token Configuration
|--------------------------------------------------------------------------
*/

interface TokenConfig {
    readonly secret: string;
    readonly expiresIn: string;
    readonly tokenType: TokenType;
}

const accessTokenConfig: TokenConfig =
    Object.freeze({
        secret: env.JWT_SECRET,
        expiresIn: env.JWT_EXPIRES_IN,
        tokenType: TOKEN_TYPES.ACCESS,
    });

const refreshTokenConfig: TokenConfig =
    Object.freeze({
        secret:
            env.REFRESH_TOKEN_SECRET,
        expiresIn:
            env.REFRESH_TOKEN_EXPIRES_IN,
        tokenType:
            TOKEN_TYPES.REFRESH,
    });

/*
|--------------------------------------------------------------------------
| Internal Validators
|--------------------------------------------------------------------------
*/

const getTokenConfig = (
    tokenType: TokenType
): TokenConfig => {
    switch (tokenType) {
        case TOKEN_TYPES.ACCESS:
            return accessTokenConfig;

        case TOKEN_TYPES.REFRESH:
            return refreshTokenConfig;

        default: {
            const exhaustiveCheck: never =
                tokenType;

            throw new Error(
                `Unsupported token type: ${String(
                    exhaustiveCheck
                )}`
            );
        }
    }
};

const isJwtPayload = (
    payload:
        | string
        | JwtPayload
        | null
): payload is JwtPayload => {
    return (
        typeof payload === "object" &&
        payload !== null
    );
};

const assertValidSubject = (
    subject: string
): string => {
    if (
        typeof subject !== "string"
    ) {
        throw new TypeError(
            "Token subject must be a string."
        );
    }

    const normalized =
        subject.trim();

    if (!normalized) {
        throw new TypeError(
            "Token subject must be a non-empty string."
        );
    }

    return normalized;
};

const buildPayload = (
    subject: string,
    tokenType: TokenType,
    additionalClaims?: Readonly<
        Record<string, unknown>
    >
): Record<string, unknown> => {
    const normalizedSubject =
        assertValidSubject(subject);

    return {
        ...(additionalClaims ?? {}),
        sub: normalizedSubject,
        tokenType,
    };
};

/*
|--------------------------------------------------------------------------
| Token Generation
|--------------------------------------------------------------------------
*/

/**
 * Generates an application JWT.
 */
export const generateToken = (
    subject: string,
    tokenType: TokenType,
    additionalClaims?: Readonly<
        Record<string, unknown>
    >
): string => {
    const config =
        getTokenConfig(tokenType);

    const payload =
        buildPayload(
            subject,
            tokenType,
            additionalClaims
        );

    const options: SignOptions = {
        algorithm: JWT_ALGORITHM,
        expiresIn:
            config.expiresIn as SignOptions["expiresIn"],
    };

    return jwt.sign(
        payload,
        config.secret,
        options
    );
};

/**
 * Generates an access token.
 */
export const generateAccessToken = (
    subject: string,
    additionalClaims?: Readonly<
        Record<string, unknown>
    >
): string => {
    return generateToken(
        subject,
        TOKEN_TYPES.ACCESS,
        additionalClaims
    );
};

/**
 * Generates a refresh token.
 */
export const generateRefreshToken = (
    subject: string,
    additionalClaims?: Readonly<
        Record<string, unknown>
    >
): string => {
    return generateToken(
        subject,
        TOKEN_TYPES.REFRESH,
        additionalClaims
    );
};

/*
|--------------------------------------------------------------------------
| Token Verification
|--------------------------------------------------------------------------
*/

/**
 * Verifies a JWT against the correct secret and token type.
 *
 * Throws when the token is invalid, expired, malformed,
 * signed with an unexpected algorithm, or belongs to
 * another token boundary.
 */
export const verifyToken = (
    token: string,
    tokenType: TokenType
):
    | AccessTokenPayload
    | RefreshTokenPayload => {
    if (
        typeof token !== "string" ||
        token.trim().length === 0
    ) {
        throw new TypeError(
            "Token is required."
        );
    }

    const config =
        getTokenConfig(tokenType);

    const verifyOptions: VerifyOptions =
        {
            algorithms: [
                JWT_ALGORITHM,
            ],
        };

    const decoded = jwt.verify(
        token.trim(),
        config.secret,
        verifyOptions
    );

    if (
        !isJwtPayload(decoded)
    ) {
        throw new Error(
            "Invalid JWT payload."
        );
    }

    if (
        decoded.tokenType !==
        tokenType
    ) {
        throw new Error(
            "Invalid token type."
        );
    }

    if (
        typeof decoded.sub !==
            "string" ||
        decoded.sub.trim().length ===
            0
    ) {
        throw new Error(
            "Invalid token subject."
        );
    }

    return decoded as
        | AccessTokenPayload
        | RefreshTokenPayload;
};

/**
 * Verifies an access token.
 */
export const verifyAccessToken = (
    token: string
): AccessTokenPayload => {
    const payload =
        verifyToken(
            token,
            TOKEN_TYPES.ACCESS
        );

    if (
        payload.tokenType !==
        TOKEN_TYPES.ACCESS
    ) {
        throw new Error(
            "Invalid access token."
        );
    }

    return payload as AccessTokenPayload;
};

/**
 * Verifies a refresh token.
 */
export const verifyRefreshToken = (
    token: string
): RefreshTokenPayload => {
    const payload =
        verifyToken(
            token,
            TOKEN_TYPES.REFRESH
        );

    if (
        payload.tokenType !==
        TOKEN_TYPES.REFRESH
    ) {
        throw new Error(
            "Invalid refresh token."
        );
    }

    return payload as RefreshTokenPayload;
};

/*
|--------------------------------------------------------------------------
| Safe Verification
|--------------------------------------------------------------------------
*/

/**
 * Attempts token verification without throwing.
 */
export const tryVerifyToken = (
    token: string,
    tokenType: TokenType
):
    | AccessTokenPayload
    | RefreshTokenPayload
    | null => {
    try {
        return verifyToken(
            token,
            tokenType
        );
    } catch {
        return null;
    }
};

/**
 * Attempts access-token verification.
 */
export const tryVerifyAccessToken = (
    token: string
): AccessTokenPayload | null => {
    try {
        return verifyAccessToken(
            token
        );
    } catch {
        return null;
    }
};

/**
 * Attempts refresh-token verification.
 */
export const tryVerifyRefreshToken = (
    token: string
): RefreshTokenPayload | null => {
    try {
        return verifyRefreshToken(
            token
        );
    } catch {
        return null;
    }
};

/*
|--------------------------------------------------------------------------
| Token Decoding
|--------------------------------------------------------------------------
|
| IMPORTANT:
| decodeToken() does NOT verify a token.
| Never use decoded data for authentication or authorization.
| Use verifyToken() for security decisions.
|
*/

export const decodeToken = (
    token: string
): JwtPayload | null => {
    if (
        typeof token !== "string" ||
        token.trim().length === 0
    ) {
        return null;
    }

    const decoded =
        jwt.decode(token.trim());

    return isJwtPayload(decoded)
        ? decoded
        : null;
};

/*
|--------------------------------------------------------------------------
| Token State Helpers
|--------------------------------------------------------------------------
*/

/**
 * Determines whether a token is expired.
 *
 * An invalid/missing expiration claim is treated as expired.
 */
export const isTokenExpired = (
    token: string
): boolean => {
    const payload =
        decodeToken(token);

    if (
        !payload ||
        typeof payload.exp !==
            "number"
    ) {
        return true;
    }

    return (
        payload.exp * 1000 <=
        Date.now()
    );
};

/**
 * Extracts the token subject without verification.
 *
 * Do not use this for authorization.
 */
export const getTokenSubject = (
    token: string
): string | null => {
    const payload =
        decodeToken(token);

    if (
        typeof payload?.sub !==
        "string"
    ) {
        return null;
    }

    return payload.sub;
};

/**
 * Extracts token type without verification.
 *
 * Do not use this for authorization.
 */
export const getTokenType = (
    token: string
): TokenType | null => {
    const payload =
        decodeToken(token);

    if (
        payload?.tokenType ===
        TOKEN_TYPES.ACCESS
    ) {
        return TOKEN_TYPES.ACCESS;
    }

    if (
        payload?.tokenType ===
        TOKEN_TYPES.REFRESH
    ) {
        return TOKEN_TYPES.REFRESH;
    }

    return null;
};

/*
|--------------------------------------------------------------------------
| Token Expiration Helpers
|--------------------------------------------------------------------------
*/

/**
 * Returns expiration timestamp in milliseconds.
 */
export const getTokenExpiration = (
    token: string
): number | null => {
    const payload =
        decodeToken(token);

    if (
        typeof payload?.exp !==
        "number"
    ) {
        return null;
    }

    return payload.exp * 1000;
};

/**
 * Returns remaining token lifetime in milliseconds.
 *
 * Returns null when the token has no valid expiration claim.
 * A negative value means the token is already expired.
 */
export const getTokenRemainingLifetime = (
    token: string
): number | null => {
    const expiration =
        getTokenExpiration(token);

    if (expiration === null) {
        return null;
    }

    return (
        expiration - Date.now()
    );
};

/*
|--------------------------------------------------------------------------
| Token Claim Helpers
|--------------------------------------------------------------------------
*/

/**
 * Checks whether a verified payload is an access token.
 */
export const isAccessTokenPayload = (
    payload: JwtPayload
): payload is AccessTokenPayload => {
    return (
        payload.tokenType ===
            TOKEN_TYPES.ACCESS &&
        typeof payload.sub ===
            "string"
    );
};

/**
 * Checks whether a verified payload is a refresh token.
 */
export const isRefreshTokenPayload = (
    payload: JwtPayload
): payload is RefreshTokenPayload => {
    return (
        payload.tokenType ===
            TOKEN_TYPES.REFRESH &&
        typeof payload.sub ===
            "string"
    );
};

/*
|--------------------------------------------------------------------------
| Token Pair Type
|--------------------------------------------------------------------------
*/

export interface TokenPair {
    readonly accessToken: string;
    readonly refreshToken: string;
}

/**
 * Generates an access/refresh token pair.
 */
export const generateTokenPair = (
    subject: string,
    additionalClaims?: Readonly<
        Record<string, unknown>
    >
): TokenPair => {
    return Object.freeze({
        accessToken:
            generateAccessToken(
                subject,
                additionalClaims
            ),
        refreshToken:
            generateRefreshToken(
                subject,
                additionalClaims
            ),
    });
};