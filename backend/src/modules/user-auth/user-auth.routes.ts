import {
    Router,
} from "express";

import {
    authRateLimiter,
} from "../../middlewares/rateLimit.middleware";

import {
    authenticate,
} from "../../middlewares/auth.middleware";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    register,
    login,
    refreshToken,
    logout,
} from "./user-auth.controller";

import {
    userRegistrationSchema,
    userLoginSchema,
    userRefreshTokenSchema,
} from "./user-auth.validator";


const router = Router();


/*
|--------------------------------------------------------------------------
| User Registration
|--------------------------------------------------------------------------
| POST /api/user-auth/register
|--------------------------------------------------------------------------
*/

router.post(
    "/register",
    authRateLimiter,
    validate(userRegistrationSchema),
    register
);


/*
|--------------------------------------------------------------------------
| User Login
|--------------------------------------------------------------------------
| POST /api/user-auth/login
|--------------------------------------------------------------------------
*/

router.post(
    "/login",
    authRateLimiter,
    validate(userLoginSchema),
    login
);


/*
|--------------------------------------------------------------------------
| Refresh Access Token
|--------------------------------------------------------------------------
| POST /api/user-auth/refresh
|--------------------------------------------------------------------------
*/

router.post(
    "/refresh",
    authRateLimiter,
    validate(userRefreshTokenSchema),
    refreshToken
);


/*
|--------------------------------------------------------------------------
| User Logout
|--------------------------------------------------------------------------
| POST /api/user-auth/logout
|--------------------------------------------------------------------------
*/

router.post(
    "/logout",
    authenticate,
    logout
);


export default router;