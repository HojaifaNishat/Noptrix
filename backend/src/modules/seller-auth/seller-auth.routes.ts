import {
    Router,
} from "express";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    sellerAuth,
} from "../../middlewares/sellerAuth.middleware";

import {
    login,
    refreshToken,
    logout,
    changePassword,
} from "./seller-auth.controller";

import {
    sellerLoginSchema,
    sellerRefreshTokenSchema,
    sellerLogoutSchema,
    sellerChangePasswordSchema,
} from "./seller-auth.validator";


const router = Router();


/*
|--------------------------------------------------------------------------
| Public Authentication
|--------------------------------------------------------------------------
*/

router.post(
    "/login",
    validate(sellerLoginSchema),
    login
);

router.post(
    "/refresh",
    validate(
        sellerRefreshTokenSchema
    ),
    refreshToken
);


/*
|--------------------------------------------------------------------------
| Authenticated Seller
|--------------------------------------------------------------------------
*/

router.post(
    "/logout",
    sellerAuth,
    validate(sellerLogoutSchema),
    logout
);

router.post(
    "/change-password",
    sellerAuth,
    validate(
        sellerChangePasswordSchema
    ),
    changePassword
);


export default router;