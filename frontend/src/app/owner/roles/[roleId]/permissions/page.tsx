"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Check,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

import { permissionsApi } from "@/services/api/permissions.api";

import { rolePermissionsApi } from "@/services/api/role-permissions.api";

import { rolesApi } from "@/services/api/roles.api";

import type { Permission } from "@/types/permission";

import type { Role } from "@/types/role";

interface PermissionGroup {
  readonly resource: string;
  readonly permissions: Permission[];
}

export default function OwnerRolePermissionsPage() {
  const [role, setRole] = useState<Role | null>(null);

  const [permissions, setPermissions] = useState<Permission[]>([]);

  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const [changingId, setChangingId] = useState<string | null>(null);

  const roleId = useParamsSafe();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [loadedRole, loadedPermissions, loadedRelationships] =
        await Promise.all([
          rolesApi.getById(roleId),
          permissionsApi.getAll(),
          rolePermissionsApi.getRolePermissions(roleId),
        ]);

      setRole(loadedRole);

      setPermissions(loadedPermissions);

      const ids = new Set<string>();

      for (const relationship of loadedRelationships) {
        const permission = relationship.permissionId;

        if (typeof permission === "string") {
          ids.add(permission);
        } else {
          ids.add(permission.id);
        }
      }

      setAssignedIds(ids);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load role permissions.",
      );
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredPermissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return permissions;
    }

    return permissions.filter(
      (permission) =>
        permission.resource.toLowerCase().includes(query) ||
        permission.key.toLowerCase().includes(query) ||
        permission.action.toLowerCase().includes(query) ||
        (permission.description ?? "").toLowerCase().includes(query),
    );
  }, [permissions, search]);

  const groups = useMemo(() => {
    const map = new Map<string, Permission[]>();

    for (const permission of filteredPermissions) {
      const existing = map.get(permission.resource) ?? [];

      existing.push(permission);

      map.set(permission.resource, existing);
    }

    return Array.from(map.entries())
      .map(([resource, items]) => ({
        resource,
        permissions: items,
      }))
      .sort((a, b) => a.resource.localeCompare(b.resource));
  }, [filteredPermissions]);

  const assignedCount = assignedIds.size;

  const togglePermission = async (permissionId: string, checked: boolean) => {
    if (!role) {
      return;
    }

    try {
      setChangingId(permissionId);
      setError(null);
      setSuccess(null);

      if (checked) {
        await rolePermissionsApi.assign({
          roleId: role.id,
          permissionId,
        });

        setAssignedIds((current) => {
          const next = new Set(current);

          next.add(permissionId);

          return next;
        });

        setSuccess("Permission assigned successfully.");
      } else {
        await rolePermissionsApi.remove(role.id, permissionId);

        setAssignedIds((current) => {
          const next = new Set(current);

          next.delete(permissionId);

          return next;
        });

        setSuccess("Permission removed successfully.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update permission.",
      );
    } finally {
      setChangingId(null);
    }
  };

  const assignAllVisible = async () => {
    if (!role || filteredPermissions.length === 0) {
      return;
    }

    const missing = filteredPermissions.filter(
      (permission) => !assignedIds.has(permission.id),
    );

    if (missing.length === 0) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await rolePermissionsApi.bulkAssign({
        roleId: role.id,
        permissionIds: missing.map((permission) => permission.id),
      });

      setAssignedIds((current) => {
        const next = new Set(current);

        for (const permission of missing) {
          next.add(permission.id);
        }

        return next;
      });

      setSuccess(`${missing.length} permission(s) assigned successfully.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to assign permissions.",
      );
    } finally {
      setSaving(false);
    }
  };

  const removeAllVisible = async () => {
    if (!role || filteredPermissions.length === 0) {
      return;
    }

    const assigned = filteredPermissions.filter((permission) =>
      assignedIds.has(permission.id),
    );

    if (assigned.length === 0) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await rolePermissionsApi.bulkRemove({
        roleId: role.id,
        permissionIds: assigned.map((permission) => permission.id),
      });

      setAssignedIds((current) => {
        const next = new Set(current);

        for (const permission of assigned) {
          next.delete(permission.id);
        }

        return next;
      });

      setSuccess(`${assigned.length} permission(s) removed successfully.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove permissions.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Loading permission matrix...
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error ?? "Role not found."}
        </div>
      </div>
    );
  }

  const isOwner = role.slug.toLowerCase() === "owner";

  return (
    <main className="min-h-screen p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/owner/roles"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div>
              <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
                <ShieldCheck className="h-4 w-4" />
                Owner Administration
              </div>

              <h1 className="text-2xl font-bold text-gray-900">{role.name}</h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage permissions for this role.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading || saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {isOwner ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-semibold text-amber-900">OWNER role</p>

            <p className="mt-1 text-sm text-amber-800">
              OWNER has automatic A–Z system access. Permission assignments are
              not used for OWNER.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Permission Matrix
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {assignedCount} assigned · {permissions.length} total
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void assignAllVisible()}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Assign Visible
                  </button>

                  <button
                    type="button"
                    onClick={() => void removeAllVisible()}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Remove Visible
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search resource, action, permission key..."
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                />
              </div>
            </div>

            <div className="space-y-5">
              {groups.map((group) => (
                <section
                  key={group.resource}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
                    <h2 className="font-semibold capitalize text-gray-900">
                      {group.resource}
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      {group.permissions.length} permission(s)
                    </p>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {group.permissions.map((permission) => {
                      const assigned = assignedIds.has(permission.id);

                      const changing = changingId === permission.id;

                      return (
                        <div
                          key={permission.id}
                          className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs font-medium text-gray-700">
                                {permission.key}
                              </span>

                              <span className="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-500">
                                {permission.action}
                              </span>
                            </div>

                            {permission.description && (
                              <p className="mt-2 text-sm text-gray-500">
                                {permission.description}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={assigned}
                            onClick={() =>
                              void togglePermission(permission.id, !assigned)
                            }
                            disabled={changing}
                            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              assigned
                                ? "bg-gray-900 text-white hover:bg-gray-800"
                                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {changing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : assigned ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}

                            {assigned ? "Assigned" : "Not Assigned"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            {groups.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
                No permissions found.
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function useParamsSafe(): string {
  const params = requireNextParams();

  return params.roleId;
}

function requireNextParams(): {
  readonly roleId: string;
} {
  if (typeof window === "undefined") {
    return {
      roleId: "",
    };
  }

  const parts = window.location.pathname.split("/").filter(Boolean);

  const index = parts.indexOf("roles");

  if (index === -1 || !parts[index + 1]) {
    return {
      roleId: "",
    };
  }

  return {
    roleId: parts[index + 1],
  };
}
