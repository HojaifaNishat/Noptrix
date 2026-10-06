"use client";

import { useEffect, useState } from "react";

import { ArrowLeft, Save, Shield } from "lucide-react";

import Link from "next/link";

import { rolesApi } from "@/services/api/roles.api";

import type { CreateRoleInput, Role, UpdateRoleInput } from "@/types/role";

interface RoleFormProps {
  readonly mode: "create" | "edit";
  readonly role?: Role;
}

export default function RoleForm({ mode, role }: RoleFormProps) {
  const isEdit = mode === "edit";

  const [name, setName] = useState(role?.name ?? "");

  const [slug, setSlug] = useState(role?.slug ?? "");

  const [description, setDescription] = useState(role?.description ?? "");

  const [hierarchyLevel, setHierarchyLevel] = useState(
    String(role?.hierarchyLevel ?? 500),
  );

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!role) {
      return;
    }

    setName(role.name);
    setSlug(role.slug);
    setDescription(role.description ?? "");
    setHierarchyLevel(String(role.hierarchyLevel));
  }, [role]);

  const handleNameChange = (value: string) => {
    setName(value);

    if (!isEdit) {
      setSlug(
        value
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      );
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const normalizedName = name.trim();

      const normalizedSlug = slug.trim().toLowerCase();

      const normalizedDescription = description.trim();

      const level = Number(hierarchyLevel);

      if (normalizedName.length < 2) {
        throw new Error("Role name must contain at least 2 characters.");
      }

      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
        throw new Error(
          "Slug must use lowercase letters, numbers, and hyphens only.",
        );
      }

      if (!Number.isInteger(level) || level < 0 || level > 1000) {
        throw new Error(
          "Hierarchy level must be an integer between 0 and 1000.",
        );
      }

      if (isEdit && role) {
        const input: UpdateRoleInput = {
          name: normalizedName,
          slug: normalizedSlug,
          description: normalizedDescription || undefined,
          hierarchyLevel: level,
        };

        await rolesApi.update(role.id, input);

        setSuccess("Role updated successfully.");
      } else {
        const input: CreateRoleInput = {
          name: normalizedName,
          slug: normalizedSlug,
          description: normalizedDescription || undefined,
          hierarchyLevel: level,
        };

        const created = await rolesApi.create(input);

        window.location.href = `/owner/roles/${created.id}/edit`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save role.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/owner/roles"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
              <Shield className="h-4 w-4" />
              Owner Administration
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? "Edit Role" : "Create Role"}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Configure the role identity and hierarchy.
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
                htmlFor="role-name"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Role name
              </label>

              <input
                id="role-name"
                value={name}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="e.g. Content Manager"
                maxLength={100}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div>
              <label
                htmlFor="role-slug"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Slug
              </label>

              <input
                id="role-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="content-manager"
                maxLength={100}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />

              <p className="mt-1.5 text-xs text-gray-500">
                Lowercase letters, numbers, and hyphens only.
              </p>
            </div>

            <div>
              <label
                htmlFor="role-description"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Description
              </label>

              <textarea
                id="role-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe what this role is responsible for."
                maxLength={500}
                rows={4}
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />

              <div className="mt-1 text-right text-xs text-gray-400">
                {description.length}/500
              </div>
            </div>

            <div>
              <label
                htmlFor="hierarchy-level"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Hierarchy level
              </label>

              <input
                id="hierarchy-level"
                type="number"
                min={0}
                max={1000}
                step={1}
                value={hierarchyLevel}
                onChange={(event) => setHierarchyLevel(event.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />

              <p className="mt-1.5 text-xs text-gray-500">
                Higher values represent higher authority.
              </p>
            </div>

            {isEdit && role?.isSystemRole && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                This is a system role. Its system status cannot be changed here.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
              <Link
                href="/owner/roles"
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
                    : "Create Role"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
