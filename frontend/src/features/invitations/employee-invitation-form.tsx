"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AlertCircle,
    Check,
    ChevronDown,
    Copy,
    ExternalLink,
    Mail,
    ShieldCheck,
    UserPlus,
    X,
} from "lucide-react";

import {
    employeeInvitationsApi,
} from "@/services/api/employee-invitations.api";

import type {
    CreateEmployeeInvitationResult,
    InvitationRole,
} from "./invitation.types";

import type {
    JobApplication,
} from "@/features/job-applications/job-application.types";

interface EmployeeInvitationFormProps {
    applications: JobApplication[];
    roles: InvitationRole[];
    loadingApplications?: boolean;
    loadingRoles?: boolean;
    initialApplicationId?: string;
    onCreated?: (
        result: CreateEmployeeInvitationResult,
    ) => void;
    onClose?: () => void;
}

const getApplicationId = (
    application: JobApplication,
): string => {
    const id =
        application._id ??
        application.id;

    if (
        typeof id !== "string" ||
        !id.trim()
    ) {
        throw new Error(
            "Invalid job application ID.",
        );
    }

    return id.trim();
};

const getRoleId = (
    role: InvitationRole,
): string => {
    const id =
        typeof role._id === "string"
            ? role._id.trim()
            : "";

    if (!id) {
        throw new Error(
            "Invalid role ID.",
        );
    }

    return id;
};

const getRoleName = (
    role: InvitationRole,
): string => {
    return (
        role.name?.trim() ||
        role.slug?.trim() ||
        "Employee"
    );
};

const getApplicationName = (
    application: JobApplication,
): string => {
    return (
        application.name?.trim() ||
        "Unnamed Candidate"
    );
};

const getApplicationEmail = (
    application: JobApplication,
): string => {
    return (
        application.email?.trim() ||
        ""
    );
};

const formatDate = (
    value: string,
): string => {
    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return value;
    }

    return date.toLocaleString(
        undefined,
        {
            dateStyle: "medium",
            timeStyle: "short",
        },
    );
};

