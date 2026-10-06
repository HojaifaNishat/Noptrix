import type { AuthUser } from "@/types/auth";

import {
  ADMIN_NAVIGATION_SECTIONS,
  type AdminNavigationSection,
} from "@/components/navigation/admin-navigation";

import { hasPermission } from "./permission";

/*
|--------------------------------------------------------------------------
| Route Permission Rule
|--------------------------------------------------------------------------
*/

export interface RoutePermissionRule {
  readonly path: string;
  readonly permission?: string;
  readonly ownerOnly?: boolean;
}

/*
|--------------------------------------------------------------------------
| Path Matching
|--------------------------------------------------------------------------
*/

function matchesPath(pathname: string, route: string): boolean {
  if (route === "/") {
    return pathname === "/";
  }

  return pathname === route || pathname.startsWith(`${route}/`);
}

/*
|--------------------------------------------------------------------------
| Build Rules From Navigation
|--------------------------------------------------------------------------
|
| Navigation is the single source of truth.
|
| Example:
|
| products.read
|      ↓
| /admin/products
|
| products.read
|      ↓
| /admin/products/123
|
| Owner-only navigation automatically becomes
| owner-only route protection.
|
*/

export function buildAdminRoutePermissionRules(
  sections: readonly AdminNavigationSection[] = ADMIN_NAVIGATION_SECTIONS,
): RoutePermissionRule[] {
  const rules: RoutePermissionRule[] = [];

  for (const section of sections) {
    for (const item of section.items) {
      rules.push({
        path: item.href,
        permission: item.permission,
        ownerOnly: section.ownerOnly === true || item.ownerOnly === true,
      });
    }
  }

  /*
   * /admin/settings is currently rendered directly
   * by AdminSidebar instead of the navigation registry.
   *
   * Keep it Owner-only so the sidebar and direct URL
   * protection follow the same security policy.
   */
  rules.push({
    path: "/admin/settings",
    ownerOnly: true,
  });

  /*
   * Remove duplicate routes while preserving the
   * strongest protection for duplicate entries.
   */
  const ruleMap = new Map<string, RoutePermissionRule>();

  for (const rule of rules) {
    const existing = ruleMap.get(rule.path);

    if (!existing) {
      ruleMap.set(rule.path, rule);

      continue;
    }

    ruleMap.set(rule.path, {
      path: rule.path,
      permission: rule.permission ?? existing.permission,
      ownerOnly: existing.ownerOnly === true || rule.ownerOnly === true,
    });
  }

  return Array.from(ruleMap.values());
}

/*
|--------------------------------------------------------------------------
| Default Admin Route Rules
|--------------------------------------------------------------------------
*/

export const ADMIN_ROUTE_PERMISSION_RULES = buildAdminRoutePermissionRules();

/*
|--------------------------------------------------------------------------
| Route Access
|--------------------------------------------------------------------------
*/

export function canAccessAdminRoute(
  user: AuthUser | null | undefined,
  pathname: string,
  rules: readonly RoutePermissionRule[] = ADMIN_ROUTE_PERMISSION_RULES,
): boolean {
  if (!user) {
    return false;
  }

  /*
    |--------------------------------------------------------------------------
    | OWNER
    |--------------------------------------------------------------------------
    |
    | OWNER has unrestricted A-Z access.
    | No permission seed or frontend permission
    | list can restrict the OWNER.
    |
    */

  if (user.accountType === "OWNER") {
    return true;
  }

  /*
    |--------------------------------------------------------------------------
    | Account Type
    |--------------------------------------------------------------------------
    */

  if (user.accountType !== "ADMIN") {
    return false;
  }

  /*
    |--------------------------------------------------------------------------
    | Find Matching Routes
    |--------------------------------------------------------------------------
    */

  const matchingRules = rules.filter((rule) =>
    matchesPath(pathname, rule.path),
  );

  /*
    |--------------------------------------------------------------------------
    | Unregistered Route
    |--------------------------------------------------------------------------
    |
    | /admin itself remains available to an
    | authenticated ADMIN.
    |
    | Any other route without a registered
    | navigation rule is denied.
    |
    */

  if (!matchingRules.length) {
    return pathname === "/admin";
  }

  /*
    |--------------------------------------------------------------------------
    | Permission Check
    |--------------------------------------------------------------------------
    */

  return matchingRules.some((rule) => {
    /*
     * Owner-only routes can never be
     * accessed by a normal ADMIN.
     */
    if (rule.ownerOnly) {
      return false;
    }

    /*
     * No permission means the route is
     * authenticated-admin accessible.
     */
    if (!rule.permission) {
      return true;
    }

    return hasPermission(user, rule.permission);
  });
}
