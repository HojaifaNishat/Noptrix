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

export const getPostAuthRedirect = (
    fallbackRoute: string,
): string => {
    if (typeof window === "undefined") {
        return fallbackRoute;
    }

    const next =
        new URLSearchParams(
            window.location.search,
        ).get("next");

    if (
        !next ||
        !next.startsWith("/jobs/") ||
        next.startsWith("//") ||
        next.includes("\\")
    ) {
        return fallbackRoute;
    }

    const target = new URL(
        next,
        window.location.origin,
    );

    if (
        target.origin !== window.location.origin ||
        !target.pathname.startsWith("/jobs/")
    ) {
        return fallbackRoute;
    }

    return `${target.pathname}${target.search}${target.hash}`;
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