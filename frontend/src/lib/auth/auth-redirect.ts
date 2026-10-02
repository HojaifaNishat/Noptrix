import {
    AUTH_ACCOUNT_TYPES,
    type AuthAccountType,
    type AuthUser,
} from "@/types/auth";

import {
    ROUTES,
} from "@/constants/routes";

/*
|--------------------------------------------------------------------------
| Default Routes
|--------------------------------------------------------------------------
*/

export const getDefaultRouteForAccount =
    (
        accountType: AuthAccountType,
    ): string => {
        switch (
            accountType
        ) {
            case AUTH_ACCOUNT_TYPES.OWNER:
            case AUTH_ACCOUNT_TYPES.ADMIN:
                return ROUTES.ADMIN_PANEL;

            case AUTH_ACCOUNT_TYPES.USER:
                return ROUTES.CUSTOMER_ACCOUNT;

            case AUTH_ACCOUNT_TYPES.SELLER:
                return ROUTES.SELLER_PANEL;

            case AUTH_ACCOUNT_TYPES.RIDER:
                return ROUTES.RIDER_PANEL;

            default:
                return ROUTES.HOME;
        }
    };

/*
|--------------------------------------------------------------------------
| User Redirect
|--------------------------------------------------------------------------
*/

export const getDefaultRouteForUser =
    (
        user: AuthUser,
    ): string => {
        return getDefaultRouteForAccount(
            user.accountType,
        );
    };

/*
|--------------------------------------------------------------------------
| Login Routes
|--------------------------------------------------------------------------
*/

export const getLoginRouteForAccount =
    (
        accountType: AuthAccountType,
    ): string => {
        switch (
            accountType
        ) {
            case AUTH_ACCOUNT_TYPES.OWNER:
                return "/owner";

            case AUTH_ACCOUNT_TYPES.ADMIN:
                return "/admin/login";

            case AUTH_ACCOUNT_TYPES.USER:
                return "/customer/login";

            case AUTH_ACCOUNT_TYPES.SELLER:
                return "/seller/login";

            case AUTH_ACCOUNT_TYPES.RIDER:
                return "/rider/login";

            default:
                return "/customer/login";
        }
    };