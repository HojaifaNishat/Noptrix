import {
    Router,
} from "express";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    riderAuth,
} from "../../middlewares/riderAuth.middleware";

import {
    login,
    refreshToken,
    logout,
} from "./rider-auth.controller";

import {
    riderLoginSchema,
    riderRefreshTokenSchema,
    riderLogoutSchema,
} from "./rider-auth.validator";


const router =
    Router();


/*
|--------------------------------------------------------------------------
| Rider Login
|--------------------------------------------------------------------------
*/

router.post(
    "/login",
    validate(
        riderLoginSchema
    ),
    login
);


/*
|--------------------------------------------------------------------------
| Rider Refresh Token
|--------------------------------------------------------------------------
*/

router.post(
    "/refresh",
    validate(
        riderRefreshTokenSchema
    ),
    refreshToken
);


/*
|--------------------------------------------------------------------------
| Rider Logout
|--------------------------------------------------------------------------
*/

router.post(
    "/logout",
    riderAuth,
    validate(
        riderLogoutSchema
    ),
    logout
);


export default router;