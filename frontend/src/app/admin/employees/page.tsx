"use client";

import {
    FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AlertCircle,
    CheckCircle2,
    Edit3,
    Loader2,
    Search,
    Trash2,
    UserCog,
    X,
} from "lucide-react";

import {
    employeesApi,
} from "@/services/api/employees.api";

import {
    rolesApi,
} from "@/services/api/roles.api";

import type {
    Role,
} from "@/types/role";

import {
    EMPLOYEE_STATUSES,
    EMPLOYMENT_TYPES,
    type Employee,
    type EmployeeRole,
    type EmployeeStatus,
    type EmployeeUser,
    type EmploymentType,
    type UpdateEmployeeInput,
} from "@/features/employees/employee.types";

const STATUS_LABELS: Record<
    EmployeeStatus,
    string
> = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    SUSPENDED: "Suspended",
    TERMINATED: "Terminated",
};

const EMPLOYMENT_LABELS: Record<
    EmploymentType,
    string
> = {
    FULL_TIME: "Full Time",
    PART_TIME: "Part Time",
    CONTRACT: "Contract",
    INTERN: "Intern",
};

function getUser(
    employee: Employee,
): EmployeeUser | null {
    if (
        typeof employee.userId ===
        "string"
    ) {
        return null;
    }

    return employee.userId;
}

function getRole(
    employee: Employee,
): EmployeeRole | null {
    if (
        typeof employee.roleId ===
        "string"
    ) {
        return null;
    }

    return employee.roleId;
}

function formatDate(
    value?: string,
): string {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
        },
    ).format(date);
}

function formatSalary(
    value?: number,
): string {
    if (
        value === undefined ||
        value === null
    ) {
        return "—";
    }

    return new Intl.NumberFormat(
        "en-US",
        {
            maximumFractionDigits: 2,
        },
    ).format(value);
}

function getStatusClasses(
    status: EmployeeStatus,
): string {
    switch (status) {
        case "ACTIVE":
            return "bg-emerald-50 text-emerald-700 ring-emerald-200";

        case "INACTIVE":
            return "bg-slate-100 text-slate-700 ring-slate-200";

        case "SUSPENDED":
            return "bg-amber-50 text-amber-700 ring-amber-200";

        case "TERMINATED":
            return "bg-red-50 text-red-700 ring-red-200";

        default:
            return "bg-slate-100 text-slate-700 ring-slate-200";
    }
}

