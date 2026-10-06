"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import {
  Plus,
  Shield,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  KeyRound,
  Search,
  RefreshCw,
} from "lucide-react";

import { rolesApi } from "@/services/api/roles.api";

import type { Role } from "@/types/role";

export default function OwnerRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [actionId, setActionId] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await rolesApi.getAll();

      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load roles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return roles;
    }

    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(query) ||
        role.slug.toLowerCase().includes(query) ||
        (role.description ?? "").toLowerCase().includes(query),
    );
  }, [roles, search]);

  const isOwnerRole = (role: Role) => role.slug === "owner";

  const handleActivate = async (role: Role) => {
    try {
      setActionId(role.id);

      const updated = await rolesApi.activate(role.id);

      setRoles((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate role.");
    } finally {
      setActionId(null);
    }
  };

  const handleDeactivate = async (role: Role) => {
    if (isOwnerRole(role)) {
      return;
    }

    try {
      setActionId(role.id);

      const updated = await rolesApi.deactivate(role.id);

      setRoles((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to deactivate role.",
      );
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (role: Role) => {
    if (role.isSystemRole) {
      return;
    }

    const confirmed = window.confirm(`Delete role "${role.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      setActionId(role.id);

      await rolesApi.remove(role.id);

      setRoles((current) => current.filter((item) => item.id !== role.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete role.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <main className="min-h-screen p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <Shield className="h-4 w-4" />
              Owner Administration
            </div>

            <h1 className="text-2xl font-bold text-gray-900">Roles</h1>

            <p className="mt-1 text-sm text-gray-500">
              Create roles and control their permissions.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadRoles()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            <Link
              href="/owner/roles/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              Create Role
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search roles..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
            />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <Shield className="mb-3 h-10 w-10 text-gray-300" />

              <h2 className="text-sm font-semibold text-gray-900">
                No roles found
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {search
                  ? "Try a different search."
                  : "Create your first custom role."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Role
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Type
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Hierarchy
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
                  {filteredRoles.map((role) => {
                    const owner = isOwnerRole(role);

                    const busy = actionId === role.id;

                    return (
                      <tr key={role.id} className="transition hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                              <Shield className="h-5 w-5 text-gray-600" />
                            </div>

                            <div className="min-w-0">
                              <div className="font-medium text-gray-900">
                                {role.name}
                              </div>

                              <div className="truncate text-xs text-gray-500">
                                {role.slug}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {role.isSystemRole ? "System" : "Custom"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-700">
                          {role.hierarchyLevel}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              role.status === "ACTIVE"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {role.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {!owner && (
                              <Link
                                href={`/owner/roles/${role.id}/permissions`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                                Permissions
                              </Link>
                            )}

                            <Link
                              href={`/owner/roles/${role.id}/edit`}
                              className="inline-flex items-center justify-center rounded-lg border border-gray-300 p-2 text-gray-600 transition hover:bg-gray-100"
                              title="Edit role"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>

                            {role.status === "ACTIVE" ? (
                              <button
                                type="button"
                                disabled={busy || owner}
                                onClick={() => void handleDeactivate(role)}
                                className="inline-flex items-center justify-center rounded-lg border border-gray-300 p-2 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Deactivate role"
                              >
                                <PowerOff className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleActivate(role)}
                                className="inline-flex items-center justify-center rounded-lg border border-gray-300 p-2 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Activate role"
                              >
                                <Power className="h-4 w-4" />
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={busy || role.isSystemRole}
                              onClick={() => void handleDelete(role)}
                              className="inline-flex items-center justify-center rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                              title="Delete role"
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
        </div>
      </div>
    </main>
  );
}
