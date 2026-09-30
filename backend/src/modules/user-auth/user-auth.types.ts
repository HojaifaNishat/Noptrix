import {
    Types,
} from "mongoose";


/*
|--------------------------------------------------------------------------
| Login Input
|--------------------------------------------------------------------------
*/

export interface UserLoginInput {
    readonly email: string;
    readonly password: string;
}


/*
|--------------------------------------------------------------------------
| Registration Input
|--------------------------------------------------------------------------
*/

export interface UserRegistrationInput {
    readonly name: string;
    readonly email: string;
    readonly phone?: string;
    readonly password: string;
}


/*
|--------------------------------------------------------------------------
| Refresh Token Input
|--------------------------------------------------------------------------
*/

export interface UserRefreshTokenInput {
    readonly refreshToken: string;
}


/*
|--------------------------------------------------------------------------
| Logout Input
|--------------------------------------------------------------------------
*/

export interface UserLogoutInput {
    readonly sessionId: string;
}


/*
|--------------------------------------------------------------------------
| Token Pair
|--------------------------------------------------------------------------
*/

export interface UserTokenPair {
    readonly accessToken: string;
    readonly refreshToken: string;
}


/*
|--------------------------------------------------------------------------
| Authenticated User
|--------------------------------------------------------------------------
*/

export interface AuthenticatedUser {
    readonly id: string;
    readonly email: string;
    readonly name: string;
    readonly phone?: string;
    readonly accountType: "USER";
    readonly isVerified: boolean;
}


/*
|--------------------------------------------------------------------------
| Authentication Result
|--------------------------------------------------------------------------
*/

export interface UserAuthenticationResult {
    readonly user: AuthenticatedUser;
    readonly userId: Types.ObjectId;
    readonly tokens: UserTokenPair;
    readonly sessionId: Types.ObjectId;
}
