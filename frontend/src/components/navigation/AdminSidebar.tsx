"use client";

import Link from "next/link";

import { LayoutDashboard, LogOut, Search } from "lucide-react";

import { usePathname, useRouter } from "next/navigation";

import { useEffect, useMemo, useState } from "react";

import {
  ADMIN_DASHBOARD_PATH,
  ADMIN_NAVIGATION_SECTIONS,
  type AdminNavigationItem,
  type AdminNavigationSection,
} from "@/components/navigation/admin-navigation";

import { filterAdminNavigation } from "@/lib/permissions/navigation";

import { adminAuthApi } from "@/services/api/admin-auth.api";

import { ownerAuthApi } from "@/services/api/owner-auth.api";

import { authStorage } from "@/lib/auth/auth-storage";

import { tokenStorage } from "@/lib/auth/token-storage";

import { useAuthStore } from "@/stores/auth.store";

import AdminSidebarHeader from "./AdminSidebarHeader";
import AdminSidebarSearch from "./AdminSidebarSearch";
import AdminSidebarFavorites from "./AdminSidebarFavorites";
import AdminSidebarSection from "./AdminSidebarSection";
import AdminSidebarAccount from "./AdminSidebarAccount";

/*
|--------------------------------------------------------------------------
| Storage Keys
|--------------------------------------------------------------------------
*/

const SIDEBAR_COLLAPSED_KEY = "noptrix-admin-sidebar-collapsed";

const SIDEBAR_SECTIONS_KEY = "noptrix-admin-sidebar-sections";

