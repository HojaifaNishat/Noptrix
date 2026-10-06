"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { ArrowLeft, Save, ShieldCheck } from "lucide-react";

import { permissionsApi } from "@/services/api/permissions.api";

import { PERMISSION_ACTIONS, type PermissionAction } from "@/types/permission";

import type {
  CreatePermissionInput,
  Permission,
  UpdatePermissionInput,
} from "@/types/permission";

interface PermissionFormProps {
  readonly mode: "create" | "edit";
  readonly permission?: Permission;
}

const ACTION_OPTIONS = Object.values(PERMISSION_ACTIONS) as PermissionAction[];

export default function PermissionForm({
  mode,
  permission,
}: PermissionFormProps) {
  const isEdit = mode === "edit";

  const [resource, setResource] = useState(permission?.resource ?? "");

  const [action, setAction] = useState<PermissionAction>(
    permission?.action ?? PERMISSION_ACTIONS.READ,
  );

  const [key, setKey] = useState(permission?.key ?? "");

  const [description, setDescription] = useState(permission?.description ?? "");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!permission) {
      return;
    }

    setResource(permission.resource);

    setAction(permission.action);

    setKey(permission.key);

    setDescription(permission.description ?? "");
  }, [permission]);

  const generateKey = (nextResource: string, nextAction: PermissionAction) => {
    const normalizedResource = nextResource
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (!normalizedResource) {
      return "";
    }

    return `${normalizedResource}.${nextAction}`;
  };

  const handleResourceChange = (value: string) => {
    setResource(value);

    if (!isEdit) {
      setKey(generateKey(value, action));
    }
  };

  const handleActionChange = (value: PermissionAction) => {
    setAction(value);

    if (!isEdit) {
      setKey(generateKey(resource, value));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const normalizedResource = resource.trim().toLowerCase();

      const normalizedKey = key.trim().toLowerCase();

      const normalizedDescription = description.trim();

      if (!/^[a-z0-9_-]+$/.test(normalizedResource)) {
        throw new Error(
          "Resource may contain lowercase letters, numbers, underscores, and hyphens only.",
        );
      }

      if (!/^[a-z0-9_-]+\.[a-z]+$/.test(normalizedKey)) {
        throw new Error("Permission key must use the format resource.action.");
      }

      if (isEdit && permission) {
        const input: UpdatePermissionInput = {
          resource: normalizedResource,
          action,
          key: normalizedKey,
          description: normalizedDescription || undefined,
        };

        await permissionsApi.update(permission.id, input);

        setSuccess("Permission updated successfully.");
      } else {
        const input: CreatePermissionInput = {
          resource: normalizedResource,
          action,
          key: normalizedKey,
          description: normalizedDescription || undefined,
          isSystemPermission: false,
        };

        const created = await permissionsApi.create(input);

        window.location.href = `/owner/permissions/${created.id}/edit`;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save permission.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/owner/permissions"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
              <ShieldCheck className="h-4 w-4" />
              Owner Administration
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? "Edit Permission" : "Create Permission"}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Define a permission that can be assigned to roles.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-6">
            <div>
              <label
                htmlFor="permission-resource"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Resource
              </label>

              <input
                id="permission-resource"
                value={resource}
                onChange={(event) => handleResourceChange(event.target.value)}
                placeholder="products"
                maxLength={100}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />

              <p className="mt-1.5 text-xs text-gray-500">
                Example: products, orders, reports.
              </p>
            </div>

            <div>
              <label
                htmlFor="permission-action"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Action
              </label>

              <select
                id="permission-action"
                value={action}
                onChange={(event) =>
                  handleActionChange(event.target.value as PermissionAction)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              >
                {ACTION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="permission-key"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Permission key
              </label>

              <input
                id="permission-key"
                value={key}
                onChange={(event) => setKey(event.target.value)}
                placeholder="products.read"
                maxLength={200}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 font-mono text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />

              <p className="mt-1.5 text-xs text-gray-500">
                This is the exact key checked by the authorization system.
              </p>
            </div>

            <div>
              <label
                htmlFor="permission-description"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Description
              </label>

              <textarea
                id="permission-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe what this permission allows."
                maxLength={500}
                rows={4}
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />

              <div className="mt-1 text-right text-xs text-gray-400">
                {description.length}/500
              </div>
            </div>

            {isEdit && permission?.isSystemPermission && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                This is a system permission. Its system status is protected.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
              <Link
                href="/owner/permissions"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />

                {loading
                  ? "Saving..."
                  : isEdit
                    ? "Save Changes"
                    : "Create Permission"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
