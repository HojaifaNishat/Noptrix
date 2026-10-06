"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import RoleForm from "@/features/roles/role-form";

import { rolesApi } from "@/services/api/roles.api";

import type { Role } from "@/types/role";

export default function OwnerEditRolePage() {
  const params = useParams<{
    roleId: string;
  }>();

  const roleId = params.roleId;

  const [role, setRole] = useState<Role | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRole = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await rolesApi.getById(roleId);

        setRole(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load role.");
      } finally {
        setLoading(false);
      }
    };

    if (roleId) {
      void loadRole();
    }
  }, [roleId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Loading role...
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error ?? "Role not found."}
        </div>
      </div>
    );
  }

  return <RoleForm mode="edit" role={role} />;
}