const SIDEBAR_FAVORITES_KEY = "noptrix-admin-sidebar-favorites";

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function AdminSidebar() {
  const router = useRouter();

  const pathname = usePathname();

  const user = useAuthStore((state) => state.user);

  const clearAuth = useAuthStore((state) => state.clearAuth);

  /*
  |--------------------------------------------------------------------------
  | Account
  |--------------------------------------------------------------------------
  */

  const accountType = user?.accountType;

  const isOwner = accountType === "OWNER";

  const isAdmin = accountType === "ADMIN";

  /*
  |--------------------------------------------------------------------------
  | Panel
  |--------------------------------------------------------------------------
  |
  | OWNER:
  |   Uses the same complete management sidebar.
  |   Only the dashboard destination changes to /owner.
  |
  | ADMIN:
  |   Uses the normal /admin dashboard.
  |
  */

  const isOwnerPanel = isOwner && pathname.startsWith("/owner");

  const dashboardPath = isOwnerPanel
    ? "/owner"
    : ADMIN_DASHBOARD_PATH;

  /*
  |--------------------------------------------------------------------------
  | UI State
  |--------------------------------------------------------------------------
  */

  const [collapsed, setCollapsed] = useState(false);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    {},
  );

  const [favoriteItems, setFavoriteItems] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState("");

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Sidebar Persistence
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);

    if (stored === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_KEY,
      String(collapsed),
    );
  }, [collapsed]);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_SECTIONS_KEY);

    if (!stored) {
      return;
    }

    try {
      const parsed: unknown = JSON.parse(stored);

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOpenSections(parsed as Record<string, boolean>);
      }
    } catch {
      window.localStorage.removeItem(SIDEBAR_SECTIONS_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      SIDEBAR_SECTIONS_KEY,
      JSON.stringify(openSections),
    );
  }, [openSections]);

  useEffect(() => {
    const stored = window.localStorage.getItem(
      SIDEBAR_FAVORITES_KEY,
    );

    if (!stored) {
      return;
    }

    try {
      const parsed: unknown = JSON.parse(stored);

      if (
        Array.isArray(parsed) &&
        parsed.every((value) => typeof value === "string")
      ) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFavoriteItems(parsed);
      }
    } catch {
      window.localStorage.removeItem(SIDEBAR_FAVORITES_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      SIDEBAR_FAVORITES_KEY,
      JSON.stringify(favoriteItems),
    );
  }, [favoriteItems]);

  /*
  |--------------------------------------------------------------------------
  | Permission-Aware Navigation
  |--------------------------------------------------------------------------
  |
  | OWNER:
  |   Full A-Z access.
  |
  | ADMIN:
  |   Only Owner-granted permissions.
  |
  | The existing centralized permission
  | filtering remains the single source
  | of truth.
  |
  */

  const visibleSections = useMemo(
    () =>
      filterAdminNavigation(
        user,
        ADMIN_NAVIGATION_SECTIONS,
      ),
    [user],
  );

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const normalizedSearch = searchQuery
    .trim()
    .toLowerCase();

  /*
  |--------------------------------------------------------------------------
  | Dashboard Duplication Prevention
  |--------------------------------------------------------------------------
  |
  | admin-navigation.ts already contains
  | Command Center > Dashboard.
  |
  | The sidebar renders Dashboard separately
  | so OWNER can use /owner while ADMIN uses /admin.
  |
  | Therefore the navigation-level dashboard item
  | is removed from the rendered sections only.
  |
  */

  const sectionsWithoutDashboard = useMemo(
    () =>
      visibleSections
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) =>
              item.id !== "dashboard" &&
              item.href !== ADMIN_DASHBOARD_PATH,
          ),
        }))
        .filter((section) => section.items.length > 0),
    [visibleSections],
  );

  /*
  |--------------------------------------------------------------------------
  | Search Filtering
  |--------------------------------------------------------------------------
  */

  const filteredSections = useMemo(() => {
    if (!normalizedSearch) {
      return sectionsWithoutDashboard;
    }

    return sectionsWithoutDashboard
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.label
              .toLowerCase()
              .includes(normalizedSearch) ||
            section.label
              .toLowerCase()
              .includes(normalizedSearch),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [
    normalizedSearch,
    sectionsWithoutDashboard,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Visible Items
  |--------------------------------------------------------------------------
  */

  const visibleItems = useMemo(
    () =>
      sectionsWithoutDashboard.flatMap(
        (section) => section.items,
      ),
    [sectionsWithoutDashboard],
  );

  /*
  |--------------------------------------------------------------------------
  | Favorites
  |--------------------------------------------------------------------------
  |
  | Favorites are automatically restricted
  | to currently authorized navigation items.
  |
  */

  const favoriteVisibleItems = useMemo(
    () =>
      favoriteItems
        .map((href) =>
          visibleItems.find(
            (item) => item.href === href,
          ),
        )
        .filter(
          (item): item is AdminNavigationItem =>
            Boolean(item),
        ),
    [favoriteItems, visibleItems],
  );

  /*
  |--------------------------------------------------------------------------
  | Active Route
  |--------------------------------------------------------------------------
  */

  const isItemActive = (href: string): boolean => {
    if (href === ADMIN_DASHBOARD_PATH) {
      return pathname === href;
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  const isDashboardActive =
    pathname === dashboardPath;

  const isSectionActive = (
    section: AdminNavigationSection,
  ): boolean => {
    return section.items.some((item) =>
      isItemActive(item.href),
    );
  };

  const isSectionOpen = (
    sectionId: string,
    active: boolean,
  ): boolean => {
    if (normalizedSearch) {
      return true;
    }

    if (active) {
      return true;
    }

    return openSections[sectionId] ?? false;
  };

  /*
  |--------------------------------------------------------------------------
  | Actions
  |--------------------------------------------------------------------------
  */

  const toggleSection = (sectionId: string) => {
    setOpenSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  };

  const toggleFavorite = (href: string) => {
    setFavoriteItems((current) =>
      current.includes(href)
        ? current.filter(
            (item) => item !== href,
          )
        : [...current, href],
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      if (isOwner) {
        await ownerAuthApi.logout();
      } else if (isAdmin) {
        await adminAuthApi.logout();
      }
    } catch {
      /*
       * Local authentication state
       * must still be cleared even if
       * backend logout fails.
       */
    } finally {
      tokenStorage.clear();

      authStorage.clear();

      clearAuth();

      router.replace(
        isOwner
          ? "/owner/login"
          : "/admin/login",
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <aside
      className={[
        "sticky top-0 flex h-screen min-h-screen shrink-0 flex-col",
        "border-r border-gray-200",
        "bg-white",
        "dark:border-gray-800",
        "dark:bg-black",
        collapsed
          ? "w-[76px]"
          : "w-[280px]",
        "transition-[width]",
        "duration-200",
      ].join(" ")}
    >
      <AdminSidebarHeader
        collapsed={collapsed}
        onToggleCollapsed={() =>
          setCollapsed((value) => !value)
        }
      />

      <AdminSidebarAccount
        collapsed={collapsed}
      />

      <nav
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
        aria-label="Administration navigation"
      >
        {!collapsed && (
          <AdminSidebarSearch
            value={searchQuery}
            onChange={setSearchQuery}
          />
        )}

        <AdminSidebarFavorites
          items={favoriteVisibleItems}
          collapsed={collapsed}
          isItemActive={isItemActive}
          onToggleFavorite={toggleFavorite}
        />

        {/*
        |--------------------------------------------------------------------------
        | Dashboard
        |--------------------------------------------------------------------------
        |
        | OWNER  -> /owner
        | ADMIN  -> /admin
        |
        */}

        <Link
          href={dashboardPath}
          title={
            collapsed
              ? "Dashboard"
              : undefined
          }
          className={[
            "mb-3 flex items-center rounded-lg",
            "text-sm font-medium transition",
            "hover:bg-gray-100 hover:text-gray-900",
            "dark:hover:bg-gray-900",
            collapsed
              ? "justify-center p-3"
              : "gap-3 px-3 py-2.5",
            isDashboardActive
              ? "bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white"
              : "text-gray-700 dark:text-gray-300",
          ].join(" ")}
        >
          <LayoutDashboard
            size={19}
            strokeWidth={1.8}
          />

          {!collapsed && (
            <span>Dashboard</span>
          )}
        </Link>

        <div className="space-y-1">
          {filteredSections.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center dark:border-gray-700">
              <Search
                size={20}
                strokeWidth={1.7}
                className="mx-auto text-gray-400"
              />

              <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                No menu items found
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Try another search.
              </p>
            </div>
          ) : (
            filteredSections.map((section) => {
              const active =
                isSectionActive(section);

              return (
                <AdminSidebarSection
                  key={section.id}
                  section={section}
                  collapsed={collapsed}
                  active={active}
                  open={isSectionOpen(
                    section.id,
                    active,
                  )}
                  favoriteItems={
                    favoriteItems
                  }
                  isItemActive={
                    isItemActive
                  }
                  onToggleSection={
                    toggleSection
                  }
                  onToggleFavorite={
                    toggleFavorite
                  }
                />
              );
            })
          )}
        </div>
      </nav>

      {/*
      |--------------------------------------------------------------------------
      | Bottom Actions
      |--------------------------------------------------------------------------
      |
      | Settings is intentionally NOT rendered here.
      |
      | System Settings already exists inside
      | admin-navigation.ts and is ownerOnly.
      |
      | This prevents duplicate Settings navigation.
      |
      */}

      <div
        className={[
          "shrink-0 border-t border-gray-200",
          "dark:border-gray-800",
          collapsed
            ? "p-3"
            : "p-4",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          title={
            collapsed
              ? "Logout"
              : undefined
          }
          className={[
            "flex w-full items-center rounded-lg",
            "text-sm font-medium",
            "text-red-600 transition",
            "hover:bg-red-50",
            "disabled:cursor-not-allowed",
            "disabled:opacity-50",
            collapsed
              ? "justify-center p-3"
              : "gap-3 px-3 py-2.5",
          ].join(" ")}
        >
          <LogOut
            size={19}
            strokeWidth={1.8}
          />

          {!collapsed && (
            <span>
              {isLoggingOut
                ? "Logging out..."
                : "Logout"}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
