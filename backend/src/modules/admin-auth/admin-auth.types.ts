import type {
    AdminLoginInput,
} from "./admin-auth.validator";


/*
|--------------------------------------------------------------------------
| Admin Auth User
|--------------------------------------------------------------------------
*/

export interface AdminAuthUser {
    readonly id: string;
    readonly email: string;
    readonly name?: string;
    readonly phone?: string;

    readonly accountType: "ADMIN";

    readonly role?: string;

    readonly isVerified?: boolean;

    readonly secretVerified?: boolean;

    readonly permissions?: readonly string[];

    readonly avatarUrl?: string;
}


/*
|--------------------------------------------------------------------------
| Admin Token Pair
|--------------------------------------------------------------------------
*/

export interface AdminTokenPair {
    readonly accessToken: string;
    readonly refreshToken?: string;
}


/*
|--------------------------------------------------------------------------
| Admin Authentication Result
|--------------------------------------------------------------------------
*/

export interface AdminAuthenticationResult {
    readonly user: AdminAuthUser;

    readonly userId: string;

    readonly adminId: string;

    readonly roleId: string;

    readonly role: string;

    readonly permissions: readonly string[];

    readonly tokens: AdminTokenPair;

    readonly sessionId: string;

    readonly secretVerified: boolean;
}


/*
|--------------------------------------------------------------------------
| Admin Refresh Result
|--------------------------------------------------------------------------
*/

export interface AdminRefreshResult {
    readonly accessToken: string;

    readonly refreshToken: string;

    readonly user: AdminAuthUser;

    readonly userId: string;

    readonly adminId: string;

    readonly sessionId: string;

    readonly secretVerified: boolean;
}


/*
|--------------------------------------------------------------------------
| Admin Secret Verification Result
|--------------------------------------------------------------------------
*/

export interface AdminSecretVerificationResult {
    readonly userId: string;

    readonly adminId: string;

    readonly accessToken: string;

    readonly sessionId: string;

    readonly secretVerified: boolean;
}


/*
|--------------------------------------------------------------------------
| Input Types
|--------------------------------------------------------------------------
*/

export type {
    AdminLoginInput,
};
