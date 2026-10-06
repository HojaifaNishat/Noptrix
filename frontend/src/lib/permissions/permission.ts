import type { AuthUser } from "@/types/auth";

/*
|--------------------------------------------------------------------------
| Permission Constants
|--------------------------------------------------------------------------
*/

export const OWNER_PERMISSION = "*";

export type PermissionLike =
    | string
    | readonly string[]
    | null
    | undefined;

/*
|--------------------------------------------------------------------------
| Normalization
|--------------------------------------------------------------------------
*/

function normalizePermission(
    permission: string,
): string {
    return permission.trim().toLowerCase();
}

function normalizePermissions(
    permissions: readonly string[],
): readonly string[] {
    return permissions
        .filter(
            (permission): permission is string =>
                typeof permission === "string",
        )
        .map(normalizePermission)
        .filter(Boolean);
}

/*
|--------------------------------------------------------------------------
| OWNER
|--------------------------------------------------------------------------
|
| OWNER is never dependent on a seeded permission list.
|
| Any permission introduced later automatically belongs to OWNER.
|
*/

export function isOwner(
    user?: Pick<AuthUser, "accountType"> | null,
): boolean {
    return user?.accountType === "OWNER";
}

/*
|--------------------------------------------------------------------------
| Exact / Wildcard Permission Matching
|--------------------------------------------------------------------------
|
| Supported:
|
| orders.read
| orders.*
| *
|
| A granted resource wildcard also grants all actions under
| that resource.
|
*/

export function permissionMatches(
    grantedPermission: string,
    requiredPermission: string,
): boolean {
    const granted =
        normalizePermission(
            grantedPermission,
        );

    const required =
        normalizePermission(
            requiredPermission,
        );

    if (!granted || !required) {
        return false;
    }

    if (granted === OWNER_PERMISSION) {
        return true;
    }

    if (granted === required) {
        return true;
    }

    if (
        granted.endsWith(".*")
    ) {
        const resource =
            granted.slice(
                0,
                -2,
            );

        return (
            required === resource ||
            required.startsWith(
                `${resource}.`,
            )
        );
    }

    return false;
}

/*
|--------------------------------------------------------------------------
| User Permission Check
|--------------------------------------------------------------------------
*/

export function hasPermission(
    user: Pick<
        AuthUser,
        "accountType" | "permissions"
    > | null | undefined,
    requiredPermission: string,
): boolean {
    if (!user) {
        return false;
    }

    if (isOwner(user)) {
        return true;
    }

    if (
        typeof requiredPermission !==
            "string" ||
        !requiredPermission.trim()
    ) {
        return false;
    }

    const permissions =
        normalizePermissions(
            user.permissions ?? [],
        );

    return permissions.some(
        (grantedPermission) =>
            permissionMatches(
                grantedPermission,
                requiredPermission,
            ),
    );
}

/*
|--------------------------------------------------------------------------
| Multiple Permissions
|--------------------------------------------------------------------------
*/

export function hasAnyPermission(
    user: Pick<
        AuthUser,
        "accountType" | "permissions"
    > | null | undefined,
    requiredPermissions: readonly string[],
): boolean {
    if (!user) {
        return false;
    }

    if (isOwner(user)) {
        return true;
    }

    return requiredPermissions.some(
        (permission) =>
            hasPermission(
                user,
                permission,
            ),
    );
}

export function hasAllPermissions(
    user: Pick<
        AuthUser,
        "accountType" | "permissions"
    > | null | undefined,
    requiredPermissions: readonly string[],
): boolean {
    if (!user) {
        return false;
    }

    if (isOwner(user)) {
        return true;
    }

    return requiredPermissions.every(
        (permission) =>
            hasPermission(
                user,
                permission,
            ),
    );
}

/*
|--------------------------------------------------------------------------
| Permission List Helpers
|--------------------------------------------------------------------------
*/

export function getUserPermissions(
    user:
        | Pick<
              AuthUser,
              "accountType" | "permissions"
          >
        | null
        | undefined,
): readonly string[] {
    if (!user) {
        return [];
    }

    if (isOwner(user)) {
        return [OWNER_PERMISSION];
    }

    return normalizePermissions(
        user.permissions ?? [],
    );
}

export function canAccessPermission(
    user:
        | Pick<
              AuthUser,
              "accountType" | "permissions"
          >
        | null
        | undefined,
    permission?: string,
): boolean {
    if (!permission) {
        return true;
    }

    return hasPermission(
        user,
        permission,
    );
}
