import {
    Types,
} from "mongoose";


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
    readonly claims: Readonly<Record<string, unknown>>;
}


/*
|--------------------------------------------------------------------------
| Seller Login
|--------------------------------------------------------------------------
*/

export interface SellerLoginInput {
    email?: string;
    phone?: string;
    password: string;
}


/*
|--------------------------------------------------------------------------
| Seller Login Result
|--------------------------------------------------------------------------
*/

export interface SellerLoginResult {
    accessToken: string;
    refreshToken: string;
    sellerId: Types.ObjectId;
    userId: Types.ObjectId;
    sessionId: Types.ObjectId;
}


/*
|--------------------------------------------------------------------------
| Seller Refresh Result
|--------------------------------------------------------------------------
*/

export interface SellerRefreshResult {
    accessToken: string;
    refreshToken: string;
    sellerId: Types.ObjectId;
    userId: Types.ObjectId;
    sessionId: Types.ObjectId;
}


/*
|--------------------------------------------------------------------------
| Seller Authenticated Identity
|--------------------------------------------------------------------------
*/

export interface SellerAuthenticatedIdentity {
    sellerId: Types.ObjectId;
    userId: Types.ObjectId;
    sessionId: Types.ObjectId;
}