export default function EmployeeInvitationForm({
    applications,
    roles,
    loadingApplications = false,
    loadingRoles = false,
    initialApplicationId = "",
    onCreated,
    onClose,
}: EmployeeInvitationFormProps) {
    const [applicationId, setApplicationId] =
        useState(initialApplicationId);

    const [roleId, setRoleId] =
        useState("");

    useEffect(() => {
        setApplicationId(initialApplicationId);
    }, [initialApplicationId]);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [createdResult, setCreatedResult] =
        useState<CreateEmployeeInvitationResult | null>(
            null,
        );

    const [copied, setCopied] =
        useState(false);

    const selectedApplication =
        useMemo(
            () =>
                applications.find(
                    (application) =>
                        getApplicationId(
                            application,
                        ) === applicationId,
                ),
            [
                applications,
                applicationId,
            ],
        );

    const selectedRole =
        useMemo(
            () =>
                roles.find(
                    (role) =>
                        getRoleId(role) ===
                        roleId,
                ),
            [
                roles,
                roleId,
            ],
        );

    const selectedApplications =
        useMemo(
            () =>
                applications.filter(
                    (application) =>
                        String(
                            application.status ??
                                "",
                        ).toUpperCase() ===
                        "SELECTED",
                ),
            [applications],
        );

    const activeRoles =
        useMemo(
            () =>
                roles.filter(
                    (role) =>
                        String(
                            role.status ??
                                "",
                        ).toUpperCase() ===
                            "ACTIVE" &&
                        getRoleId(role) &&
                        role.slug?.toLowerCase() !==
                            "owner",
                ),
            [roles],
        );

    const invitationLink =
        createdResult
            ? `${window.location.origin}/employee-invitation/${createdResult.token}`
            : "";

    const resetForm = () => {
        setApplicationId("");
        setRoleId("");
        setError("");
        setCreatedResult(null);
        setCopied(false);
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        setError("");

        if (!applicationId) {
            setError(
                "Please select a candidate.",
            );
            return;
        }

        if (!roleId) {
            setError(
                "Please select an employee role.",
            );
            return;
        }

        setSubmitting(true);

        try {
            const result =
                await employeeInvitationsApi.create(
                    {
                        applicationId,
                        roleId,
                    },
                );

            setCreatedResult(result);

            onCreated?.(result);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Failed to create employee invitation.";

            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCopy = async () => {
        if (!invitationLink) {
            return;
        }

        try {
            await navigator.clipboard.writeText(
                invitationLink,
            );

            setCopied(true);

            window.setTimeout(
                () => setCopied(false),
                2000,
            );
        } catch {
            setError(
                "Unable to copy invitation link.",
            );
        }
    };

    if (createdResult) {
        return (
            <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <Check className="h-6 w-6" />
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900">
                            Invitation Created
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            The employee invitation was created successfully.
                        </p>
                    </div>

                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Candidate
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                                {createdResult.name}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Email
                            </p>

                            <p className="mt-1 break-all font-medium text-gray-900">
                                {createdResult.email}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Role
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                                {selectedRole
                                    ? getRoleName(
                                          selectedRole,
                                      )
                                    : createdResult.roleId}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Expires
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                                {formatDate(
                                    createdResult.expiresAt,
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-blue-600">
                            <Mail className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-blue-900">
                                Employee Invitation Link
                            </h3>

                            <p className="mt-1 text-sm text-blue-800">
                                Send this link to the selected candidate.
                            </p>

                            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                <input
                                    readOnly
                                    value={invitationLink}
                                    className="min-w-0 flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none"
                                />

                                <button
                                    type="button"
                                    onClick={
                                        handleCopy
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>

                            <a
                                href={
                                    invitationLink
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline"
                            >
                                Preview invitation
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                            Close
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={
                            resetForm
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
                    >
                        <UserPlus className="h-4 w-4" />
                        Create Another
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6"
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-white">
                        <UserPlus className="h-6 w-6" />
                    </div>

                    <h2 className="text-xl font-semibold text-gray-900">
                        Create Employee Invitation
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Invite a selected job applicant to become an employee.
                    </p>
                </div>

                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="grid gap-5">
                <div>
                    <label
                        htmlFor="employee-invitation-application"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        Selected Candidate
                    </label>

                    <div className="relative">
                        <select
                            id="employee-invitation-application"
                            value={
                                applicationId
                            }
                            onChange={(
                                event,
                            ) =>
                                setApplicationId(
                                    event.target
                                        .value,
                                )
                            }
                            disabled={
                                loadingApplications ||
                                submitting
                            }
                            className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100"
                        >
                            <option value="">
                                {loadingApplications
                                    ? "Loading candidates..."
                                    : "Select a selected candidate"}
                            </option>

                            {selectedApplications.map(
                                (
                                    application,
                                ) => {
                                    const id =
                                        getApplicationId(
                                            application,
                                        );

                                    return (
                                        <option
                                            key={
                                                id
                                            }
                                            value={
                                                id
                                            }
                                        >
                                            {getApplicationName(
                                                application,
                                            )}{" "}
                                            —{" "}
                                            {getApplicationEmail(
                                                application,
                                            )}
                                        </option>
                                    );
                                },
                            )}
                        </select>

                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>

                    {selectedApplication && (
                        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <p className="text-sm font-medium text-gray-900">
                                {getApplicationName(
                                    selectedApplication,
                                )}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                {getApplicationEmail(
                                    selectedApplication,
                                )}
                            </p>
                        </div>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="employee-invitation-role"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        Employee Role
                    </label>

                    <div className="relative">
                        <select
                            id="employee-invitation-role"
                            value={roleId}
                            onChange={(
                                event,
                            ) =>
                                setRoleId(
                                    event.target
                                        .value,
                                )
                            }
                            disabled={
                                loadingRoles ||
                                submitting
                            }
                            className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100"
                        >
                            <option value="">
                                {loadingRoles
                                    ? "Loading roles..."
                                    : "Select employee role"}
                            </option>

                            {activeRoles.map(
                                (role) => {
                                    const id =
                                        getRoleId(
                                            role,
                                        );

                                    return (
                                        <option
                                            key={
                                                id
                                            }
                                            value={
                                                id
                                            }
                                        >
                                            {getRoleName(
                                                role,
                                            )}
                                        </option>
                                    );
                                },
                            )}
                        </select>

                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                    <div>
                        <p className="text-sm font-semibold text-amber-900">
                            Invitation security
                        </p>

                        <p className="mt-1 text-sm leading-6 text-amber-800">
                            The invitation token is generated securely by the backend and is shown only after successful creation. The token is not stored by the frontend.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={
                            submitting
                        }
                        className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>
                )}

                <button
                    type="submit"
                    disabled={
                        submitting ||
                        loadingApplications ||
                        loadingRoles ||
                        !applicationId ||
                        !roleId
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <UserPlus className="h-4 w-4" />

                    {submitting
                        ? "Creating Invitation..."
                        : "Create Invitation"}
                </button>
            </div>
        </form>
    );
}
