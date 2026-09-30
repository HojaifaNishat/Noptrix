import {
    AUTH_ACCOUNT_TYPES,
    type AuthAccountType,
} from "@/types/auth";

import {
    ROUTES,
} from "@/constants/routes";

/*
|--------------------------------------------------------------------------
| Protected Route Groups
|--------------------------------------------------------------------------
*/

export const ACCOUNT_ROUTE_ACCESS: Record<
    AuthAccountType,
    readonly string[]
> = {
    [AUTH_ACCOUNT_TYPES.OWNER]: [
        ROUTES.ADMIN_PANEL,
    ],

    [AUTH_ACCOUNT_TYPES.ADMIN]: [
        ROUTES.ADMIN_PANEL,
    ],

    [AUTH_ACCOUNT_TYPES.USER]: [
        ROUTES.CUSTOMER_ACCOUNT,
    ],

    [AUTH_ACCOUNT_TYPES.SELLER]: [
        ROUTES.SELLER_PANEL,
    ],

    [AUTH_ACCOUNT_TYPES.RIDER]: [
        ROUTES.RIDER_PANEL,
    ],
};

/*
|--------------------------------------------------------------------------
| Path Matching
|--------------------------------------------------------------------------
*/

const matchesPath = (
    pathname: string,
    route: string,
): boolean => {
    return (
        pathname === route ||
        pathname.startsWith(
            `${route}/`,
        )
    );
};

/*
|--------------------------------------------------------------------------
| Protected Route Detection
|--------------------------------------------------------------------------
*/

export const isProtectedRoute = (
    pathname: string,
): boolean => {
    return Object.values(
        ACCOUNT_ROUTE_ACCESS,
    ).some((routes) =>
        routes.some((route) =>
            matchesPath(
                pathname,
                route,
            ),
        ),
    );
};

/*
|--------------------------------------------------------------------------
| Account Access
|--------------------------------------------------------------------------
*/

export const canAccessRoute = (
    accountType: AuthAccountType,
    pathname: string,
): boolean => {
    const allowedRoutes =
        ACCOUNT_ROUTE_ACCESS[
            accountType
        ];

    if (!allowedRoutes) {
        return false;
    }

    return allowedRoutes.some(
        (route) =>
            matchesPath(
                pathname,
                route,
            ),
    );
};