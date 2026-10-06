"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import {
  CheckCircle2,
  Edit3,
  KeyRound,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";

import { permissionsApi } from "@/services/api/permissions.api";

import type { Permission } from "@/types/permission";

export default function OwnerPermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [actionId, setActionId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await permissionsApi.getAll();

      setPermissions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load permissions.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPermissions();
  }, [loadPermissions]);

  const filteredPermissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return permissions;
    }

    return permissions.filter(
      (permission) =>
        permission.resource.toLowerCase().includes(query) ||
        permission.action.toLowerCase().includes(query) ||
        permission.key.toLowerCase().includes(query) ||
        (permission.description ?? "").toLowerCase().includes(query),
    );
  }, [permissions, search]);

  const handleActivate = async (permissionId: string) => {
    try {
      setActionId(permissionId);
      setError(null);

      const updated = await permissionsApi.activate(permissionId);

      setPermissions((current) =>
        current.map((permission) =>
          permission.id === permissionId ? updated : permission,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to activate permission.",
      );
    } finally {
      setActionId(null);
    }
  };

  const handleDeactivate = async (permissionId: string) => {
    try {
      setActionId(permissionId);
      setError(null);

      const updated = await permissionsApi.deactivate(permissionId);

      setPermissions((current) =>
        current.map((permission) =>
          permission.id === permissionId ? updated : permission,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to deactivate permission.",
      );
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (permission: Permission) => {
    if (permission.isSystemPermission) {
      return;
    }

    const confirmed = window.confirm(`Delete permission "${permission.key}"?`);

    if (!confirmed) {
      return;
    }

    try {
      setActionId(permission.id);
      setError(null);

      await permissionsApi.remove(permission.id);

      setPermissions((current) =>
        current.filter((item) => item.id !== permission.id),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete permission.",
      );
    } finally {
      setActionId(null);
    }
  };

  return (
    <main className="min-h-screen p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
              <ShieldCheck className="h-4 w-4" />
              Owner Administration
            </div>

            <h1 className="text-2xl font-bold text-gray-900">Permissions</h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage the permissions available for role assignment.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadPermissions()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <Link
              href="/owner/permissions/new"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              Create Permission
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search resource, action, key..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center text-sm text-gray-500">
              Loading permissions...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Permission
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Resource
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Action
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Type
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredPermissions.map((permission) => {
                    const busy = actionId === permission.id;

                    return (
                      <tr key={permission.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <KeyRound className="h-4 w-4 shrink-0 text-gray-400" />

                            <div>
                              <div className="font-mono text-sm font-semibold text-gray-900">
                                {permission.key}
                              </div>

                              {permission.description && (
                                <div className="mt-1 max-w-md text-xs text-gray-500">
                                  {permission.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-medium capitalize text-gray-700">
                          {permission.resource}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {permission.action}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {permission.isSystemPermission ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                              <CheckCircle2 className="h-3 w-3" />
                              System
                            </span>
                          ) : (
                            <span className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600">
                              Custom
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {permission.status === "ACTIVE" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                              <XCircle className="h-3 w-3" />
                              Inactive
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/owner/permissions/${permission.id}/edit`}
                              title="Edit"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Link>

                            {permission.status === "ACTIVE" ? (
                              <button
                                type="button"
                                title="Deactivate"
                                disabled={busy}
                                onClick={() =>
                                  void handleDeactivate(permission.id)
                                }
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                              >
                                <PowerOff className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                title="Activate"
                                disabled={busy}
                                onClick={() =>
                                  void handleActivate(permission.id)
                                }
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                              >
                                <Power className="h-4 w-4" />
                              </button>
                            )}

                            <button
                              type="button"
                              title={
                                permission.isSystemPermission
                                  ? "System permission"
                                  : "Delete"
                              }
                              disabled={busy || permission.isSystemPermission}
                              onClick={() => void handleDelete(permission)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredPermissions.length === 0 && (
            <div className="border-t border-gray-100 p-10 text-center text-sm text-gray-500">
              No permissions found.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
