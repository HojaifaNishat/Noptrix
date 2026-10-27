"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    AlertCircle,
    Check,
    CheckCircle2,
    Clipboard,
    Loader2,
    Mail,
    ShieldCheck,
} from "lucide-react";

import { AdminAuthGuard } from "@/components/common/AdminAuthGuard";
import { employeesApi } from "@/services/api/employees.api";
import { rolesApi } from "@/services/api/roles.api";
import {
    adminInvitationsApi,
    type CreatedAdminInvitation,
} from "@/services/api/admin-invitations.api";
import type { Employee } from "@/features/employees/employee.types";
import type { Role } from "@/types/role";

const isAdminRole = (role: Role): boolean => {
    const slug = role.slug.trim().toLowerCase().replace(/_/g, "-");

    return [
        "admin",
        "administrator",
        "super-admin",
        "super-administrator",
    ].includes(slug);
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
    const [copying, setCopying] = useState(false);

    const [error, setError] = useState("");
    const [created, setCreated] =
        useState<CreatedAdminInvitation | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let active = true;

        const loadData = async () => {
            setLoading(true);
            setError("");

            try {
                const [employeeList, roleList] = await Promise.all([
                    employeesApi.getAll(),
                    rolesApi.getAll(),
                ]);

                if (!active) return;

                const activeEmployees = employeeList.filter(
                    (employee) => employee.status === "ACTIVE",
                );

                const activeAdminRoles = roleList.filter(
                    (role) =>
                        role.status === "ACTIVE" && isAdminRole(role),
                );

                setEmployees(activeEmployees);
                setRoles(activeAdminRoles);

                // Keep query-string selections only when they are valid.
                setEmployeeId((current) =>
                    activeEmployees.some(
                        (employee) => employee._id === current,
                    )
                        ? current
                        : "",
                );

                setRoleId((current) =>
                    activeAdminRoles.some((role) => role.id === current)
                        ? current
                        : "",
                );
            } catch (loadError: unknown) {
                if (!active) return;

                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : "Could not load employees and admin roles.",
                );
            } finally {
                if (active) setLoading(false);
            }
        };

        void loadData();

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
        selectedEmployee &&
        typeof selectedEmployee.userId === "object"
            ? selectedEmployee.userId
            : null;

    const invitationUrl = created
        ? `${window.location.origin}/admin-invitation/${created.token}`
        : "";

    const sendInvitation = useCallback(async () => {
        setError("");
        setCopied(false);

        if (!employeeId || !roleId) {
            setError("Select an employee and an administrator role.");
            return;
        }

        if (!selectedEmployee || !selectedRole) {
            setError(
                "The selected employee or role is no longer available. Refresh the page and try again.",
            );
            return;
        }

        setSubmitting(true);
        setCreated(null);

        try {
            const result = await adminInvitationsApi.create({
                employeeId,
                roleId,
            });

            setCreated(result);
        } catch (sendError: unknown) {
            setError(
                sendError instanceof Error
                    ? sendError.message
                    : "Could not create the admin invitation.",
            );
        } finally {
            setSubmitting(false);
        }
    }, [employeeId, roleId, selectedEmployee, selectedRole]);

    const copyInvitationLink = useCallback(async () => {
        if (!invitationUrl) return;

        setCopying(true);
        setError("");
        setCopied(false);

        try {
            if (!navigator.clipboard?.writeText) {
                throw new Error(
                    "Clipboard access is unavailable. Copy the link from the text field instead.",
                );
            }

            await navigator.clipboard.writeText(invitationUrl);
            setCopied(true);
        } catch (copyError: unknown) {
            setError(
                copyError instanceof Error
                    ? copyError.message
                    : "Could not copy the invitation link.",
            );
        } finally {
            setCopying(false);
        }
    }, [invitationUrl]);

    const startAnotherInvitation = () => {
        setCreated(null);
        setCopied(false);
        setError("");
    };

    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
            <div className="mx-auto max-w-3xl space-y-6">
                <header className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                        <ShieldCheck size={22} />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-950">
                            Admin Invitations
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Invite an eligible employee to set up their
                            administrator account.
                        </p>
                    </div>
                </header>

                {error && (
                    <div
                        role="alert"
                        className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                        <AlertCircle
                            size={18}
                            className="mt-0.5 shrink-0"
                        />
                        <p>{error}</p>
                    </div>
                )}

                {created ? (
                    <section className="space-y-5 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3 text-emerald-700">
                            <CheckCircle2 size={23} />
                            <h2 className="text-lg font-semibold">
                                Invitation created
                            </h2>
                        </div>

                        <p className="text-sm leading-6 text-slate-600">
                            The invitation was created for{" "}
                            <strong className="text-slate-900">
                                {created.email}
                            </strong>{" "}
                            with the{" "}
                            <strong className="text-slate-900">
                                {created.roleName}
                            </strong>{" "}
                            role.
                        </p>

                        <div className="space-y-2">
                            <label
                                htmlFor="invitation-link"
                                className="block text-sm font-semibold text-slate-700"
                            >
                                Invitation link
                            </label>

                            <input
                                id="invitation-link"
                                readOnly
                                value={invitationUrl}
                                onFocus={(event) => event.currentTarget.select()}
                                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                            />
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => void copyInvitationLink()}
                                disabled={copying}
                                className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {copying ? (
                                    <Loader2
                                        size={17}
                                        className="animate-spin"
                                    />
                                ) : copied ? (
                                    <Check size={17} />
                                ) : (
                                    <Clipboard size={17} />
                                )}
                                {copying
                                    ? "Copying..."
                                    : copied
                                      ? "Copied"
                                      : "Copy invitation link"}
                            </button>

                            <button
                                type="button"
                                onClick={startAnotherInvitation}
                                className="inline-flex h-11 items-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Create another invitation
                            </button>
                        </div>

                        <p className="text-xs leading-5 text-slate-500">
                            Treat this link as sensitive. Share it only with
                            the intended recipient. The recipient must use
                            the invitation flow configured by your backend.
                        </p>
                    </section>
                ) : (
                    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        {loading ? (
                            <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
                                <Loader2
                                    size={18}
                                    className="animate-spin"
                                />
                                Loading employees and roles...
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label
                                        htmlFor="employee"
                                        className="block text-sm font-semibold text-slate-700"
                                    >
                                        Employee
                                    </label>

                                    <select
                                        id="employee"
                                        value={employeeId}
                                        onChange={(event) =>
                                            setEmployeeId(event.target.value)
                                        }
                                        disabled={submitting}
                                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                                    >
                                        <option value="">
                                            Select an active employee
                                        </option>

                                        {employees.map((employee) => {
                                            const user =
                                                typeof employee.userId ===
                                                "object"
                                                    ? employee.userId
                                                    : null;

                                            return (
                                                <option
                                                    key={employee._id}
                                                    value={employee._id}
                                                >
                                                    {user?.name ??
                                                        employee.employeeCode}
                                                    {user?.email
                                                        ? ` (${user.email})`
                                                        : ""}
                                                </option>
                                            );
                                        })}
                                    </select>

                                    {selectedEmployee && (
                                        <p className="flex items-center gap-2 text-xs text-slate-500">
                                            <Mail size={14} />
                                            {selectedUser?.email ??
                                                "Employee email not available"}
                                        </p>
                                    )}

                                    {employees.length === 0 && (
                                        <p className="text-xs text-amber-700">
                                            No active employees are available.
                                            Create or activate an employee
                                            before sending an invitation.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label
                                        htmlFor="role"
                                        className="block text-sm font-semibold text-slate-700"
                                    >
                                        Administrator role
                                    </label>

                                    <select
                                        id="role"
                                        value={roleId}
                                        onChange={(event) =>
                                            setRoleId(event.target.value)
                                        }
                                        disabled={submitting}
                                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                                    >
                                        <option value="">
                                            Select an admin role
                                        </option>

                                        {roles.map((role) => (
                                            <option
                                                key={role.id}
                                                value={role.id}
                                            >
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>

                                    {selectedRole?.description && (
                                        <p className="text-xs leading-5 text-slate-500">
                                            {selectedRole.description}
                                        </p>
                                    )}

                                    {roles.length === 0 && (
                                        <p className="text-xs text-amber-700">
                                            No active administrator roles were
                                            found. Check the active roles and
                                            their slugs in role management.
                                        </p>
                                    )}
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <h2 className="text-sm font-semibold text-slate-800">
                                        Invitation summary
                                    </h2>

                                    <p className="mt-2 text-sm text-slate-600">
                                        Employee:{" "}
                                        <strong>
                                            {selectedUser?.name ??
                                                selectedEmployee?.employeeCode ??
                                                "Not selected"}
                                        </strong>
                                    </p>

                                    <p className="mt-1 text-sm text-slate-600">
                                        Role:{" "}
                                        <strong>
                                            {selectedRole?.name ??
                                                "Not selected"}
                                        </strong>
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => void sendInvitation()}
                                    disabled={
                                        submitting ||
                                        !selectedEmployee ||
                                        !selectedRole
                                    }
                                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                                >
                                    {submitting ? (
                                        <Loader2
                                            size={17}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Mail size={17} />
                                    )}

                                    {submitting
                                        ? "Creating invitation..."
                                        : "Send admin invitation"}
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
