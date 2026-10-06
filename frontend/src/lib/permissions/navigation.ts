import type {
  AdminNavigationItem,
  AdminNavigationSection,
} from "@/components/navigation/admin-navigation";

import type { AuthUser } from "@/types/auth";

import { hasPermission, isOwner } from "./permission";

/*
|--------------------------------------------------------------------------
| Navigation Permission
|--------------------------------------------------------------------------
*/

export const canViewNavigationItem = (
  user: AuthUser | null,
  item: AdminNavigationItem,
): boolean => {
  /*
   * OWNER has unrestricted A-Z access.
   */
  if (isOwner(user)) {
    return true;
  }

  /*
   * Owner-only items are hidden from
   * every non-owner account.
   */
  if (item.ownerOnly) {
    return false;
  }

  /*
   * Items without a permission requirement
   * remain available to authenticated admins.
   */
  if (!item.permission) {
    return true;
  }

  /*
   * Non-owner accounts must have the
   * exact permission or supported wildcard.
   */
  return hasPermission(user, item.permission);
};

/*
|--------------------------------------------------------------------------
| Navigation Section
|--------------------------------------------------------------------------
*/

export const canViewNavigationSection = (
  user: AuthUser | null,
  section: AdminNavigationSection,
): boolean => {
  /*
   * OWNER can see every section.
   */
  if (isOwner(user)) {
    return true;
  }

  /*
   * Explicit owner-only sections are unavailable
   * to non-owner accounts.
   */
  if (section.ownerOnly) {
    return false;
  }

  /*
   * A section is visible only when at least
   * one child item is visible.
   */
  return section.items.some((item) => canViewNavigationItem(user, item));
};

/*
|--------------------------------------------------------------------------
| Filter Navigation
|--------------------------------------------------------------------------
|
| Returns a completely permission-filtered
| immutable navigation tree.
|
*/

export const filterAdminNavigation = (
  user: AuthUser | null,
  sections: readonly AdminNavigationSection[],
): AdminNavigationSection[] => {
  return sections.reduce<AdminNavigationSection[]>((result, section) => {
    if (!canViewNavigationSection(user, section)) {
      return result;
    }

    const visibleItems = section.items.filter((item) =>
      canViewNavigationItem(user, item),
    );

    if (visibleItems.length === 0) {
      return result;
    }

    result.push({
      ...section,
      items: visibleItems,
    });

    return result;
  }, []);
};

/*
|--------------------------------------------------------------------------
| Find Navigation Item
|--------------------------------------------------------------------------
*/

export const findVisibleNavigationItem = (
  user: AuthUser | null,
  sections: readonly AdminNavigationSection[],
  pathname: string,
): AdminNavigationItem | null => {
  const visibleSections = filterAdminNavigation(user, sections);

  for (const section of visibleSections) {
    const item = section.items.find(
      (navigationItem) =>
        navigationItem.href === pathname ||
        pathname.startsWith(`${navigationItem.href}/`),
    );

    if (item) {
      return item;
    }
  }

  return null;
};

/*
|--------------------------------------------------------------------------
| Check Navigation Access
|--------------------------------------------------------------------------
*/

export const canAccessNavigationPath = (
  user: AuthUser | null,
  sections: readonly AdminNavigationSection[],
  pathname: string,
): boolean => {
  /*
   * OWNER has unrestricted navigation access.
   */
  if (isOwner(user)) {
    return true;
  }

  /*
   * Dashboard remains the authenticated
   * admin landing page.
   */
  if (pathname === "/admin") {
    return true;
  }

  return Boolean(findVisibleNavigationItem(user, sections, pathname));
};
