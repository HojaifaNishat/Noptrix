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
| Authentication Result
|--------------------------------------------------------------------------
*/

export interface UserAuthenticationResult {
    readonly userId: Types.ObjectId;
    readonly tokens: UserTokenPair;
    readonly sessionId: Types.ObjectId;
}