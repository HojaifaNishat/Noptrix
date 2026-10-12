"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Mail, ShieldCheck } from "lucide-react";

import { AdminAuthGuard } from "@/components/common/AdminAuthGuard";
import { employeesApi } from "@/services/api/employees.api";
import { rolesApi } from "@/services/api/roles.api";
import { adminInvitationsApi, type CreatedAdminInvitation } from "@/services/api/admin-invitations.api";
import type { Employee } from "@/features/employees/employee.types";
import type { Role } from "@/types/role";

const isAdminRole = (role: Role) => {
    const slug = role.slug.trim().toLowerCase().replace(/_/g, "-");
    return ["admin", "administrator", "super-admin", "super-administrator"].includes(slug);
};

function AdminInvitationsContent() {
    const searchParams = useSearchParams();
    const requestedEmployeeId = searchParams.get("employeeId") ?? "";
    const requestedRoleId = searchParams.get("roleId") ?? "";

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [employeeId, setEmployeeId] = useState(requestedEmployeeId);
    const [roleId, setRoleId] = useState(requestedRoleId);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [created, setCreated] = useState<CreatedAdminInvitation | null>(null);

    useEffect(() => {
        let active = true;
        Promise.all([employeesApi.getAll(), rolesApi.getAll()])
            .then(([employeeList, roleList]) => {
                if (!active) return;
                setEmployees(employeeList.filter((employee) => employee.status === "ACTIVE"));
                setRoles(roleList.filter((role) => role.status === "ACTIVE" && isAdminRole(role)));
            })
            .catch((loadError: unknown) => {
                if (active) {
                    setError(loadError instanceof Error ? loadError.message : "Could not load employees and roles.");
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const selectedEmployee = useMemo(
        () => employees.find((employee) => employee._id === employeeId),
        [employees, employeeId],
    );
    const selectedRole = useMemo(
        () => roles.find((role) => role.id === roleId),
        [roles, roleId],
    );
    const selectedUser =
        selectedEmployee && typeof selectedEmployee.userId === "object"
            ? selectedEmployee.userId
            : null;

    const sendInvitation = async () => {
        if (!employeeId || !roleId) {
            setError("Select an employee and administrator role.");
            return;
        }
        setSubmitting(true);
        setError("");
        setCreated(null);
        try {
            const result = await adminInvitationsApi.create({ employeeId, roleId });
            setCreated(result);
        } catch (sendError) {
            setError(sendError instanceof Error ? sendError.message : "Could not send the admin invitation.");
        } finally {
            setSubmitting(false);
        }
    };

    const invitationUrl = created
        ? `${window.location.origin}/admin-invitation/${created.token}`
        : "";

    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
            <div className="mx-auto max-w-3xl space-y-6">
                <header className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                        <ShieldCheck size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-950">Admin Invitations</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Invite a promoted employee to set up their administrator account.
                        </p>
                    </div>
                </header>

                {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        {error}
                    </div>
                )}

                {created ? (
                    <section className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3 text-emerald-700">
                            <CheckCircle2 size={22} />
                            <h2 className="text-lg font-semibold">Invitation sent</h2>
                        </div>
                        <p className="text-sm text-slate-600">
                            An account setup link was sent to <strong>{created.email}</strong> for the{" "}
                            <strong>{created.roleName}</strong> role.
                        </p>
                        <input
                            readOnly
                            value={invitationUrl}
                            aria-label="Admin invitation link"
                            className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                void navigator.clipboard.writeText(invitationUrl).catch(() => {
                                    setError("Could not copy the invitation link.");
                                });
                            }}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Copy invitation link
                        </button>
                    </section>
                ) : (
                    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        {loading ? (
                            <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
                                <Loader2 size={18} className="animate-spin" /> Loading employees and roles...
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label htmlFor="employee" className="mb-2 block text-sm font-semibold text-slate-700">
                                        Employee
                                    </label>
                                    <select
                                        id="employee"
                                        value={employeeId}
                                        onChange={(event) => setEmployeeId(event.target.value)}
                                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                                    >
                                        <option value="">Select an active employee</option>
                                        {employees.map((employee) => {
                                            const user = typeof employee.userId === "object" ? employee.userId : null;
                                            return (
                                                <option key={employee._id} value={employee._id}>
                                                    {user?.name ?? employee.employeeCode} {user?.email ? `(${user.email})` : ""}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    {selectedEmployee && (
                                        <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                            <Mail size={14} />
                                            {selectedUser?.email ?? "Employee email not available"}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="role" className="mb-2 block text-sm font-semibold text-slate-700">
                                        Administrator role
                                    </label>
                                    <select
                                        id="role"
                                        value={roleId}
                                        onChange={(event) => setRoleId(event.target.value)}
                                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                                    >
                                        <option value="">Select a role</option>
                                        {roles.map((role) => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </select>
                                    {selectedRole && (
                                        <p className="mt-2 text-xs text-slate-500">{selectedRole.description}</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => void sendInvitation()}
                                    disabled={loading || submitting || !employeeId || !roleId}
                                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting ? <Loader2 size={17} className="animate-spin" /> : <Mail size={17} />}
                                    {submitting ? "Sending..." : "Send admin invitation"}
                                </button>
                            </>
                        )}
                    </section>
                )}
            </div>
        </main>
    );
}

export default function AdminInvitationsPage() {
    return (
        <AdminAuthGuard>
            <AdminInvitationsContent />
        </AdminAuthGuard>
    );
}
