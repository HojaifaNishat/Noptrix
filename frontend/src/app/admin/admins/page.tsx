"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldPlus,
  Users,
  UserRoundCog,
} from "lucide-react";

import { employeesApi } from "@/services/api/employees.api";
import { rolesApi } from "@/services/api/roles.api";
import type { Employee } from "@/features/employees/employee.types";
import type { Role } from "@/types/role";

function isAdministratorRole(role: Role) {
  const slug = role.slug.trim().toLowerCase().replace(/_/g, "-");

  return [
    "admin",
    "administrator",
    "super-admin",
    "super-administrator",
  ].includes(slug);
}

function getEmployeeUser(employee: Employee) {
  return typeof employee.userId === "object" && employee.userId !== null
    ? employee.userId
    : null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to load administrator management data. Please try again.";
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "AD";
}

export default function AdminsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [employeeList, roleList] = await Promise.all([
        employeesApi.getAll(),
        rolesApi.getAll(),
      ]);

      setEmployees(employeeList);
      setRoles(
        roleList.filter(
          (role) => role.status === "ACTIVE" && isAdministratorRole(role),
        ),
      );
    } catch (loadError: unknown) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === "ACTIVE"),
    [employees],
  );

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    return activeEmployees.filter((employee) => {
      const user = getEmployeeUser(employee);
      const name = user?.name ?? "";
      const email = user?.email ?? "";
      const employeeCode = employee.employeeCode ?? "";

      const matchesSearch =
        !query ||
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        employeeCode.toLowerCase().includes(query);

      return matchesSearch;
    });
  }, [activeEmployees, search]);

  const activeRoleCount = roles.length;

  return (
    <main className="min-h-screen bg-slate-50/80 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] space-y-7">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm text-slate-500"
        >
          <Link
            href="/admin"
            className="transition hover:text-blue-700"
          >
            Dashboard
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-slate-800">
            Administer
          </span>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-blue-700">Admins</span>
        </nav>

        {/* Header */}
        <header className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-600/20">
              <ShieldCheck size={28} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Admin Management
                </h1>
                <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Owner access
                </span>
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Prepare administrator accounts by selecting an active
                employee and assigning an available administrator role.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <Link
              href="/admin/invitations"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-indigo-700"
            >
              <ShieldPlus size={18} />
              Admin Invitations
              <ArrowRight size={16} />
            </Link>
          </div>
        </header>

        {/* Summary cards */}
        <section
          aria-label="Administrator management summary"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active employees
                </p>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  {loading ? "—" : activeEmployees.length}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Available for administrator selection
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Users size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Available admin roles
                </p>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  {loading ? "—" : activeRoleCount}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Active administrator roles
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <UserRoundCog size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Account provisioning
                </p>
                <p className="mt-3 text-xl font-black tracking-tight text-slate-950">
                  Invitation-based
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Admin accounts are established through invitations
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <BadgeCheck size={21} />
              </div>
            </div>
          </div>
        </section>

        {/* Security notice */}
        <section className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:p-5">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
            <ShieldCheck size={19} />
          </div>

          <div>
            <h2 className="text-sm font-bold text-blue-950">
              Owner-controlled administrator access
            </h2>
            <p className="mt-1 text-sm leading-6 text-blue-900/75">
              Only the authorized Owner should create or revoke administrator
              invitations. Assign only the role and permissions required for
              the person&apos;s responsibilities.
            </p>
          </div>
        </section>

        {/* Employee table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Eligible employees
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select an employee to begin administrator invitation setup.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative block min-w-0 sm:min-w-[270px]">
                <span className="sr-only">Search employees</span>
                <Search
                  size={17}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, email or ID..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </label>

              <label className="relative block sm:min-w-[190px]">
                <span className="sr-only">Filter by administrator role</span>
                <select
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="ALL">All admin roles</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </label>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              <CircleAlert size={19} className="mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Unable to load data</p>
                <p className="mt-1 leading-6">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadData()}
                  className="mt-3 font-bold underline underline-offset-4"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-5 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <RefreshCw size={22} className="animate-spin" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Loading employee and role information...
              </p>
              <p className="text-xs text-slate-400">
                Please wait while we retrieve the latest data.
              </p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Refresh the page data to continue.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 px-5 py-4 text-xs text-slate-500 sm:px-6">
                <span>
                  Showing{" "}
                  <strong className="text-slate-800">
                    {filteredEmployees.length}
                  </strong>{" "}
                  of{" "}
                  <strong className="text-slate-800">
                    {activeEmployees.length}
                  </strong>{" "}
                  active employees
                </span>
                <span className="hidden items-center gap-1.5 sm:inline-flex">
                  <Activity size={14} className="text-emerald-600" />
                  Live API data
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-y border-slate-100 bg-slate-50/80">
                      <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Employee
                      </th>
                      <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Employee ID
                      </th>
                      <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                      <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Invitation role
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredEmployees.map((employee) => {
                      const user = getEmployeeUser(employee);
                      const name = user?.name || "Unnamed employee";
                      const email = user?.email || "";
                      const roleForLink =
                        selectedRole !== "ALL"
                          ? roles.find((role) => role.id === selectedRole)
                          : roles[0];

                      const invitationHref = roleForLink
                        ? `/admin/invitations?employeeId=${encodeURIComponent(
                            employee._id,
                          )}&roleId=${encodeURIComponent(roleForLink.id)}`
                        : "/admin/invitations";

                      return (
                        <tr
                          key={employee._id}
                          className="transition hover:bg-slate-50/80"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-sm font-extrabold text-blue-800">
                                {getInitials(name)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900">
                                  {name}
                                </p>
                                <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                                  <Mail size={12} />
                                  {email || "Email not available"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-600">
                              {employee.employeeCode || "—"}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                              <CheckCircle2 size={13} />
                              Active employee
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            {roleForLink ? (
                              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <ShieldCheck
                                  size={16}
                                  className="shrink-0 text-indigo-600"
                                />
                                {roleForLink.name}
                              </div>
                            ) : (
                              <span className="text-xs text-amber-700">
                                No active admin role
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <Link
                              href={invitationHref}
                              aria-disabled={!roleForLink}
                              onClick={(event) => {
                                if (!roleForLink) event.preventDefault();
                              }}
                              className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-bold transition ${
                                roleForLink
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "cursor-not-allowed bg-slate-100 text-slate-400"
                              }`}
                            >
                              Invite as admin
                              <ArrowRight size={14} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredEmployees.length === 0 && (
                <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                    <Search size={24} />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900">
                    No matching employees
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    Try a different search term, or check whether active
                    employees are available.
                  </p>
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="mt-4 text-sm font-bold text-blue-700 hover:text-blue-800"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          <footer className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span className="flex items-center gap-2">
              <BriefcaseBusiness size={14} />
              Employee directory
            </span>
            <span className="flex items-center gap-2">
              <Clock3 size={14} />
              Invitation status is managed separately
            </span>
          </footer>
        </section>

        {/* Roles shortcut */}
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <UserRoundCog size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">
                Need to manage administrator roles?
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Review the available roles and manage their configuration
                from the dedicated roles page.
              </p>
            </div>
          </div>

          <Link
            href="/owner/roles"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            Manage roles
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </main>
  );
}