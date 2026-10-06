"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import PermissionForm from "@/features/permissions/permission-form";

import { permissionsApi } from "@/services/api/permissions.api";

import type { Permission } from "@/types/permission";

export default function OwnerEditPermissionPage() {
  const params = useParams<{
    permissionId: string;
  }>();

  const permissionId = params.permissionId;

  const [permission, setPermission] = useState<Permission | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPermission = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await permissionsApi.getById(permissionId);

        setPermission(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load permission.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (permissionId) {
      void loadPermission();
    }
  }, [permissionId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Loading permission...
      </div>
    );
  }

  if (error || !permission) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error ?? "Permission not found."}
        </div>
      </div>
    );
  }

  return <PermissionForm mode="edit" permission={permission} />;
}
