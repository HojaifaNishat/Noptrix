"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Save,
  Clock3,
} from "lucide-react";

import { adminsApi } from "@/services/api/admins.api";
import { permissionsApi } from "@/services/api/permissions.api";
import { rolePermissionsApi } from "@/services/api/role-permissions.api";

import type {
  Admin,
  AdminRole,
  AdminUser,
} from "@/types/admin";

import type { Permission } from "@/types/permission";
import type { RolePermission } from "@/types/role-permission";

function getId(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const item = value as {
      id?: string;
      _id?: string;
    };

    return item.id ?? item._id ?? "";
  }

  return "";
}

function getUser(admin: Admin): AdminUser | null {
  return typeof admin.userId === "object" && admin.userId !== null
    ? admin.userId
    : null;
}

function getRole(admin: Admin): AdminRole | null {
  return typeof admin.roleId === "object" && admin.roleId !== null
    ? admin.roleId
    : null;
}

function getPermissionId(item: RolePermission): string {
  return getId(item.permissionId);
}

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "AD"
  );
}

function getErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function formatDate(value?: string): string {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Never";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusClass(status: string): string {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    case "SUSPENDED":
    case "BLOCKED":
      return "bg-red-50 text-red-700 ring-red-200";

    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [search, setSearch] = useState("");

  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [draftIds, setDraftIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissionLoadFailed, setPermissionLoadFailed] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const [adminList, permissionList] = await Promise.all([
        adminsApi.getAll(),
        permissionsApi.getAll(),
      ]);

      setAdmins(adminList);

      setPermissions(
        permissionList.filter(
          (permission) => permission.status === "ACTIVE",
        ),
      );

      setSelectedAdminId((current) => {
        if (
          current &&
          adminList.some((admin) => getId(admin) === current)
        ) {
          return current;
        }

        return adminList.length ? getId(adminList[0]) : "";
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedAdmin = useMemo(
    () =>
      admins.find(
        (admin) => getId(admin) === selectedAdminId,
      ) ?? null,
    [admins, selectedAdminId],
  );

  const selectedRoleId = selectedAdmin
    ? getId(selectedAdmin.roleId)
    : "";

  const loadRolePermissions = useCallback(
    async (roleId: string) => {
      setAssignedIds([]);
      setDraftIds([]);
      setPermissionLoadFailed(false);
      setNotice("");

      if (!roleId) {
        setPermissionsLoading(false);
        return;
      }

      setPermissionsLoading(true);
      setError("");

      try {
        const relationships =
          await rolePermissionsApi.getRolePermissions(roleId);

        const ids = relationships
          .map(getPermissionId)
          .filter(Boolean);

        setAssignedIds(ids);
        setDraftIds(ids);
      } catch (err: unknown) {
        setPermissionLoadFailed(true);
        setError(getErrorMessage(err));
      } finally {
        setPermissionsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadRolePermissions(selectedRoleId);
  }, [selectedAdminId, selectedRoleId, loadRolePermissions]);

  const filteredAdmins = useMemo(() => {
    const query = search.trim().toLowerCase();

    return admins.filter((admin) => {
      const user = getUser(admin);
      const role = getRole(admin);

      return (
        !query ||
        (user?.name ?? "").toLowerCase().includes(query) ||
        (user?.email ?? "").toLowerCase().includes(query) ||
        (role?.name ?? "").toLowerCase().includes(query) ||
        admin.status.toLowerCase().includes(query)
      );
    });
  }, [admins, search]);

  const permissionGroups = useMemo(() => {
    const groups = new Map<string, Permission[]>();

    for (const permission of permissions) {
      const resource = permission.resource || "other";
      const group = groups.get(resource) ?? [];

      group.push(permission);
      groups.set(resource, group);
    }

    return [...groups.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    );
  }, [permissions]);

  const dirty = useMemo(() => {
    if (assignedIds.length !== draftIds.length) {
      return true;
    }

    const original = new Set(assignedIds);

    return draftIds.some((id) => !original.has(id));
  }, [assignedIds, draftIds]);

  function togglePermission(
    permissionId: string,
    checked: boolean,
  ) {
    setDraftIds((current) => {
      if (checked) {
        return current.includes(permissionId)
          ? current
          : [...current, permissionId];
      }

      return current.filter((id) => id !== permissionId);
    });

    setNotice("");
  }

  function toggleResource(
    resourcePermissions: Permission[],
    checked: boolean,
  ) {
    const resourceIds = resourcePermissions.map(
      (permission) => permission.id,
    );

    setDraftIds((current) => {
      if (checked) {
        return [...new Set([...current, ...resourceIds])];
      }

      return current.filter((id) => !resourceIds.includes(id));
    });

    setNotice("");
  }

  async function savePermissions() {
    if (
      !selectedAdmin ||
      !selectedRoleId ||
      !dirty ||
      saving ||
      permissionsLoading ||
      permissionLoadFailed
    ) {
      return;
    }

    const original = new Set(assignedIds);
    const draft = new Set(draftIds);

    const toAssign = [...draft].filter(
      (id) => !original.has(id),
    );

    const toRemove = [...original].filter(
      (id) => !draft.has(id),
    );

    setSaving(true);
    setError("");
    setNotice("");

    try {
      // Use existing Owner-only APIs. Only changed permissions
      // are sent, avoiding unnecessary duplicate assignments.
      if (toAssign.length > 0) {
        await rolePermissionsApi.bulkAssign({
          roleId: selectedRoleId,
          permissionIds: toAssign,
        });
      }

      if (toRemove.length > 0) {
        await rolePermissionsApi.bulkRemove({
          roleId: selectedRoleId,
          permissionIds: toRemove,
        });
      }

      await loadRolePermissions(selectedRoleId);
      setNotice("Role permissions saved successfully.");
    } catch (err: unknown) {
      setError(getErrorMessage(err));

      // Reload the server state because a bulk operation may
      // have succeeded before a subsequent operation failed.
      await loadRolePermissions(selectedRoleId);
    } finally {
      setSaving(false);
    }
  }

  const activeAdminCount = admins.filter(
    (admin) => admin.status === "ACTIVE",
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
              <ShieldCheck className="h-4 w-4" />
              Administration
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Admin Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              View administrator accounts and manage permissions
              assigned to their roles.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="break-words">{error}</p>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{notice}</p>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total admins
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {loading ? "—" : admins.length}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Administrator accounts registered in the system
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active admins
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {loading ? "—" : activeAdminCount}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Accounts currently marked as active
            </p>
          </div>
        </section>

        <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-bold">Admin list</h2>
              <p className="mt-1 text-sm text-slate-500">
                Select an admin to view their role permissions.
              </p>

              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, email or role..."
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-slate-500">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Loading admins...
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
                <Users className="h-8 w-8 text-slate-300" />
                <p className="mt-3 font-semibold">No admins found</p>
                <p className="mt-1 text-sm text-slate-500">
                  {search
                    ? "Try another search term."
                    : "No admin accounts are available yet."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredAdmins.map((admin) => {
                  const id = getId(admin);
                  const user = getUser(admin);
                  const role = getRole(admin);
                  const isSelected = id === selectedAdminId;
                  const name = user?.name || "Unnamed admin";

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setSelectedAdminId(id);
                        setError("");
                        setNotice("");
                      }}
                      className={`flex w-full items-start gap-3 p-4 text-left transition ${
                        isSelected
                          ? "bg-blue-50/70 ring-1 ring-inset ring-blue-200"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                        {getInitials(name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {name}
                          </p>

                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${statusClass(admin.status)}`}
                          >
                            {admin.status}
                          </span>
                        </div>

                        <p className="mt-1 break-all text-xs text-slate-500">
                          {user?.email || "Email unavailable"}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                            {role?.name || "Role unavailable"}
                          </span>

                          {role?.slug && (
                            <span className="text-xs text-slate-400">
                              {role.slug}
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-xs text-slate-400">
                          Last login: {formatDate(admin.lastLoginAt)}
                        </p>
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-blue-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-bold">
                      Permission assignment
                    </h2>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Configure the selected admin&apos;s role.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void savePermissions()}
                  disabled={
                    !selectedAdmin ||
                    !selectedRoleId ||
                    !dirty ||
                    saving ||
                    permissionsLoading ||
                    permissionLoadFailed
                  }
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? "Saving..." : "Save permissions"}
                </button>
              </div>
            </div>

            {!selectedAdmin ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                <ShieldCheck className="h-10 w-10 text-slate-300" />
                <p className="mt-3 font-semibold">
                  Select an admin
                </p>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Choose an account from the list to manage its role permissions.
                </p>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-semibold">
                    {getUser(selectedAdmin)?.name || "Unnamed admin"}
                  </p>

                  <p className="mt-1 break-all text-xs text-slate-500">
                    {getUser(selectedAdmin)?.email || "Email unavailable"}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold">
                      Role: {getRole(selectedAdmin)?.name || "Unavailable"}
                    </span>

                    <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500">
                      {draftIds.length} permissions selected
                    </span>
                  </div>

                  <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-amber-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    Permissions belong to the role, so changes also affect
                    other admins assigned to this same role.
                  </div>
                </div>

                {permissionsLoading ? (
                  <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-slate-500">
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Loading permissions...
                  </div>
                ) : permissionLoadFailed ? (
                  <div className="p-5">
                    <p className="text-sm text-red-700">
                      Permissions could not be loaded. Refresh the page or
                      select this admin again before making changes.
                    </p>
                  </div>
                ) : permissions.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="font-semibold">No active permissions</p>
                    <p className="mt-1 text-sm text-slate-500">
                      There are no active permissions available to assign.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {permissionGroups.map(([resource, items]) => {
                      const selectedInGroup = items.filter(
                        (item) => draftIds.includes(item.id),
                      ).length;

                      const allSelected =
                        items.length > 0 &&
                        selectedInGroup === items.length;

                      return (
                        <section key={resource} className="p-4 sm:p-5">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="break-words text-sm font-bold capitalize">
                                {resource.replace(/[-_]/g, " ")}
                              </h3>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {selectedInGroup} of {items.length} selected
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                toggleResource(items, !allSelected)
                              }
                              className="shrink-0 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                            >
                              {allSelected ? "Clear all" : "Select all"}
                            </button>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            {items.map((permission) => {
                              const checked = draftIds.includes(
                                permission.id,
                              );

                              return (
                                <label
                                  key={permission.id}
                                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                                    checked
                                      ? "border-blue-200 bg-blue-50/60"
                                      : "border-slate-200 bg-white hover:bg-slate-50"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(event) =>
                                      togglePermission(
                                        permission.id,
                                        event.target.checked,
                                      )
                                    }
                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-blue-600"
                                  />

                                  <span className="min-w-0 flex-1">
                                    <span className="block break-words text-sm font-medium text-slate-800">
                                      {permission.action}
                                    </span>

                                    <span className="mt-1 block break-all text-xs text-slate-500">
                                      {permission.key}
                                    </span>

                                    {permission.description && (
                                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                                        {permission.description}
                                      </span>
                                    )}
                                  </span>

                                  {checked && (
                                    <Check className="h-4 w-4 shrink-0 text-blue-600" />
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-col justify-between gap-3 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                  <div className="text-xs text-slate-500">
                    {dirty
                      ? "You have unsaved permission changes."
                      : "All changes are saved."}
                  </div>

                  <button
                    type="button"
                    onClick={() => setDraftIds(assignedIds)}
                    disabled={!dirty || saving || permissionsLoading}
                    className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Discard changes
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        <footer className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="leading-6">
            Admin invitations are managed separately on the Admin Invitations
            page. This page is for existing admin accounts and role permission
            assignments only.
          </p>
        </footer>
      </div>
    </main>
  );
}