export default function EmployeesPage() {
    const [
        employees,
        setEmployees,
    ] = useState<Employee[]>([]);

    const [
        roles,
        setRoles,
    ] = useState<Role[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        loadingRoles,
        setLoadingRoles,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");

    const [
        search,
        setSearch,
    ] = useState("");

    const [
        statusFilter,
        setStatusFilter,
    ] = useState<
        EmployeeStatus | "ALL"
    >("ALL");

    const [
        roleFilter,
        setRoleFilter,
    ] = useState("ALL");

    const [
        editingEmployee,
        setEditingEmployee,
    ] = useState<Employee | null>(
        null,
    );

    const [
        deletingEmployee,
        setDeletingEmployee,
    ] = useState<Employee | null>(
        null,
    );

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        actionError,
        setActionError,
    ] = useState("");

    const [
        actionSuccess,
        setActionSuccess,
    ] = useState("");

    const loadEmployees =
        useCallback(
            async () => {
                setLoading(true);
                setError("");

                try {
                    const data =
                        await employeesApi.getAll();

                    setEmployees(data);
                } catch (err) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load employees.",
                    );
                } finally {
                    setLoading(false);
                }
            },
            [],
        );

    const loadRoles =
        useCallback(
            async () => {
                setLoadingRoles(true);

                try {
                    const data =
                        await rolesApi.getAll();

                    setRoles(
                        data.filter(
                            (role) =>
                                role.status ===
                                    undefined ||
                                role.status ===
                                    "ACTIVE",
                        ),
                    );
                } catch {
                    setRoles([]);
                } finally {
                    setLoadingRoles(false);
                }
            },
            [],
        );

    useEffect(() => {
        void loadEmployees();
        void loadRoles();
    }, [
        loadEmployees,
        loadRoles,
    ]);

    useEffect(() => {
        if (
            !actionSuccess &&
            !actionError
        ) {
            return;
        }

        const timer =
            window.setTimeout(() => {
                setActionSuccess("");
                setActionError("");
            }, 4000);

        return () =>
            window.clearTimeout(
                timer,
            );
    }, [
        actionSuccess,
        actionError,
    ]);

    const filteredEmployees =
        useMemo(() => {
            const normalizedSearch =
                search
                    .trim()
                    .toLowerCase();

            return employees.filter(
                (employee) => {
                    const user =
                        getUser(
                            employee,
                        );

                    const role =
                        getRole(
                            employee,
                        );

                    const matchesStatus =
                        statusFilter ===
                            "ALL" ||
                        employee.status ===
                            statusFilter;

                    const matchesRole =
                        roleFilter ===
                            "ALL" ||
                        role?._id ===
                            roleFilter ||
                        employee.roleId ===
                            roleFilter;

                    if (
                        !normalizedSearch
                    ) {
                        return (
                            matchesStatus &&
                            matchesRole
                        );
                    }

                    const haystack = [
                        employee.employeeCode,
                        employee.department,
                        employee.jobTitle,
                        employee.status,
                        employee.employmentType,
                        user?.name,
                        user?.email,
                        user?.phone,
                        role?.name,
                        role?.slug,
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                    return (
                        matchesStatus &&
                        matchesRole &&
                        haystack.includes(
                            normalizedSearch,
                        )
                    );
                },
            );
        }, [
            employees,
            roleFilter,
            search,
            statusFilter,
        ]);

    const statistics =
        useMemo(() => {
            return {
                total: employees.length,
                active: employees.filter(
                    (employee) =>
                        employee.status ===
                        "ACTIVE",
                ).length,
                inactive:
                    employees.filter(
                        (employee) =>
                            employee.status ===
                            "INACTIVE",
                    ).length,
                suspended:
                    employees.filter(
                        (employee) =>
                            employee.status ===
                            "SUSPENDED",
                    ).length,
                terminated:
                    employees.filter(
                        (employee) =>
                            employee.status ===
                            "TERMINATED",
                    ).length,
            };
        }, [employees]);

    const handleStatusChange =
        async (
            employee: Employee,
            status: EmployeeStatus,
        ) => {
            if (
                employee.status ===
                status
            ) {
                return;
            }

            setSaving(true);
            setActionError("");
            setActionSuccess("");

            try {
                const updated =
                    await employeesApi.updateStatus(
                        employee._id,
                        { status },
                    );

                setEmployees(
                    (current) =>
                        current.map(
                            (item) =>
                                item._id ===
                                updated._id
                                    ? {
                                          ...item,
                                          ...updated,
                                      }
                                    : item,
                        ),
                );

                setActionSuccess(
                    `Employee status changed to ${STATUS_LABELS[status]}.`,
                );
            } catch (err) {
                setActionError(
                    err instanceof Error
                        ? err.message
                        : "Failed to update employee status.",
                );
            } finally {
                setSaving(false);
            }
        };

    const handleDelete =
        async () => {
            if (
                !deletingEmployee
            ) {
                return;
            }

            setSaving(true);
            setActionError("");
            setActionSuccess("");

            try {
                await employeesApi.remove(
                    deletingEmployee._id,
                );

                setEmployees(
                    (current) =>
                        current.filter(
                            (employee) =>
                                employee._id !==
                                deletingEmployee._id,
                        ),
                );

                setDeletingEmployee(
                    null,
                );

                setActionSuccess(
                    "Employee deleted successfully.",
                );
            } catch (err) {
                setActionError(
                    err instanceof Error
                        ? err.message
                        : "Failed to delete employee.",
                );
            } finally {
                setSaving(false);
            }
        };

    const handleEditSubmit =
        async (
            event: FormEvent<HTMLFormElement>,
        ) => {
            event.preventDefault();

            if (
                !editingEmployee
            ) {
                return;
            }

            const form =
                new FormData(
                    event.currentTarget,
                );

            const salaryValue =
                String(
                    form.get(
                        "salary",
                    ) ?? "",
                ).trim();

            const input: UpdateEmployeeInput =
                {
                    roleId:
                        String(
                            form.get(
                                "roleId",
                            ) ?? "",
                        ).trim() ||
                        undefined,

                    employmentType:
                        String(
                            form.get(
                                "employmentType",
                            ) ?? "",
                        ) as EmploymentType,

                    department:
                        String(
                            form.get(
                                "department",
                            ) ?? "",
                        ).trim() ||
                        undefined,

                    jobTitle:
                        String(
                            form.get(
                                "jobTitle",
                            ) ?? "",
                        ).trim() ||
                        undefined,

                    joiningDate:
                        String(
                            form.get(
                                "joiningDate",
                            ) ?? "",
                        ).trim() ||
                        undefined,

                    leavingDate:
                        String(
                            form.get(
                                "leavingDate",
                            ) ?? "",
                        ).trim() ||
                        undefined,

                    salary:
                        salaryValue
                            ? Number(
                                  salaryValue,
                              )
                            : undefined,

                    emergencyContactName:
                        String(
                            form.get(
                                "emergencyContactName",
                            ) ?? "",
                        ).trim() ||
                        undefined,

                    emergencyContactPhone:
                        String(
                            form.get(
                                "emergencyContactPhone",
                            ) ?? "",
                        ).trim() ||
                        undefined,

                    notes:
                        String(
                            form.get(
                                "notes",
                            ) ?? "",
                        ).trim() ||
                        undefined,
                };

            if (
                input.salary !==
                    undefined &&
                Number.isNaN(
                    input.salary,
                )
            ) {
                setActionError(
                    "Salary must be a valid number.",
                );
                return;
            }

            setSaving(true);
            setActionError("");
            setActionSuccess("");

            try {
                const updated =
                    await employeesApi.update(
                        editingEmployee._id,
                        input,
                    );

                setEmployees(
                    (current) =>
                        current.map(
                            (item) =>
                                item._id ===
                                updated._id
                                    ? {
                                          ...item,
                                          ...updated,
                                      }
                                    : item,
                        ),
                );

                setEditingEmployee(
                    null,
                );

                setActionSuccess(
                    "Employee updated successfully.",
                );
            } catch (err) {
                setActionError(
                    err instanceof Error
                        ? err.message
                        : "Failed to update employee.",
                );
            } finally {
                setSaving(false);
            }
        };

    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1600px] space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                                <UserCog
                                    size={22}
                                />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                                    Employees
                                </h1>

                                <p className="text-sm text-slate-500">
                                    Manage employee profiles, roles and employment status.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            void loadEmployees()
                        }
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <Loader2
                                size={17}
                                className="animate-spin"
                            />
                        ) : (
                            <CheckCircle2
                                size={17}
                            />
                        )}

                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <AlertCircle
                            size={18}
                            className="mt-0.5 shrink-0"
                        />

                        <div className="flex-1">
                            {error}
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                void loadEmployees()
                            }
                            className="font-semibold underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {actionSuccess && (
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                        <CheckCircle2
                            size={18}
                        />

                        {actionSuccess}
                    </div>
                )}

                {actionError && (
                    <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <AlertCircle
                            size={18}
                        />

                        {actionError}
                    </div>
                )}

                <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
                    <StatCard
                        label="Total"
                        value={
                            statistics.total
                        }
                    />

                    <StatCard
                        label="Active"
                        value={
                            statistics.active
                        }
                    />

                    <StatCard
                        label="Inactive"
                        value={
                            statistics.inactive
                        }
                    />

                    <StatCard
                        label="Suspended"
                        value={
                            statistics.suspended
                        }
                    />

                    <StatCard
                        label="Terminated"
                        value={
                            statistics.terminated
                        }
                    />
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row">
                        <div className="relative flex-1">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target
                                            .value,
                                    )
                                }
                                placeholder="Search employee, name, email, code, role..."
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                            />
                        </div>

                        <select
                            value={
                                statusFilter
                            }
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target
                                        .value as
                                        | EmployeeStatus
                                        | "ALL",
                                )
                            }
                            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-400"
                        >
                            <option value="ALL">
                                All statuses
                            </option>

                            {EMPLOYEE_STATUSES.map(
                                (status) => (
                                    <option
                                        key={
                                            status
                                        }
                                        value={
                                            status
                                        }
                                    >
                                        {
                                            STATUS_LABELS[
                                                status
                                            ]
                                        }
                                    </option>
                                ),
                            )}
                        </select>

                        <select
                            value={
                                roleFilter
                            }
                            onChange={(event) =>
                                setRoleFilter(
                                    event.target
                                        .value,
                                )
                            }
                            disabled={
                                loadingRoles
                            }
                            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-400 disabled:opacity-60"
                        >
                            <option value="ALL">
                                All roles
                            </option>

                            {roles.map(
                                (role) => (
                                    <option
                                        key={
                                            role.id
                                        }
                                        value={
                                            role.id
                                        }
                                    >
                                        {role.name}
                                    </option>
                                ),
                            )}
                        </select>
                    </div>

                    <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-500">
                        Showing{" "}
                        <span className="font-semibold text-slate-900">
                            {
                                filteredEmployees.length
                            }
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-slate-900">
                            {
                                employees.length
                            }
                        </span>{" "}
                        employees
                    </div>

                    {loading ? (
                        <div className="flex min-h-[320px] items-center justify-center">
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                <Loader2
                                    size={20}
                                    className="animate-spin"
                                />
                                Loading employees...
                            </div>
                        </div>
                    ) : filteredEmployees.length ===
                      0 ? (
                        <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                <UserCog
                                    size={25}
                                />
                            </div>

                            <h2 className="text-base font-semibold text-slate-900">
                                No employees found
                            </h2>

                            <p className="mt-1 max-w-md text-sm text-slate-500">
                                Try changing your search or filters.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1100px] text-left">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <TableHead>
                                            Employee
                                        </TableHead>

                                        <TableHead>
                                            Code
                                        </TableHead>

                                        <TableHead>
                                            Role
                                        </TableHead>

                                        <TableHead>
                                            Employment
                                        </TableHead>

                                        <TableHead>
                                            Department
                                        </TableHead>

                                        <TableHead>
                                            Status
                                        </TableHead>

                                        <TableHead>
                                            Joined
                                        </TableHead>

                                        <TableHead>
                                            Actions
                                        </TableHead>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {filteredEmployees.map(
                                        (
                                            employee,
                                        ) => {
                                            const user =
                                                getUser(
                                                    employee,
                                                );

                                            const role =
                                                getRole(
                                                    employee,
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        employee._id
                                                    }
                                                    className="transition hover:bg-slate-50/70"
                                                >
                                                    <td className="px-4 py-4">
                                                        <div>
                                                            <p className="font-semibold text-slate-900">
                                                                {user?.name ??
                                                                    "Unnamed employee"}
                                                            </p>

                                                            <p className="mt-0.5 text-xs text-slate-500">
                                                                {user?.email ??
                                                                    "No email"}
                                                            </p>

                                                            {user?.phone && (
                                                                <p className="mt-0.5 text-xs text-slate-400">
                                                                    {
                                                                        user.phone
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                                                            {
                                                                employee.employeeCode
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-800">
                                                                {role?.name ??
                                                                    "Unknown role"}
                                                            </p>

                                                            {role?.slug && (
                                                                <p className="text-xs text-slate-400">
                                                                    {
                                                                        role.slug
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-4 text-sm text-slate-600">
                                                        {
                                                            EMPLOYMENT_LABELS[
                                                                employee
                                                                    .employmentType
                                                            ]
                                                        }
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <div>
                                                            <p className="text-sm text-slate-700">
                                                                {employee.department ??
                                                                    "—"}
                                                            </p>

                                                            {employee.jobTitle && (
                                                                <p className="text-xs text-slate-400">
                                                                    {
                                                                        employee.jobTitle
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <select
                                                            value={
                                                                employee.status
                                                            }
                                                            disabled={
                                                                saving
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                void handleStatusChange(
                                                                    employee,
                                                                    event
                                                                        .target
                                                                        .value as EmployeeStatus,
                                                                )
                                                            }
                                                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 outline-none ${getStatusClasses(
                                                                employee.status,
                                                            )}`}
                                                        >
                                                            {EMPLOYEE_STATUSES.map(
                                                                (
                                                                    status,
                                                                ) => (
                                                                    <option
                                                                        key={
                                                                            status
                                                                        }
                                                                        value={
                                                                            status
                                                                        }
                                                                    >
                                                                        {
                                                                            STATUS_LABELS[
                                                                                status
                                                                            ]
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </td>

                                                    <td className="px-4 py-4 text-sm text-slate-600">
                                                        {formatDate(
                                                            employee.joiningDate,
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setEditingEmployee(
                                                                        employee,
                                                                    )
                                                                }
                                                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                                            >
                                                                <Edit3
                                                                    size={
                                                                        14
                                                                    }
                                                                />

                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setDeletingEmployee(
                                                                        employee,
                                                                    )
                                                                }
                                                                className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 bg-white px-2.5 text-red-600 transition hover:bg-red-50"
                                                                aria-label="Delete employee"
                                                            >
                                                                <Trash2
                                                                    size={
                                                                        15
                                                                    }
                                                                />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        },
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            {editingEmployee && (
                <EditEmployeeModal
                    employee={
                        editingEmployee
                    }
                    roles={roles}
                    saving={saving}
                    onClose={() =>
                        setEditingEmployee(
                            null,
                        )
                    }
                    onSubmit={
                        handleEditSubmit
                    }
                />
            )}

            {deletingEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-950">
                                    Delete employee?
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    This action cannot be undone.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setDeletingEmployee(
                                        null,
                                    )
                                }
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X
                                    size={18}
                                />
                            </button>
                        </div>

                        <div className="mt-5 rounded-xl bg-slate-50 p-4">
                            <p className="font-semibold text-slate-900">
                                {getUser(
                                    deletingEmployee,
                                )?.name ??
                                    "Unnamed employee"}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                {
                                    deletingEmployee.employeeCode
                                }
                            </p>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setDeletingEmployee(
                                        null,
                                    )
                                }
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={
                                    saving
                                }
                                onClick={() =>
                                    void handleDelete()
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                {saving && (
                                    <Loader2
                                        size={
                                            16
                                        }
                                        className="animate-spin"
                                    />
                                )}

                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

function StatCard({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-950">
                {value}
            </p>
        </div>
    );
}

function TableHead({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {children}
        </th>
    );
}

function EditEmployeeModal({
    employee,
    roles,
    saving,
    onClose,
    onSubmit,
}: {
    employee: Employee;
    roles: Role[];
    saving: boolean;
    onClose: () => void;
    onSubmit: (
        event: FormEvent<HTMLFormElement>,
    ) => void;
}) {
    const user =
        getUser(employee);

    const employeeRole =
        getRole(employee);

    const joiningDate =
        employee.joiningDate
            ? employee.joiningDate.slice(
                  0,
                  10,
              )
            : "";

    const leavingDate =
        employee.leavingDate
            ? employee.leavingDate.slice(
                  0,
                  10,
              )
            : "";

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="mx-auto my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                    <div>
                        <h2 className="text-lg font-bold text-slate-950">
                            Edit Employee
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            {user?.name ??
                                employee.employeeCode}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X
                            size={19}
                        />
                    </button>
                </div>

                <form
                    onSubmit={
                        onSubmit
                    }
                    className="p-6"
                >
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Employee code
                            </label>

                            <input
                                value={
                                    employee.employeeCode
                                }
                                disabled
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm text-slate-500"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Employee
                            </label>

                            <input
                                value={
                                    user?.name ??
                                    ""
                                }
                                disabled
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm text-slate-500"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Role
                            </label>

                            <select
                                name="roleId"
                                defaultValue={
                                    employeeRole?._id ??
                                    (typeof employee.roleId ===
                                    "string"
                                        ? employee.roleId
                                        : "")
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                            >
                                <option value="">
                                    Select role
                                </option>

                                {roles.map(
                                    (
                                        role,
                                    ) => (
                                        <option
                                            key={
                                                role.id
                                            }
                                            value={
                                                role.id
                                            }
                                        >
                                            {
                                                role.name
                                            }
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Employment type
                            </label>

                            <select
                                name="employmentType"
                                defaultValue={
                                    employee.employmentType
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                            >
                                {EMPLOYMENT_TYPES.map(
                                    (
                                        type,
                                    ) => (
                                        <option
                                            key={
                                                type
                                            }
                                            value={
                                                type
                                            }
                                        >
                                            {
                                                EMPLOYMENT_LABELS[
                                                    type
                                                ]
                                            }
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Department
                            </label>

                            <input
                                name="department"
                                defaultValue={
                                    employee.department ??
                                    ""
                                }
                                placeholder="e.g. Human Resources"
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Job title
                            </label>

                            <input
                                name="jobTitle"
                                defaultValue={
                                    employee.jobTitle ??
                                    ""
                                }
                                placeholder="e.g. HR Manager"
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Joining date
                            </label>

                            <input
                                type="date"
                                name="joiningDate"
                                defaultValue={
                                    joiningDate
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Leaving date
                            </label>

                            <input
                                type="date"
                                name="leavingDate"
                                defaultValue={
                                    leavingDate
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Salary
                            </label>

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                name="salary"
                                defaultValue={
                                    employee.salary ??
                                    ""
                                }
                                placeholder="Salary"
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Emergency contact
                            </label>

                            <input
                                name="emergencyContactName"
                                defaultValue={
                                    employee.emergencyContactName ??
                                    ""
                                }
                                placeholder="Contact name"
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Emergency phone
                            </label>

                            <input
                                name="emergencyContactPhone"
                                defaultValue={
                                    employee.emergencyContactPhone ??
                                    ""
                                }
                                placeholder="Contact phone"
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Notes
                            </label>

                            <textarea
                                name="notes"
                                defaultValue={
                                    employee.notes ??
                                    ""
                                }
                                rows={5}
                                placeholder="Internal employee notes..."
                                className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                        <button
                            type="button"
                            onClick={
                                onClose
                            }
                            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                saving
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving && (
                                <Loader2
                                    size={
                                        16
                                    }
                                    className="animate-spin"
                                />
                            )}

                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
