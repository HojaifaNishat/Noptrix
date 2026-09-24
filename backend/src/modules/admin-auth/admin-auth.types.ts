import {
    AdminLoginInput,
} from "./admin-auth.validator";


/*
|--------------------------------------------------------------------------
| Admin Token Pair
|--------------------------------------------------------------------------
*/

export interface AdminTokenPair {
    readonly accessToken: string;
    readonly refreshToken: string;
}


/*
|--------------------------------------------------------------------------
| Admin Authentication Result
|--------------------------------------------------------------------------
*/

export interface AdminAuthenticationResult {
    readonly userId: string;
    readonly adminId: string;
    readonly roleId: string;
    readonly role: string;
    readonly tokens: AdminTokenPair;
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