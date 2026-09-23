import {
    Router,
} from "express";

import {
    login,
    verifySecretCode,
    refresh,
    logout,
    listActiveSessions,
} from "./owner-auth.controller";

import {
    ownerAuth,
} from "../../middlewares/ownerAuth.middleware";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    authRateLimiter,
} from "../../middlewares/rateLimit.middleware";

import {
    ownerLoginSchema,
    ownerSecretVerificationSchema,
} from "./owner-auth.validator";


/*
|--------------------------------------------------------------------------
| OWNER AUTH ROUTER
|--------------------------------------------------------------------------
|
| Mount:
|
|   /api/owner-auth
|
| Authentication flow:
|
|   1. login
|      email + password
|      ↓
|      access token (secretVerified: false)
|
|   2. verify-secret
|      OWNER access token
|      ↓
|      access token (secretVerified: true)
|
|   3. refresh
|      HTTP-only refresh cookie
|      ↓
|      rotated access + refresh token
|
|--------------------------------------------------------------------------
*/


const ownerAuthRouter =
    Router();


/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
|
| POST /api/owner-auth/login
|
| Public endpoint.
|
| Rate limited because this endpoint accepts credentials.
|
|--------------------------------------------------------------------------
*/

ownerAuthRouter.post(
    "/login",

    authRateLimiter,

    validate(
        ownerLoginSchema,
        "body"
    ),

    login
);


/*
|--------------------------------------------------------------------------
| VERIFY SECRET
|--------------------------------------------------------------------------
|
| POST /api/owner-auth/verify-secret
|
| Requires:
|
| - valid OWNER access token
| - role = OWNER
|
| Does NOT require secretVerified yet,
| because this endpoint exists to establish it.
|
|--------------------------------------------------------------------------
*/

ownerAuthRouter.post(
    "/verify-secret",

    ownerAuth,

    validate(
        ownerSecretVerificationSchema,
        "body"
    ),

    authRateLimiter,

    verifySecretCode
);


/*
|--------------------------------------------------------------------------
| REFRESH
|--------------------------------------------------------------------------
|
| POST /api/owner-auth/refresh
|
| Uses the HTTP-only refresh-token cookie.
|
| No access token is required.
|
| The service rotates the refresh token/session.
|
|--------------------------------------------------------------------------
*/

ownerAuthRouter.post(
    "/refresh",

    authRateLimiter,

    refresh
);


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
|
| POST /api/owner-auth/logout
|
| Requires a valid OWNER access token.
|
| The current authenticated session is revoked.
|
|--------------------------------------------------------------------------
*/

ownerAuthRouter.post(
    "/logout",

    ownerAuth,

    logout
);


/*
|--------------------------------------------------------------------------
| ACTIVE SESSIONS
|--------------------------------------------------------------------------
|
| GET /api/owner-auth/sessions
|
| Requires a valid OWNER access token.
|
| Returns active sessions belonging to the
| authenticated OWNER's canonical User identity.
|
|--------------------------------------------------------------------------
*/

ownerAuthRouter.get(
    "/sessions",

    ownerAuth,

    listActiveSessions
);


export {
    ownerAuthRouter,
};