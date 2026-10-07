"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useSearchParams,
} from "next/navigation";

import {
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Clock3,
    Copy,
    Mail,
    RefreshCw,
    Search,
    ShieldCheck,
    UserPlus,
    Users,
    X,
} from "lucide-react";

import { AdminAuthGuard } from "@/components/common/AdminAuthGuard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

import { employeeInvitationsApi } from "@/services/api/employee-invitations.api";
import { jobApplicationsApi } from "@/services/api/job-applications.api";
import { rolesApi } from "@/services/api/roles.api";

import {
    hasPermission,
} from "@/lib/permissions/permission";

import {
    useAuthStore,
} from "@/stores/auth.store";

import type {
    AuthUser,
} from "@/types/auth";

import type {
    Role,
} from "@/types/role";

import type {
    JobApplication,
} from "@/features/job-applications/job-application.types";

import type {
    CreateEmployeeInvitationResult,
    EmployeeInvitation,
    EmployeeInvitationStatus,
    InvitationRole,
} from "@/features/invitations/invitation.types";

import EmployeeInvitationForm from "@/features/invitations/employee-invitation-form";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const PAGE_SIZE = 50;

const INVITATION_STATUS_OPTIONS: Array<
    "ALL" | EmployeeInvitationStatus
> = [
    "ALL",
    "PENDING",
    "ACCEPTED",
    "EXPIRED",
    "REVOKED",
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getRoleId(
    role: Role,
): string {
    const candidate = role as Role & {
        _id?: string;
        id?: string;
    };

    return (
        candidate._id ??
        candidate.id ??
        ""
    );
}

function getRoleSlug(
    role: Role,
): string {
    const candidate = role as Role & {
        slug?: string;
    };

    return candidate.slug ?? "";
}

function getRoleStatus(
    role: Role,
): string {
    const candidate = role as Role & {
        status?: string;
    };

    return candidate.status ?? "";
}

function getRoleName(
    role: Role,
): string {
    const candidate = role as Role & {
        name?: string;
    };

    return (
        candidate.name ??
        getRoleSlug(role)
    );
}

function getApplicationId(
    application: JobApplication,
): string {
    return (
        application._id ??
        application.id ??
        ""
    );
}

function getApplicationApplicantName(
    application: JobApplication,
): string {
    if (application.name?.trim()) {
        return application.name.trim();
    }

    if (
        application.applicantId &&
        typeof application.applicantId === "object" &&
        application.applicantId.name
    ) {
        return application.applicantId.name;
    }

    return "Unknown applicant";
}

function getApplicationEmail(
    application: JobApplication,
): string {
    if (application.email?.trim()) {
        return application.email.trim();
    }

    if (
        application.applicantId &&
        typeof application.applicantId === "object" &&
        application.applicantId.email
    ) {
        return application.applicantId.email;
    }

    return "";
}

function getVacancyTitle(
    application: JobApplication,
): string {
    if (
        application.vacancyId &&
        typeof application.vacancyId === "object"
    ) {
        return (
            application.vacancyId.title ??
            application.vacancyId.jobTitle ??
            "Job Vacancy"
        );
    }

    return "Job Vacancy";
}

function formatDate(
    value?: string,
): string {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            dateStyle: "medium",
            timeStyle: "short",
        },
    ).format(date);
}

function getStatusVariant(
    status: EmployeeInvitationStatus,
): "default" | "success" | "warning" | "danger" {
    switch (status) {
        case "ACCEPTED":
            return "success";

        case "PENDING":
            return "warning";

        case "EXPIRED":
        case "REVOKED":
            return "danger";

        default:
            return "default";
    }
}

function getInvitationRoleName(
    invitation: EmployeeInvitation,
): string {
    if (
        invitation.roleId &&
        typeof invitation.roleId === "object"
    ) {
        return (
            invitation.roleId.name ??
            invitation.roleId.slug ??
            "Unknown Role"
        );
    }

    return "Unknown Role";
}

