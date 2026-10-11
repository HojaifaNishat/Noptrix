export const AUTH_ACCOUNT_TYPES = {
    OWNER: "OWNER",
    ADMIN: "ADMIN",
    EMPLOYEE: "EMPLOYEE",
    USER: "USER",
    SELLER: "SELLER",
    RIDER: "RIDER",
} as const;

export type AuthAccountType =
    (typeof AUTH_ACCOUNT_TYPES)[keyof typeof AUTH_ACCOUNT_TYPES];


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
| Auth User
|--------------------------------------------------------------------------
*/

export interface AuthUser {
    id: string;

    email: string;

    name?: string;

    phone?: string;

    accountType: AuthAccountType;

    role?: string;

    isVerified?: boolean;

    secretVerified?: boolean;

    permissions?: string[];

    avatarUrl?: string;
}


/*
|--------------------------------------------------------------------------
| Auth Session
|--------------------------------------------------------------------------
*/

export interface AuthSession {
    user: AuthUser;

    tokenType: TokenType;

    expiresAt?: string;
}


/*
|--------------------------------------------------------------------------
| Login / Registration Input
|--------------------------------------------------------------------------
*/

export interface LoginInput {
    email: string;

    password: string;
}

export interface RegisterInput {
    name: string;

    email: string;

    password: string;

    phone?: string;
}


/*
|--------------------------------------------------------------------------
| Authentication Response
|--------------------------------------------------------------------------
*/

export interface LoginResponse {
    user: AuthUser;

    userId: string;

    sessionId: string;

    tokens?: {
        accessToken: string;
    };

    accessToken?: string;

    refreshToken?: string;

    expiresAt?: string;
}

export interface LoginVerificationChallenge {
    verificationRequired: true;
    challengeId: string;
    email: string;
    expiresAt: string;
    resendAvailableAt: string;
}

export interface LoginVerificationInput {
    challengeId: string;
    code: string;
}

export type LoginAttemptResponse =
    | LoginResponse
    | LoginVerificationChallenge;

export interface OwnerAuthentication {
    userId: string;
    ownerId: string;
    sessionId: string;
    accessToken: string;
    secretVerified: boolean;
}


/*
|--------------------------------------------------------------------------
| Customer Registration / Email Verification
|--------------------------------------------------------------------------
*/

export interface RegistrationResponse {
    registrationId: string;
    email: string;
    verificationRequired: true;
}

export type EmailVerificationInput =
    | {
          registrationId: string;
          email: string;
          code: string;
      }
    | {
          userId: string;
          email: string;
          code: string;
      };
