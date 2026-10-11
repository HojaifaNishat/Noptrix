"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, RefreshCw, ShieldCheck } from "lucide-react";

import { rolesApi } from "@/services/api/roles.api";
import type { Role } from "@/types/role";

export default function OwnerRolePermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    return rolesApi.getAll();
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setRoles(await fetchRoles());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load roles.",
      );
    } finally {
      setLoading(false);
    }
  }, [fetchRoles]);

  useEffect(() => {
    let active = true;

    void fetchRoles()
      .then((loadedRoles) => {
        if (active) {
          setRoles(loadedRoles);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load roles.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [fetchRoles]);

  const assignableRoles = roles.filter(
    (role) => role.slug.trim().toLowerCase() !== "owner",
  );

  return (
    <main className="min-h-screen p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <ShieldCheck className="h-4 w-4" />
              Owner Administration
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Role Permissions
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Select a role to view and manage its permissions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadRoles()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-48 items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : assignableRoles.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
              <KeyRound className="mb-3 h-9 w-9 text-gray-300" />
              <h2 className="text-sm font-semibold text-gray-900">
                No assignable roles
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Create a role before managing its permissions.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {assignableRoles.map((role) => (
                <li
                  key={role.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <h2 className="font-medium text-gray-900">{role.name}</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {role.slug} · {role.status.toLowerCase()}
                    </p>
                  </div>

                  <Link
                    href={`/owner/roles/${role.id}/permissions`}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <KeyRound className="h-4 w-4" />
                    Manage permissions
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
