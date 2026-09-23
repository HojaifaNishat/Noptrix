/*
|--------------------------------------------------------------------------
| OWNER AUTH TYPES
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Owner Login Input
|--------------------------------------------------------------------------
*/

export interface OwnerLoginInput {
    readonly email: string;
    readonly password: string;
}

/*
|--------------------------------------------------------------------------
| Owner Secret Verification Input
|--------------------------------------------------------------------------
*/

export interface OwnerSecretVerificationInput {
    readonly secretCode: string;
}

/*
|--------------------------------------------------------------------------
| Owner Token Pair
|--------------------------------------------------------------------------
*/

export interface OwnerTokenPair {
    readonly accessToken: string;
    readonly refreshToken: string;
}

/*
|--------------------------------------------------------------------------
| Owner Authentication Result
|--------------------------------------------------------------------------
*/

export interface OwnerAuthenticationResult {
    readonly userId: string;
    readonly ownerId: string;
    readonly tokens: OwnerTokenPair;
    readonly sessionId: string;
    readonly secretVerified: false;
}

/*
|--------------------------------------------------------------------------
| Owner Secret Verification Result
|--------------------------------------------------------------------------
*/

export interface OwnerSecretVerificationResult {
    readonly userId: string;
    readonly ownerId: string;
    readonly accessToken: string;
    readonly sessionId: string;
    readonly secretVerified: true;
}

/*
|--------------------------------------------------------------------------
| Owner Logout Input
|--------------------------------------------------------------------------
*/

export interface OwnerLogoutInput {
    readonly sessionId: string;
}