import {
    Types,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| Rider Auth Context
|--------------------------------------------------------------------------
*/

export interface RiderAuthContext {
    riderId: Types.ObjectId;

    userId: Types.ObjectId;

    sessionId: Types.ObjectId;

    tokenIssuedAt?: number;

    tokenExpiresAt?: number;

    claims: Record<string, unknown>;
}

/*
|--------------------------------------------------------------------------
| Rider Login Input
|--------------------------------------------------------------------------
*/

export interface RiderLoginInput {
    email?: string;

    phone?: string;

    password: string;
}

/*
|--------------------------------------------------------------------------
| Rider Login Result
|--------------------------------------------------------------------------
*/

export interface RiderLoginResult {
    accessToken: string;

    refreshToken: string;

    riderId: Types.ObjectId;

    userId: Types.ObjectId;

    sessionId: Types.ObjectId;
}

/*
|--------------------------------------------------------------------------
| Rider Refresh Result
|--------------------------------------------------------------------------
*/

export interface RiderRefreshResult {
    accessToken: string;

    refreshToken: string;

    riderId: Types.ObjectId;

    userId: Types.ObjectId;

    sessionId: Types.ObjectId;
}

/*
|--------------------------------------------------------------------------
| Rider Authenticated Identity
|--------------------------------------------------------------------------
*/

export interface RiderAuthenticatedIdentity {
    riderId: Types.ObjectId;

    userId: Types.ObjectId;

    sessionId: Types.ObjectId;
}