function getInvitationApplicationTitle(
    invitation: EmployeeInvitation,
): string {
    if (
        invitation.applicationId &&
        typeof invitation.applicationId === "object"
    ) {
        return (
            invitation.applicationId.name ??
            "Selected Application"
        );
    }

    return "Selected Application";
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function EmployeeInvitationsPage() {
    const searchParams = useSearchParams();

    const user = useAuthStore(
        (state) => state.user,
    );

    const requestedApplicationId =
        searchParams
            .get("applicationId")
            ?.trim() ?? "";

    /*
    |--------------------------------------------------------------------------
    | State
    |--------------------------------------------------------------------------
    */

    const [
        applications,
        setApplications,
    ] = useState<JobApplication[]>([]);

    const [
        roles,
        setRoles,
    ] = useState<InvitationRole[]>([]);

    const [
        invitations,
        setInvitations,
    ] = useState<EmployeeInvitation[]>([]);

    const [
        loadingApplications,
        setLoadingApplications,
    ] = useState(true);

    const [
        loadingRoles,
        setLoadingRoles,
    ] = useState(true);

    const [
        loadingInvitations,
        setLoadingInvitations,
    ] = useState(true);

    const [
        actionLoading,
        setActionLoading,
    ] = useState(false);

    const [
        pageError,
        setPageError,
    ] = useState("");

    const [
        showCreateForm,
        setShowCreateForm,
    ] = useState(false);

    const [
        createdResult,
        setCreatedResult,
    ] = useState<CreateEmployeeInvitationResult | null>(
        null,
    );

    const [
        copied,
        setCopied,
    ] = useState(false);

    const [
        statusFilter,
        setStatusFilter,
    ] = useState<
        "ALL" | EmployeeInvitationStatus
    >("ALL");

    const [
        search,
        setSearch,
    ] = useState("");

    const [
        expandedInvitationId,
        setExpandedInvitationId,
    ] = useState<string | null>(null);

    /*
    |--------------------------------------------------------------------------
    | Permissions
    |--------------------------------------------------------------------------
    */

    const canCreate = useMemo(
        () =>
            hasPermission(
                user,
                "employee_invitations.create",
            ) ||
            hasPermission(
                user,
                "employee_invitations.manage",
            ),
        [user],
    );

    const canRevoke = useMemo(
        () =>
            hasPermission(
                user,
                "employee_invitations.revoke",
            ) ||
            hasPermission(
                user,
                "employee_invitations.manage",
            ),
        [user],
    );

    /*
    |--------------------------------------------------------------------------
    | Load Selected Applications
    |--------------------------------------------------------------------------
    */

    const loadApplications = useCallback(
        async () => {
            setLoadingApplications(true);

            try {
                const response =
                    await jobApplicationsApi.getAll({
                        page: 1,
                        limit: PAGE_SIZE,
                        status: "SELECTED",
                    });

                setApplications(
                    response.applications ?? [],
                );
            } catch (error) {
                console.error(
                    "Failed to load selected job applications:",
                    error,
                );

                setPageError(
                    "Failed to load selected job applications.",
                );
            } finally {
                setLoadingApplications(false);
            }
        },
        [],
    );

    /*
    |--------------------------------------------------------------------------
    | Load Roles
    |--------------------------------------------------------------------------
    */

    const loadRoles = useCallback(
        async () => {
            setLoadingRoles(true);

            try {
                const response =
                    await rolesApi.getAll();

                const invitationRoles: InvitationRole[] = [];

                for (const role of response) {
                    const id = getRoleId(role);

                    if (!id) {
                        continue;
                    }

                    const slug =
                        getRoleSlug(role)
                            .trim()
                            .toLowerCase();

                    /*
                     * OWNER must never be selectable
                     * for employee invitations.
                     */
                    if (
                        slug === "owner" ||
                        slug === "owner_role"
                    ) {
                        continue;
                    }

                    const status =
                        getRoleStatus(role);

                    /*
                     * Only active roles are valid
                     * invitation targets.
                     */
                    if (
                        status &&
                        status.toUpperCase() !==
                            "ACTIVE"
                    ) {
                        continue;
                    }

                    const candidate =
                        role as Role & {
                            description?: string;
                            isSystemRole?: boolean;
                        };

                    invitationRoles.push({
                        _id: id,
                        name: getRoleName(role),
                        slug,
                        ...(candidate.description
                            ? {
                                  description:
                                      candidate.description,
                              }
                            : {}),
                        ...(status
                            ? {
                                  status,
                              }
                            : {}),
                        ...(typeof candidate.isSystemRole ===
                        "boolean"
                            ? {
                                  isSystemRole:
                                      candidate.isSystemRole,
                              }
                            : {}),
                    });
                }

                setRoles(
                    invitationRoles,
                );
            } catch (error) {
                console.error(
                    "Failed to load roles:",
                    error,
                );

                setPageError(
                    "Failed to load available employee roles.",
                );
            } finally {
                setLoadingRoles(false);
            }
        },
        [],
    );

    /*
    |--------------------------------------------------------------------------
    | Load Invitations
    |--------------------------------------------------------------------------
    */

    const loadInvitations = useCallback(
        async () => {
            setLoadingInvitations(true);

            try {
                const response =
                    await employeeInvitationsApi.getAll({
                        page: 1,
                        limit: PAGE_SIZE,
                        ...(statusFilter !== "ALL"
                            ? {
                                  status:
                                      statusFilter,
                              }
                            : {}),
                        ...(search.trim()
                            ? {
                                  search:
                                      search.trim(),
                              }
                            : {}),
                    });

                setInvitations(
                    response.invitations ?? [],
                );
            } catch (error) {
                console.error(
                    "Failed to load employee invitations:",
                    error,
                );

                setPageError(
                    "Failed to load employee invitations.",
                );
            } finally {
                setLoadingInvitations(false);
            }
        },
        [
            search,
            statusFilter,
        ],
    );

    /*
    |--------------------------------------------------------------------------
    | Initial Loading
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        void loadApplications();
        void loadRoles();
        void loadInvitations();
    }, [
        loadApplications,
        loadRoles,
        loadInvitations,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Open Create Form From Selected Application
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!requestedApplicationId) {
            return;
        }

        setCreatedResult(null);
        setShowCreateForm(true);
    }, [
        requestedApplicationId,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Available Applications
    |--------------------------------------------------------------------------
    */

    const availableApplications =
        useMemo(
            () =>
                applications.filter(
                    (application) =>
                        application.status ===
                        "SELECTED",
                ),
            [applications],
        );

    /*
    |--------------------------------------------------------------------------
    | Requested Application Validation
    |--------------------------------------------------------------------------
    */

    const requestedApplication =
        useMemo(
            () => {
                if (
                    !requestedApplicationId
                ) {
                    return null;
                }

                return (
                    availableApplications.find(
                        (application) =>
                            getApplicationId(
                                application,
                            ) ===
                            requestedApplicationId,
                    ) ?? null
                );
            },
            [
                availableApplications,
                requestedApplicationId,
            ],
        );

    /*
    |--------------------------------------------------------------------------
    | Filter Invitations
    |--------------------------------------------------------------------------
    */

    const filteredInvitations =
        useMemo(() => {
            const normalizedSearch =
                search
                    .trim()
                    .toLowerCase();

            return invitations.filter(
                (invitation) => {
                    if (
                        statusFilter !==
                            "ALL" &&
                        invitation.status !==
                            statusFilter
                    ) {
                        return false;
                    }

                    if (
                        !normalizedSearch
                    ) {
                        return true;
                    }

                    const roleName =
                        getInvitationRoleName(
                            invitation,
                        );

                    const applicationName =
                        getInvitationApplicationTitle(
                            invitation,
                        );

                    return [
                        invitation.name,
                        invitation.email,
                        roleName,
                        applicationName,
                    ]
                        .filter(
                            Boolean,
                        )
                        .some(
                            (value) =>
                                value
                                    .toLowerCase()
                                    .includes(
                                        normalizedSearch,
                                    ),
                        );
                },
            );
        }, [
            invitations,
            search,
            statusFilter,
        ]);

    /*
    |--------------------------------------------------------------------------
    | Statistics
    |--------------------------------------------------------------------------
    */

    const stats = useMemo(
        () => ({
            total:
                invitations.length,

            pending:
                invitations.filter(
                    (item) =>
                        item.status ===
                        "PENDING",
                ).length,

            accepted:
                invitations.filter(
                    (item) =>
                        item.status ===
                        "ACCEPTED",
                ).length,

            expired:
                invitations.filter(
                    (item) =>
                        item.status ===
                        "EXPIRED",
                ).length,
        }),
        [invitations],
    );

    /*
    |--------------------------------------------------------------------------
    | Created Handler
    |--------------------------------------------------------------------------
    */

    const handleCreated = useCallback(
        (
            result: CreateEmployeeInvitationResult,
        ) => {
            setCreatedResult(result);
            setShowCreateForm(false);
            setCopied(false);

            void loadInvitations();
            void loadApplications();
        },
        [
            loadApplications,
            loadInvitations,
        ],
    );

    /*
    |--------------------------------------------------------------------------
    | Revoke
    |--------------------------------------------------------------------------
    */

    const handleRevoke = useCallback(
        async (
            invitationId: string,
        ) => {
            if (
                !canRevoke ||
                actionLoading
            ) {
                return;
            }

            const confirmed =
                window.confirm(
                    "Are you sure you want to revoke this employee invitation?",
                );

            if (!confirmed) {
                return;
            }

            setActionLoading(true);
            setPageError("");

            try {
                const updated =
                    await employeeInvitationsApi.revoke(
                        invitationId,
                    );

                setInvitations(
                    (current) =>
                        current.map(
                            (invitation) =>
                                invitation._id ===
                                updated._id
                                    ? updated
                                    : invitation,
                        ),
                );
            } catch (error) {
                console.error(
                    "Failed to revoke invitation:",
                    error,
                );

                setPageError(
                    "Failed to revoke the invitation.",
                );
            } finally {
                setActionLoading(
                    false,
                );
            }
        },
        [
            actionLoading,
            canRevoke,
        ],
    );

    /*
    |--------------------------------------------------------------------------
    | Copy Invitation Link
    |--------------------------------------------------------------------------
    */

    const handleCopyInvitationLink =
        useCallback(
            async () => {
                if (
                    typeof window ===
                        "undefined" ||
                    !createdResult
                ) {
                    return;
                }

                const link =
                    `${window.location.origin}/employee-invitation/${createdResult.token}`;

                try {
                    await navigator.clipboard.writeText(
                        link,
                    );

                    setCopied(true);

                    window.setTimeout(
                        () => {
                            setCopied(
                                false,
                            );
                        },
                        2000,
                    );
                } catch (error) {
                    console.error(
                        "Failed to copy invitation link:",
                        error,
                    );
                }
            },
            [createdResult],
        );

    /*
    |--------------------------------------------------------------------------
    | Refresh
    |--------------------------------------------------------------------------
    */

    const handleRefresh =
        useCallback(() => {
            setPageError("");

            void loadApplications();
            void loadRoles();
            void loadInvitations();
        }, [
            loadApplications,
            loadRoles,
            loadInvitations,
        ]);

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <AdminAuthGuard>
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <UserPlus className="h-6 w-6" />

                            <h1 className="text-2xl font-semibold tracking-tight">
                                Employee Invitations
                            </h1>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Invite selected job applicants to become
                            NOPTRIX employees.
                        </p>
                    </div>

                    {canCreate && (
                        <Button
                            type="button"
                            onClick={() => {
                                setCreatedResult(
                                    null,
                                );
                                setShowCreateForm(
                                    true,
                                );
                            }}
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Create Invitation
                        </Button>
                    )}
                </div>

                {/* Error */}
                {pageError && (
                    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                        <div className="flex-1">
                            <p className="font-medium">
                                Something went wrong
                            </p>

                            <p className="mt-1">
                                {pageError}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setPageError(
                                    "",
                                )
                            }
                            className="rounded-md p-1 hover:bg-red-100"
                            aria-label="Dismiss error"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Statistics */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total Invitations
                                </p>

                                <p className="mt-2 text-2xl font-semibold">
                                    {stats.total}
                                </p>
                            </div>

                            <Users className="h-6 w-6 text-muted-foreground" />
                        </div>
                    </Card>

                    <Card className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Pending
                                </p>

                                <p className="mt-2 text-2xl font-semibold">
                                    {stats.pending}
                                </p>
                            </div>

                            <Clock3 className="h-6 w-6 text-muted-foreground" />
                        </div>
                    </Card>

                    <Card className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Accepted
                                </p>

                                <p className="mt-2 text-2xl font-semibold">
                                    {stats.accepted}
                                </p>
                            </div>

                            <ShieldCheck className="h-6 w-6 text-muted-foreground" />
                        </div>
                    </Card>

                    <Card className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Expired
                                </p>

                                <p className="mt-2 text-2xl font-semibold">
                                    {stats.expired}
                                </p>
                            </div>

                            <Clock3 className="h-6 w-6 text-muted-foreground" />
                        </div>
                    </Card>
                </div>

                {/* Management */}
                <Card className="p-5">
                    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Invitation Management
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Manage invitations generated from selected
                                job applications.
                            </p>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={
                                handleRefresh
                            }
                            disabled={
                                loadingApplications ||
                                loadingRoles ||
                                loadingInvitations
                            }
                        >
                            <RefreshCw
                                className={`mr-2 h-4 w-4 ${
                                    loadingApplications ||
                                    loadingRoles ||
                                    loadingInvitations
                                        ? "animate-spin"
                                        : ""
                                }`}
                            />

                            Refresh
                        </Button>
                    </div>

                    {/* Filters */}
                    <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                            <Input
                                value={
                                    search
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setSearch(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="Search invitations..."
                                className="pl-9"
                            />
                        </div>

                        <div className="relative">
                            <select
                                value={
                                    statusFilter
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setStatusFilter(
                                        event
                                            .target
                                            .value as
                                            | "ALL"
                                            | EmployeeInvitationStatus,
                                    )
                                }
                                className="h-10 w-full appearance-none rounded-md border bg-background px-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring"
                            >
                                {INVITATION_STATUS_OPTIONS.map(
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
                                            {status ===
                                            "ALL"
                                                ? "All statuses"
                                                : status}
                                        </option>
                                    ),
                                )}
                            </select>

                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Invitation List */}
                    <div className="mt-5 overflow-hidden rounded-lg border">
                        {loadingInvitations ? (
                            <div className="flex min-h-48 items-center justify-center">
                                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredInvitations.length ===
                          0 ? (
                            <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
                                <Mail className="h-10 w-10 text-muted-foreground" />

                                <h3 className="mt-3 font-medium">
                                    No invitations found
                                </h3>

                                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                    {invitations.length ===
                                    0
                                        ? "No employee invitations have been created yet."
                                        : "Try changing the search or status filter."}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredInvitations.map(
                                    (
                                        invitation,
                                    ) => {
                                        const expanded =
                                            expandedInvitationId ===
                                            invitation._id;

                                        return (
                                            <div
                                                key={
                                                    invitation._id
                                                }
                                                className="p-4"
                                            >
                                                <button
                                                    type="button"
                                                    className="flex w-full flex-col gap-3 text-left md:flex-row md:items-center md:justify-between"
                                                    onClick={() =>
                                                        setExpandedInvitationId(
                                                            expanded
                                                                ? null
                                                                : invitation._id,
                                                        )
                                                    }
                                                >
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-medium">
                                                                {
                                                                    invitation.name
                                                                }
                                                            </span>

                                                            <Badge
                                                                variant={getStatusVariant(
                                                                    invitation.status,
                                                                )}
                                                            >
                                                                {
                                                                    invitation.status
                                                                }
                                                            </Badge>
                                                        </div>

                                                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                            <span>
                                                                {
                                                                    invitation.email
                                                                }
                                                            </span>

                                                            <span>
                                                                {
                                                                    getInvitationRoleName(
                                                                        invitation,
                                                                    )
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span className="hidden text-xs text-muted-foreground md:block">
                                                            {formatDate(
                                                                invitation.createdAt,
                                                            )}
                                                        </span>

                                                        {expanded ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </div>
                                                </button>

                                                {expanded && (
                                                    <div className="mt-4 grid gap-4 rounded-lg bg-muted/40 p-4 md:grid-cols-2">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">
                                                                Candidate
                                                            </p>

                                                            <p className="mt-1 text-sm font-medium">
                                                                {
                                                                    invitation.name
                                                                }
                                                            </p>

                                                            <p className="text-sm text-muted-foreground">
                                                                {
                                                                    invitation.email
                                                                }
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-xs text-muted-foreground">
                                                                Role
                                                            </p>

                                                            <p className="mt-1 text-sm font-medium">
                                                                {
                                                                    getInvitationRoleName(
                                                                        invitation,
                                                                    )
                                                                }
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-xs text-muted-foreground">
                                                                Application
                                                            </p>

                                                            <p className="mt-1 text-sm">
                                                                {
                                                                    getInvitationApplicationTitle(
                                                                        invitation,
                                                                    )
                                                                }
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-xs text-muted-foreground">
                                                                Created
                                                            </p>

                                                            <p className="mt-1 text-sm">
                                                                {formatDate(
                                                                    invitation.createdAt,
                                                                )}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-xs text-muted-foreground">
                                                                Expires
                                                            </p>

                                                            <p className="mt-1 text-sm">
                                                                {formatDate(
                                                                    invitation.expiresAt,
                                                                )}
                                                            </p>
                                                        </div>

                                                        {invitation.acceptedAt && (
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Accepted
                                                                </p>

                                                                <p className="mt-1 text-sm">
                                                                    {formatDate(
                                                                        invitation.acceptedAt,
                                                                    )}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {invitation.status ===
                                                            "PENDING" &&
                                                            canRevoke && (
                                                                <div className="md:col-span-2">
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        onClick={() =>
                                                                            void handleRevoke(
                                                                                invitation._id,
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            actionLoading
                                                                        }
                                                                    >
                                                                        {actionLoading
                                                                            ? "Revoking..."
                                                                            : "Revoke Invitation"}
                                                                    </Button>
                                                                </div>
                                                            )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Create Invitation Modal */}
                {showCreateForm && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
                        <div className="flex min-h-full items-center justify-center">
                            <div className="w-full max-w-3xl">
                                <Card className="max-h-[calc(100vh-2rem)] overflow-y-auto p-5 md:p-6">
                                    <div className="mb-5 flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-xl font-semibold">
                                                Create Employee Invitation
                                            </h2>

                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {requestedApplication
                                                    ? `Create an invitation for ${getApplicationApplicantName(
                                                          requestedApplication,
                                                      )}.`
                                                    : "Select a candidate whose application is already marked as SELECTED."}
                                            </p>

                                            {requestedApplication && (
                                                <div className="mt-3 rounded-lg border bg-muted/40 p-3">
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                                        <span className="font-medium">
                                                            {
                                                                getApplicationApplicantName(
                                                                    requestedApplication,
                                                                )
                                                            }
                                                        </span>

                                                        <span className="text-muted-foreground">
                                                            {
                                                                getApplicationEmail(
                                                                    requestedApplication,
                                                                )
                                                            }
                                                        </span>

                                                        <span className="text-muted-foreground">
                                                            {
                                                                getVacancyTitle(
                                                                    requestedApplication,
                                                                )
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowCreateForm(
                                                    false,
                                                )
                                            }
                                            className="rounded-md p-2 hover:bg-muted"
                                            aria-label="Close"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <EmployeeInvitationForm
                                        applications={
                                            availableApplications
                                        }
                                        roles={
                                            roles
                                        }
                                        loadingApplications={
                                            loadingApplications
                                        }
                                        loadingRoles={
                                            loadingRoles
                                        }
                                        initialApplicationId={
                                            requestedApplicationId
                                        }
                                        onCreated={
                                            handleCreated
                                        }
                                        onClose={() =>
                                            setShowCreateForm(
                                                false,
                                            )
                                        }
                                    />
                                </Card>
                            </div>
                        </div>
                    </div>
                )}

                {/* Created Invitation */}
                {createdResult && (
                    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/50 p-4">
                        <div className="flex min-h-full items-center justify-center">
                            <Card className="w-full max-w-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100">
                                        <ShieldCheck className="h-6 w-6 text-green-700" />
                                    </div>

                                    <div className="flex-1">
                                        <h2 className="text-lg font-semibold">
                                            Invitation Created
                                        </h2>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            The employee invitation has
                                            been generated successfully.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCreatedResult(
                                                null,
                                            )
                                        }
                                        className="rounded-md p-2 hover:bg-muted"
                                        aria-label="Close"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="mt-5 space-y-4">
                                    <div className="rounded-lg border p-4">
                                        <p className="text-xs text-muted-foreground">
                                            Candidate
                                        </p>

                                        <p className="mt-1 font-medium">
                                            {
                                                createdResult.name
                                            }
                                        </p>

                                        <p className="text-sm text-muted-foreground">
                                            {
                                                createdResult.email
                                            }
                                        </p>
                                    </div>

                                    <div className="rounded-lg border p-4">
                                        <p className="text-xs text-muted-foreground">
                                            Invitation Link
                                        </p>

                                        <p className="mt-2 break-all text-sm">
                                            {typeof window !==
                                            "undefined"
                                                ? `${window.location.origin}/employee-invitation/${createdResult.token}`
                                                : "Invitation link"}
                                        </p>

                                        <Button
                                            type="button"
                                            className="mt-3 w-full"
                                            onClick={
                                                handleCopyInvitationLink
                                            }
                                        >
                                            <Copy className="mr-2 h-4 w-4" />
                                            {copied
                                                ? "Copied"
                                                : "Copy Invitation Link"}
                                        </Button>
                                    </div>

                                    <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                                        <p className="font-medium">
                                            Important
                                        </p>

                                        <p className="mt-1">
                                            This token is only available
                                            in this result. Save or send
                                            the invitation link now.
                                        </p>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => {
                                            setCreatedResult(
                                                null,
                                            );
                                            setShowCreateForm(
                                                true,
                                            );
                                        }}
                                    >
                                        Create Another Invitation
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </AdminAuthGuard>
    );
}
