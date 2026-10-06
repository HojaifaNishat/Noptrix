"use client";

import { useEffect, type ReactNode } from "react";

import { usePathname, useRouter } from "next/navigation";

import { useAuthStore } from "@/stores/auth.store";

import { getLoginRouteForAccount } from "@/lib/auth/auth-redirect";

import {
  canAccessAdminRoute,
  type RoutePermissionRule,
} from "@/lib/permissions/route-permission";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const ADMIN_LOGIN_ROUTE = "/admin/login";

const OWNER_SECRET_ROUTE = "/owner/verify-secret";

const ADMIN_DASHBOARD_ROUTE = "/admin";

const ADMIN_FORBIDDEN_ROUTE = "/admin/forbidden";

/*
|--------------------------------------------------------------------------
| Props
|--------------------------------------------------------------------------
*/

interface AdminAuthGuardProps {
  children: ReactNode;

  permissionRules?: readonly RoutePermissionRule[];
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export function AdminAuthGuard({
  children,
  permissionRules = [],
}: AdminAuthGuardProps) {
  const router = useRouter();

  const pathname = usePathname();

  const user = useAuthStore((state) => state.user);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const isLoading = useAuthStore((state) => state.isLoading);

  /*
    |--------------------------------------------------------------------------
    | Authentication + Authorization
    |--------------------------------------------------------------------------
    */

  useEffect(() => {
    if (isLoading) {
      return;
    }

    /*
        |--------------------------------------------------------------------------
        | Not Authenticated
        |--------------------------------------------------------------------------
        */

    if (!isAuthenticated || !user) {
      router.replace(ADMIN_LOGIN_ROUTE);

      return;
    }

    /*
        |--------------------------------------------------------------------------
        | Account Type
        |--------------------------------------------------------------------------
        */

    if (user.accountType !== "OWNER" && user.accountType !== "ADMIN") {
      router.replace(getLoginRouteForAccount(user.accountType));

      return;
    }

    /*
        |--------------------------------------------------------------------------
        | OWNER Secret Verification
        |--------------------------------------------------------------------------
        */

    if (user.accountType === "OWNER" && user.secretVerified !== true) {
      router.replace(OWNER_SECRET_ROUTE);

      return;
    }

    /*
        |--------------------------------------------------------------------------
        | Forbidden Page
        |--------------------------------------------------------------------------
        |
        | Do not redirect the forbidden page itself.
        | Otherwise it would create a redirect loop.
        |
        */

    if (pathname === ADMIN_FORBIDDEN_ROUTE) {
      return;
    }

    /*
        |--------------------------------------------------------------------------
        | Permission Route Guard
        |--------------------------------------------------------------------------
        */

    if (!canAccessAdminRoute(user, pathname, permissionRules)) {
      router.replace(ADMIN_FORBIDDEN_ROUTE);
    }
  }, [isAuthenticated, isLoading, pathname, permissionRules, router, user]);

  /*
    |--------------------------------------------------------------------------
    | Loading
    |--------------------------------------------------------------------------
    */

  if (isLoading || !isAuthenticated || !user) {
    return null;
  }

  /*
    |--------------------------------------------------------------------------
    | Account Type Guard
    |--------------------------------------------------------------------------
    */

  if (user.accountType !== "OWNER" && user.accountType !== "ADMIN") {
    return null;
  }

  /*
    |--------------------------------------------------------------------------
    | OWNER Secret Guard
    |--------------------------------------------------------------------------
    */

  if (user.accountType === "OWNER" && user.secretVerified !== true) {
    return null;
  }

  /*
    |--------------------------------------------------------------------------
    | Forbidden Page
    |--------------------------------------------------------------------------
    */

  if (pathname === ADMIN_FORBIDDEN_ROUTE) {
    return children;
  }

  /*
    |--------------------------------------------------------------------------
    | Permission Guard
    |--------------------------------------------------------------------------
    */

  if (!canAccessAdminRoute(user, pathname, permissionRules)) {
    return null;
  }

  /*
    |--------------------------------------------------------------------------
    | Authorized
    |--------------------------------------------------------------------------
    */

  return children;
}
