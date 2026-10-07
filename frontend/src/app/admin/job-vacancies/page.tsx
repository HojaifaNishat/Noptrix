"use client";

import { isAxiosError } from "axios";
import {
    Archive,
    ArrowUpRight,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    ClipboardList,
    Copy,
    Edit3,
    ExternalLink,
    Filter,
    Loader2,
    MoreHorizontal,
    Pause,
    Play,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    X,
    XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuthStore } from "@/stores/auth.store";
import { jobVacanciesApi } from "@/services/api/job-vacancies.api";
import {
    JOB_EMPLOYMENT_TYPES,
    JOB_VACANCY_STATUSES,
    type JobEmploymentType,
    type JobVacancy,
    type JobVacancyStatus,
} from "@/features/job-vacancies/job-vacancy.types";
import {
    hasAnyPermission,
} from "@/lib/permissions/permission";

const PAGE_SIZE = 10;

type ActionType =
    | "publish"
    | "pause"
    | "close"
    | "cancel"
    | "delete";

interface ActionState {
    type: ActionType;
    vacancy: JobVacancy;
}

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ");

const formatEnum = (value: string): string =>
    value
        .toLowerCase()
        .split("_")
        .map(
            (part) =>
                part.charAt(0).toUpperCase() +
                part.slice(1),
        )
        .join(" ");

const formatDate = (value?: string): string => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
};

const formatRelativeDeadline = (
    value?: string,
): string | null => {
    if (!value) return null;

    const deadline = new Date(value);

    if (Number.isNaN(deadline.getTime())) {
        return null;
    }

    const now = new Date();

    const difference =
        deadline.getTime() - now.getTime();

    const days = Math.ceil(
        difference / (1000 * 60 * 60 * 24),
    );

    if (days < 0) {
        return "Expired";
    }

    if (days === 0) {
        return "Today";
    }

    if (days === 1) {
        return "Tomorrow";
    }

    return `${days} days left`;
};

const getStatusClasses = (
    status: JobVacancyStatus,
): string => {
    switch (status) {
        case JOB_VACANCY_STATUSES.OPEN:
            return "bg-emerald-50 text-emerald-700 ring-emerald-200";

        case JOB_VACANCY_STATUSES.PAUSED:
            return "bg-amber-50 text-amber-700 ring-amber-200";

        case JOB_VACANCY_STATUSES.CLOSED:
            return "bg-slate-100 text-slate-600 ring-slate-200";

        case JOB_VACANCY_STATUSES.CANCELLED:
            return "bg-red-50 text-red-700 ring-red-200";

        default:
            return "bg-gray-100 text-gray-600 ring-gray-200";
    }
};

const getStatusIcon = (
    status: JobVacancyStatus,
) => {
    switch (status) {
        case JOB_VACANCY_STATUSES.OPEN:
            return CheckCircle2;

        case JOB_VACANCY_STATUSES.PAUSED:
            return Pause;

        case JOB_VACANCY_STATUSES.CLOSED:
            return Archive;

        case JOB_VACANCY_STATUSES.CANCELLED:
            return XCircle;

        default:
            return ClipboardList;
    }
};

const getActionTitle = (
    action: ActionState,
): string => {
    switch (action.type) {
        case "publish":
            return "Publish vacancy";

        case "pause":
            return "Pause vacancy";

        case "close":
            return "Close vacancy";

        case "cancel":
            return "Cancel vacancy";

        case "delete":
            return "Delete vacancy";
    }
};

const getActionDescription = (
    action: ActionState,
): string => {
    const title = action.vacancy.title;

    switch (action.type) {
        case "publish":
            return `Publish "${title}" so candidates can discover and apply for this position.`;

        case "pause":
            return `Pause "${title}". Candidates will no longer be able to treat this vacancy as actively open.`;

        case "close":
            return `Close "${title}". This will end the active recruitment workflow for the position.`;

        case "cancel":
            return `Cancel "${title}". This should only be used when the vacancy is no longer required.`;

        case "delete":
            return `Permanently delete "${title}". This action cannot be undone.`;
    }
};

const getActionButtonLabel = (
    type: ActionType,
): string => {
    switch (type) {
        case "publish":
            return "Publish";

        case "pause":
            return "Pause";

        case "close":
            return "Close";

        case "cancel":
            return "Cancel vacancy";

        case "delete":
            return "Delete";
    }
};

const getErrorMessage = (error: unknown): string => {
    if (isAxiosError(error)) {
        const message = error.response?.data?.message;

        if (
            typeof message === "string" &&
            message.trim()
        ) {
            return message;
        }

        if (error.message) {
            return error.message;
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Something went wrong. Please try again.";
};

const canEditVacancy = (
    vacancy: JobVacancy,
): boolean =>
    vacancy.status !== JOB_VACANCY_STATUSES.CLOSED &&
    vacancy.status !== JOB_VACANCY_STATUSES.CANCELLED;

const canPauseVacancy = (
    vacancy: JobVacancy,
): boolean =>
    vacancy.status === JOB_VACANCY_STATUSES.OPEN;

const canReopenVacancy = (
    vacancy: JobVacancy,
): boolean =>
    vacancy.status === JOB_VACANCY_STATUSES.PAUSED;

const canCloseVacancy = (
    vacancy: JobVacancy,
): boolean =>
    vacancy.status === JOB_VACANCY_STATUSES.OPEN ||
    vacancy.status === JOB_VACANCY_STATUSES.PAUSED;

const canCancelVacancy = (
    vacancy: JobVacancy,
): boolean =>
    vacancy.status === JOB_VACANCY_STATUSES.DRAFT ||
    vacancy.status === JOB_VACANCY_STATUSES.OPEN ||
    vacancy.status === JOB_VACANCY_STATUSES.PAUSED;

const canDeleteVacancy = (
    vacancy: JobVacancy,
): boolean =>
    vacancy.status === JOB_VACANCY_STATUSES.DRAFT ||
    vacancy.status === JOB_VACANCY_STATUSES.CANCELLED;

function StatusBadge({
    status,
}: {
    status: JobVacancyStatus;
}) {
    const Icon = getStatusIcon(status);

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset",
                getStatusClasses(status),
            )}
        >
            <Icon className="h-3.5 w-3.5" />
            {formatEnum(status)}
        </span>
    );
}

function EmptyState({
    hasFilters,
    onClear,
}: {
    hasFilters: boolean;
    onClear: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <BriefcaseBusiness className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-sm font-bold text-gray-900">
                {hasFilters
                    ? "No matching vacancies"
                    : "No job vacancies yet"}
            </h3>

            <p className="mt-2 max-w-sm text-xs leading-5 text-gray-500">
                {hasFilters
                    ? "Try changing your search or filters to find other vacancies."
                    : "Create your first vacancy to start building your recruitment pipeline."}
            </p>

            {hasFilters ? (
                <button
                    type="button"
                    onClick={onClear}
                    className="mt-5 inline-flex h-9 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                    <X className="h-4 w-4" />
                    Clear filters
                </button>
            ) : (
                <Link
                    href="/admin/job-vacancies/create"
                    className="mt-5 inline-flex h-9 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                    <Plus className="h-4 w-4" />
                    Create vacancy
                </Link>
            )}
        </div>
    );
}

function LoadingRows() {
    return (
        <div className="divide-y divide-gray-100">
            {Array.from({ length: 6 }).map((_, index) => (
                <div
                    key={index}
                    className="grid grid-cols-[minmax(240px,1.7fr)_1fr_1fr_90px_120px_130px_48px] items-center gap-4 px-5 py-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-100" />
                        <div className="space-y-2">
                            <div className="h-3.5 w-48 animate-pulse rounded bg-gray-100" />
                            <div className="h-3 w-28 animate-pulse rounded bg-gray-100" />
                        </div>
                    </div>

                    {Array.from({ length: 6 }).map(
                        (_, cellIndex) => (
                            <div
                                key={cellIndex}
                                className="h-3.5 w-20 animate-pulse rounded bg-gray-100"
                            />
                        ),
                    )}
                </div>
            ))}
        </div>
    );
}

export default function JobVacanciesPage() {
    const { user } = useAuthStore();

    const [vacancies, setVacancies] = useState<JobVacancy[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);

    const [searchInput, setSearchInput] =
        useState("");
    const [search, setSearch] = useState("");

    const [status, setStatus] =
        useState<JobVacancyStatus | "">("");

    const [employmentType, setEmploymentType] =
        useState<JobEmploymentType | "">("");

    const [isRemote, setIsRemote] =
        useState<boolean | undefined>(undefined);

    const [isLoading, setIsLoading] =
        useState(true);

    const [isRefreshing, setIsRefreshing] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [action, setAction] =
        useState<ActionState | null>(null);

    const [isActionLoading, setIsActionLoading] =
        useState(false);

    const [actionError, setActionError] =
        useState<string | null>(null);

    const [copiedId, setCopiedId] =
        useState<string | null>(null);

    const [openMenuId, setOpenMenuId] =
        useState<string | null>(null);

    const [expandedId, setExpandedId] =
        useState<string | null>(null);

    const isOwner =
        user?.accountType === "OWNER";

    const canCreate =
        hasAnyPermission(
            user,
            [
                "job_vacancies.create",
                "job_vacancies.manage",
            ],
        );

    const canUpdate =
        hasAnyPermission(
            user,
            [
                "job_vacancies.update",
                "job_vacancies.manage",
            ],
        );

    const canDelete =
        hasAnyPermission(
            user,
            [
                "job_vacancies.delete",
                "job_vacancies.manage",
            ],
        );

    const loadVacancies = useCallback(
        async (refresh = false) => {
            try {
                if (refresh) {
                    setIsRefreshing(true);
                } else {
                    setIsLoading(true);
                }

                setError(null);

                const response =
                    await jobVacanciesApi.getAll({
                        page,
                        limit: PAGE_SIZE,
                        search: search || undefined,
                        status: status || undefined,
                        employmentType:
                            employmentType ||
                            undefined,
                        isRemote,
                    });

                setVacancies(response.items);
                setTotal(
                    response.pagination.total,
                );
            } catch (requestError) {
                setError(
                    getErrorMessage(requestError),
                );
            } finally {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        },
        [
            employmentType,
            isRemote,
            page,
            search,
            status,
        ],
    );

    useEffect(() => {
        void loadVacancies();
    }, [loadVacancies]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 350);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [searchInput]);

    useEffect(() => {
        setOpenMenuId(null);
        setExpandedId(null);
    }, [
        page,
        search,
        status,
        employmentType,
        isRemote,
    ]);

    const totalPages = Math.max(
        1,
        Math.ceil(total / PAGE_SIZE),
    );

    const hasFilters =
        Boolean(search) ||
        Boolean(status) ||
        Boolean(employmentType) ||
        isRemote !== undefined;

    const clearFilters = () => {
        setSearchInput("");
        setSearch("");
        setStatus("");
        setEmploymentType("");
        setIsRemote(undefined);
        setPage(1);
    };

    const openAction = (
        type: ActionType,
        vacancy: JobVacancy,
    ) => {
        setActionError(null);
        setOpenMenuId(null);
        setAction({
            type,
            vacancy,
        });
    };

    const executeAction = async () => {
        if (!action) return;

        setIsActionLoading(true);
        setActionError(null);

        try {
            switch (action.type) {
                case "publish":
                    await jobVacanciesApi.publish(
                        action.vacancy.id,
                    );
                    break;

                case "pause":
                    await jobVacanciesApi.pause(
                        action.vacancy.id,
                    );
                    break;

                case "close":
                    await jobVacanciesApi.close(
                        action.vacancy.id,
                    );
                    break;

                case "cancel":
                    await jobVacanciesApi.updateStatus(
                        action.vacancy.id,
                        {
                            status:
                                JOB_VACANCY_STATUSES.CANCELLED,
                        },
                    );
                    break;

                case "delete":
                    await jobVacanciesApi.delete(
                        action.vacancy.id,
                    );
                    break;
            }

            setAction(null);
            await loadVacancies(true);
        } catch (requestError) {
            setActionError(
                getErrorMessage(requestError),
            );
        } finally {
            setIsActionLoading(false);
        }
    };

    const copyShareLink = async (
        vacancy: JobVacancy,
    ) => {
        try {
            const url = `${window.location.origin}/jobs/${encodeURIComponent(vacancy.slug)}`;

            await navigator.clipboard.writeText(url);

            setCopiedId(vacancy.id);

            window.setTimeout(() => {
                setCopiedId((current) =>
                    current === vacancy.id
                        ? null
                        : current,
                );
            }, 1800);
        } catch {
            setError(
                "Unable to copy the public vacancy link.",
            );
        }
    };

    const openPublicVacancy = (
        vacancy: JobVacancy,
    ) => {
        window.open(
            `/jobs/${encodeURIComponent(vacancy.slug)}`,
            "_blank",
            "noopener,noreferrer",
        );
    };

    const paginationStart =
        total === 0
            ? 0
            : (page - 1) * PAGE_SIZE + 1;

    const paginationEnd = Math.min(
        page * PAGE_SIZE,
        total,
    );

    const visibleVacancies = useMemo(
        () => vacancies,
        [vacancies],
    );

    return (
        <div
            className="min-h-full bg-gray-50"
            onClick={() => setOpenMenuId(null)}
        >
            <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600">
                                <BriefcaseBusiness className="h-3.5 w-3.5" />
                                Recruitment
                            </span>

                            {total > 0 ? (
                                <span className="text-xs text-gray-400">
                                    {total.toLocaleString()}{" "}
                                    total
                                </span>
                            ) : null}
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-gray-950">
                            Job Vacancies
                        </h1>

                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Manage positions, recruitment
                            status and candidate-facing job
                            listings.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                void loadVacancies(true)
                            }
                            disabled={
                                isLoading ||
                                isRefreshing
                            }
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCw
                                className={cn(
                                    "h-4 w-4",
                                    isRefreshing &&
                                        "animate-spin",
                                )}
                            />
                            Refresh
                        </button>

                        {canCreate || isOwner ? (
                            <Link
                                href="/admin/job-vacancies/create"
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                            >
                                <Plus className="h-4 w-4" />
                                Create Vacancy
                            </Link>
                        ) : null}
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                        <div className="relative min-w-0 flex-1">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                            <input
                                value={searchInput}
                                onChange={(event) =>
                                    setSearchInput(
                                        event.target.value,
                                    )
                                }
                                placeholder="Search by position, job title or department..."
                                className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                            />

                            {searchInput ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearchInput("")
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                    aria-label="Clear search"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            ) : null}
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative min-w-[170px]">
                                <select
                                    value={status}
                                    onChange={(event) => {
                                        setStatus(
                                            event.target
                                                .value as
                                                | JobVacancyStatus
                                                | "",
                                        );
                                        setPage(1);
                                    }}
                                    className="h-10 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 pr-9 text-xs font-medium text-gray-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                                >
                                    <option value="">
                                        All statuses
                                    </option>

                                    {Object.values(
                                        JOB_VACANCY_STATUSES,
                                    ).map((item) => (
                                        <option
                                            key={item}
                                            value={item}
                                        >
                                            {formatEnum(item)}
                                        </option>
                                    ))}
                                </select>

                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            </div>

                            <div className="relative min-w-[180px]">
                                <select
                                    value={
                                        employmentType
                                    }
                                    onChange={(event) => {
                                        setEmploymentType(
                                            event.target.value as JobEmploymentType | "",
                                        );
                                        setPage(1);
                                    }}
                                    className="h-10 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 pr-9 text-xs font-medium text-gray-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                                >
                                    <option value="">
                                        All employment types
                                    </option>

                                    {Object.values(
                                        JOB_EMPLOYMENT_TYPES,
                                    ).map((item) => (
                                        <option
                                            key={item}
                                            value={item}
                                        >
                                            {formatEnum(item)}
                                        </option>
                                    ))}
                                </select>

                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            </div>

                            <div className="relative min-w-[150px]">
                                <select
                                    value={
                                        isRemote ===
                                        undefined
                                            ? ""
                                            : isRemote
                                              ? "true"
                                              : "false"
                                    }
                                    onChange={(event) => {
                                        const value =
                                            event.target
                                                .value;

                                        setIsRemote(
                                            value === ""
                                                ? undefined
                                                : value ===
                                                    "true",
                                        );

                                        setPage(1);
                                    }}
                                    className="h-10 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 pr-9 text-xs font-medium text-gray-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                                >
                                    <option value="">
                                        All locations
                                    </option>
                                    <option value="true">
                                        Remote
                                    </option>
                                    <option value="false">
                                        On-site
                                    </option>
                                </select>

                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            </div>

                            {hasFilters ? (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 px-3.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                                >
                                    <Filter className="h-4 w-4" />
                                    Clear
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {hasFilters ? (
                        <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-400">
                            <Filter className="h-3.5 w-3.5" />
                            Filters are active
                        </div>
                    ) : null}
                </div>

                {/* Error */}
                {error ? (
                    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
                        <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />

                        <div className="min-w-0">
                            <p className="text-sm font-semibold">
                                Unable to load vacancies
                            </p>

                            <p className="mt-1 text-xs leading-5 text-red-700">
                                {error}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setError(null)
                            }
                            className="ml-auto rounded-lg p-1 text-red-400 hover:bg-red-100 hover:text-red-700"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : null}

                {/* Main table */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-gray-900">
                                Vacancy pipeline
                            </h2>

                            <p className="mt-1 text-xs text-gray-500">
                                Showing{" "}
                                <span className="font-semibold text-gray-800">
                                    {vacancies.length}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-gray-800">
                                    {total}
                                </span>{" "}
                                vacancies
                            </p>
                        </div>

                        {isRefreshing ? (
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Refreshing...
                            </div>
                        ) : null}
                    </div>

                    {isLoading ? (
                        <LoadingRows />
                    ) : visibleVacancies.length === 0 ? (
                        <EmptyState
                            hasFilters={hasFilters}
                            onClear={clearFilters}
                        />
                    ) : (
                        <>
                            {/* Desktop */}
                            <div className="hidden overflow-x-auto xl:block">
                                <table className="w-full min-w-[1180px]">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/70 text-left">
                                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">
                                                Position
                                            </th>
                                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">
                                                Department
                                            </th>
                                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">
                                                Employment
                                            </th>
                                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">
                                                Openings
                                            </th>
                                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">
                                                Deadline
                                            </th>
                                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">
                                                Share
                                            </th>
                                            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {visibleVacancies.map(
                                            (vacancy) => {
                                                const isExpanded =
                                                    expandedId ===
                                                    vacancy.id;

                                                const deadlineLabel =
                                                    formatRelativeDeadline(
                                                        vacancy.applicationDeadline,
                                                    );

                                                return (
                                                    <tr
                                                        key={
                                                            vacancy.id
                                                        }
                                                        className="group align-top transition hover:bg-gray-50/70"
                                                    >
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-start gap-3">
                                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                                                    <BriefcaseBusiness className="h-4 w-4" />
                                                                </div>

                                                                <div className="min-w-0">
                                                                    <Link
                                                                        href={`/admin/job-vacancies/${vacancy.id}`}
                                                                        className="line-clamp-2 text-sm font-semibold text-gray-900 transition hover:text-slate-600"
                                                                    >
                                                                        {
                                                                            vacancy.title
                                                                        }
                                                                    </Link>

                                                                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-400">
                                                                        <span>
                                                                            {
                                                                                vacancy.jobTitle
                                                                            }
                                                                        </span>

                                                                        <span>
                                                                            •
                                                                        </span>

                                                                        <span>
                                                                            {vacancy.isRemote
                                                                                ? "Remote"
                                                                                : vacancy.location ||
                                                                                  "Location not specified"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <span className="text-xs font-medium text-gray-700">
                                                                {
                                                                    vacancy.department
                                                                }
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <span className="text-xs text-gray-600">
                                                                {formatEnum(
                                                                    vacancy.employmentType,
                                                                )}
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <span className="text-xs font-semibold text-gray-700">
                                                                {
                                                                    vacancy.openings
                                                                }
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <StatusBadge
                                                                status={
                                                                    vacancy.status
                                                                }
                                                            />
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            {vacancy.applicationDeadline ? (
                                                                <div>
                                                                    <p className="text-xs font-medium text-gray-700">
                                                                        {formatDate(
                                                                            vacancy.applicationDeadline,
                                                                        )}
                                                                    </p>

                                                                    {deadlineLabel ? (
                                                                        <p
                                                                            className={cn(
                                                                                "mt-1 text-[10px] font-medium",
                                                                                deadlineLabel ===
                                                                                    "Expired"
                                                                                    ? "text-red-500"
                                                                                    : "text-gray-400",
                                                                            )}
                                                                        >
                                                                            {
                                                                                deadlineLabel
                                                                            }
                                                                        </p>
                                                                    ) : null}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-gray-400">
                                                                    No deadline
                                                                </span>
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            {vacancy.status ===
                                                            JOB_VACANCY_STATUSES.OPEN ? (
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            void copyShareLink(
                                                                                vacancy,
                                                                            )
                                                                        }
                                                                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50"
                                                                    >
                                                                        {copiedId ===
                                                                        vacancy.id ? (
                                                                            <>
                                                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                                                Copied
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Copy className="h-3.5 w-3.5" />
                                                                                Copy
                                                                            </>
                                                                        )}
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openPublicVacancy(
                                                                                vacancy,
                                                                            )
                                                                        }
                                                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
                                                                        aria-label="Open public vacancy"
                                                                    >
                                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-gray-300">
                                                                    —
                                                                </span>
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Link
                                                                    href={`/admin/job-vacancies/${vacancy.id}`}
                                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-800"
                                                                    aria-label="View vacancy"
                                                                >
                                                                    <ArrowUpRight className="h-4 w-4" />
                                                                </Link>

                                                                {(canUpdate ||
                                                                    isOwner) &&
                                                                canEditVacancy(
                                                                    vacancy,
                                                                ) ? (
                                                                    <Link
                                                                        href={`/admin/job-vacancies/${vacancy.id}/edit`}
                                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-800"
                                                                        aria-label="Edit vacancy"
                                                                    >
                                                                        <Edit3 className="h-4 w-4" />
                                                                    </Link>
                                                                ) : null}

                                                                <div
                                                                    className="relative"
                                                                    onClick={(
                                                                        event,
                                                                    ) =>
                                                                        event.stopPropagation()
                                                                    }
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setOpenMenuId(
                                                                                (
                                                                                    current,
                                                                                ) =>
                                                                                    current ===
                                                                                    vacancy.id
                                                                                        ? null
                                                                                        : vacancy.id,
                                                                            )
                                                                        }
                                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-800"
                                                                        aria-label="More actions"
                                                                    >
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </button>

                                                                    {openMenuId ===
                                                                    vacancy.id ? (
                                                                        <div className="absolute right-0 top-9 z-30 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
                                                                            {canUpdate &&
                                                                            canPauseVacancy(
                                                                                vacancy,
                                                                            ) ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        openAction(
                                                                                            "pause",
                                                                                            vacancy,
                                                                                        )
                                                                                    }
                                                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                                                >
                                                                                    <Pause className="h-3.5 w-3.5" />
                                                                                    Pause vacancy
                                                                                </button>
                                                                            ) : null}

                                                                            {canUpdate &&
                                                                            canReopenVacancy(
                                                                                vacancy,
                                                                            ) ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        openAction(
                                                                                            "publish",
                                                                                            vacancy,
                                                                                        )
                                                                                    }
                                                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                                                >
                                                                                    <Play className="h-3.5 w-3.5" />
                                                                                    Reopen vacancy
                                                                                </button>
                                                                            ) : null}

                                                                            {canUpdate &&
                                                                            canCloseVacancy(
                                                                                vacancy,
                                                                            ) ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        openAction(
                                                                                            "close",
                                                                                            vacancy,
                                                                                        )
                                                                                    }
                                                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                                                >
                                                                                    <Archive className="h-3.5 w-3.5" />
                                                                                    Close vacancy
                                                                                </button>
                                                                            ) : null}

                                                                            {canUpdate &&
                                                                            canCancelVacancy(
                                                                                vacancy,
                                                                            ) ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        openAction(
                                                                                            "cancel",
                                                                                            vacancy,
                                                                                        )
                                                                                    }
                                                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                                                                                >
                                                                                    <XCircle className="h-3.5 w-3.5" />
                                                                                    Cancel vacancy
                                                                                </button>
                                                                            ) : null}

                                                                            {canDelete &&
                                                                            canDeleteVacancy(
                                                                                vacancy,
                                                                            ) ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        openAction(
                                                                                            "delete",
                                                                                            vacancy,
                                                                                        )
                                                                                    }
                                                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                                                                                >
                                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                                    Delete vacancy
                                                                                </button>
                                                                            ) : null}
                                                                        </div>
                                                                    ) : null}
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setExpandedId(
                                                                            (
                                                                                current,
                                                                            ) =>
                                                                                current ===
                                                                                vacancy.id
                                                                                    ? null
                                                                                    : vacancy.id,
                                                                        )
                                                                    }
                                                                    className={cn(
                                                                        "flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-800",
                                                                        isExpanded &&
                                                                            "bg-gray-100 text-gray-800",
                                                                    )}
                                                                    aria-label="Toggle vacancy details"
                                                                >
                                                                    <ChevronDown
                                                                        className={cn(
                                                                            "h-4 w-4 transition",
                                                                            isExpanded &&
                                                                                "rotate-180",
                                                                        )}
                                                                    />
                                                                </button>
                                                            </div>

                                                            {isExpanded ? (
                                                                <div className="mt-3 max-w-sm rounded-xl border border-gray-100 bg-gray-50 p-3 text-left">
                                                                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                                                                        <div>
                                                                            <p className="text-gray-400">
                                                                                Created
                                                                            </p>
                                                                            <p className="mt-1 font-medium text-gray-700">
                                                                                {formatDate(
                                                                                    vacancy.createdAt,
                                                                                )}
                                                                            </p>
                                                                        </div>

                                                                        <div>
                                                                            <p className="text-gray-400">
                                                                                Updated
                                                                            </p>
                                                                            <p className="mt-1 font-medium text-gray-700">
                                                                                {formatDate(
                                                                                    vacancy.updatedAt,
                                                                                )}
                                                                            </p>
                                                                        </div>

                                                                        <div>
                                                                            <p className="text-gray-400">
                                                                                Salary
                                                                            </p>
                                                                            <p className="mt-1 font-medium text-gray-700">
                                                                                {vacancy.salaryType ===
                                                                                "RANGE"
                                                                                    ? `${vacancy.salaryCurrency ?? "BDT"} ${vacancy.salaryMin?.toLocaleString() ?? "—"} – ${vacancy.salaryMax?.toLocaleString() ?? "—"}`
                                                                                    : formatEnum(
                                                                                          vacancy.salaryType,
                                                                                      )}
                                                                            </p>
                                                                        </div>

                                                                        <div>
                                                                            <p className="text-gray-400">
                                                                                Slug
                                                                            </p>
                                                                            <p className="mt-1 truncate font-medium text-gray-700">
                                                                                {
                                                                                    vacancy.slug
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : null}
                                                        </td>
                                                    </tr>
                                                );
                                            },
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile / tablet */}
                            <div className="divide-y divide-gray-100 xl:hidden">
                                {visibleVacancies.map(
                                    (vacancy) => {
                                        const isExpanded =
                                            expandedId ===
                                            vacancy.id;

                                        return (
                                            <div
                                                key={
                                                    vacancy.id
                                                }
                                                className="p-4 sm:p-5"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                                        <BriefcaseBusiness className="h-4 w-4" />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <Link
                                                                    href={`/admin/job-vacancies/${vacancy.id}`}
                                                                    className="line-clamp-2 text-sm font-bold text-gray-900 hover:text-slate-600"
                                                                >
                                                                    {
                                                                        vacancy.title
                                                                    }
                                                                </Link>

                                                                <p className="mt-1 text-xs text-gray-400">
                                                                    {
                                                                        vacancy.department
                                                                    }
                                                                </p>
                                                            </div>

                                                            <StatusBadge
                                                                status={
                                                                    vacancy.status
                                                                }
                                                            />
                                                        </div>

                                                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                                            <div>
                                                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                                                    Employment
                                                                </p>
                                                                <p className="mt-1 text-xs font-medium text-gray-700">
                                                                    {formatEnum(
                                                                        vacancy.employmentType,
                                                                    )}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                                                    Openings
                                                                </p>
                                                                <p className="mt-1 text-xs font-medium text-gray-700">
                                                                    {
                                                                        vacancy.openings
                                                                    }
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                                                    Location
                                                                </p>
                                                                <p className="mt-1 truncate text-xs font-medium text-gray-700">
                                                                    {vacancy.isRemote
                                                                        ? "Remote"
                                                                        : vacancy.location ||
                                                                          "—"}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                                                    Deadline
                                                                </p>
                                                                <p className="mt-1 text-xs font-medium text-gray-700">
                                                                    {formatDate(
                                                                        vacancy.applicationDeadline,
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                                            <Link
                                                                href={`/admin/job-vacancies/${vacancy.id}`}
                                                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                                                            >
                                                                <ArrowUpRight className="h-3.5 w-3.5" />
                                                                View
                                                            </Link>

                                                            {(canUpdate ||
                                                                isOwner) &&
                                                            canEditVacancy(
                                                                vacancy,
                                                            ) ? (
                                                                <Link
                                                                    href={`/admin/job-vacancies/${vacancy.id}/edit`}
                                                                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                                                                >
                                                                    <Edit3 className="h-3.5 w-3.5" />
                                                                    Edit
                                                                </Link>
                                                            ) : null}

                                                            {vacancy.status ===
                                                            JOB_VACANCY_STATUSES.OPEN ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        void copyShareLink(
                                                                            vacancy,
                                                                        )
                                                                    }
                                                                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                                                                >
                                                                    <Copy className="h-3.5 w-3.5" />
                                                                    {copiedId ===
                                                                    vacancy.id
                                                                        ? "Copied"
                                                                        : "Share"}
                                                                </button>
                                                            ) : null}

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setExpandedId(
                                                                        (
                                                                            current,
                                                                        ) =>
                                                                            current ===
                                                                            vacancy.id
                                                                                ? null
                                                                                : vacancy.id,
                                                                    )
                                                                }
                                                                className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                                                            >
                                                                Details
                                                                <ChevronDown
                                                                    className={cn(
                                                                        "h-3.5 w-3.5 transition",
                                                                        isExpanded &&
                                                                            "rotate-180",
                                                                    )}
                                                                />
                                                            </button>
                                                        </div>

                                                        {isExpanded ? (
                                                            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
                                                                <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                                                                    <div>
                                                                        <p className="text-gray-400">
                                                                            Created
                                                                        </p>
                                                                        <p className="mt-1 font-medium text-gray-700">
                                                                            {formatDate(
                                                                                vacancy.createdAt,
                                                                            )}
                                                                        </p>
                                                                    </div>

                                                                    <div>
                                                                        <p className="text-gray-400">
                                                                            Updated
                                                                        </p>
                                                                        <p className="mt-1 font-medium text-gray-700">
                                                                            {formatDate(
                                                                                vacancy.updatedAt,
                                                                            )}
                                                                        </p>
                                                                    </div>

                                                                    <div>
                                                                        <p className="text-gray-400">
                                                                            Salary
                                                                        </p>
                                                                        <p className="mt-1 font-medium text-gray-700">
                                                                            {vacancy.salaryType ===
                                                                            "RANGE"
                                                                                ? `${vacancy.salaryCurrency ?? "BDT"} ${vacancy.salaryMin?.toLocaleString() ?? "—"} – ${vacancy.salaryMax?.toLocaleString() ?? "—"}`
                                                                                : formatEnum(
                                                                                      vacancy.salaryType,
                                                                                  )}
                                                                        </p>
                                                                    </div>

                                                                    <div>
                                                                        <p className="text-gray-400">
                                                                            Slug
                                                                        </p>
                                                                        <p className="mt-1 break-all font-medium text-gray-700">
                                                                            {
                                                                                vacancy.slug
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        </>
                    )}

                    {/* Pagination */}
                    {!isLoading &&
                    visibleVacancies.length > 0 ? (
                        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-gray-500">
                                Showing{" "}
                                <span className="font-semibold text-gray-800">
                                    {paginationStart}
                                </span>
                                –
                                <span className="font-semibold text-gray-800">
                                    {paginationEnd}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-gray-800">
                                    {total}
                                </span>
                            </p>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    disabled={
                                        page <= 1
                                    }
                                    onClick={() =>
                                        setPage(
                                            (current) =>
                                                Math.max(
                                                    1,
                                                    current -
                                                        1,
                                                ),
                                        )
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                <span className="px-2 text-xs font-semibold text-gray-600">
                                    Page {page} of{" "}
                                    {totalPages}
                                </span>

                                <button
                                    type="button"
                                    disabled={
                                        page >=
                                        totalPages
                                    }
                                    onClick={() =>
                                        setPage(
                                            (current) =>
                                                Math.min(
                                                    totalPages,
                                                    current +
                                                        1,
                                                ),
                                        )
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Next page"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-gray-400">
                    <span className="font-semibold text-gray-500">
                        Status:
                    </span>

                    {Object.values(
                        JOB_VACANCY_STATUSES,
                    ).map((item) => (
                        <span
                            key={item}
                            className="inline-flex items-center gap-1.5"
                        >
                            <span
                                className={cn(
                                    "h-2 w-2 rounded-full",
                                    item ===
                                        JOB_VACANCY_STATUSES.OPEN &&
                                        "bg-emerald-500",
                                    item ===
                                        JOB_VACANCY_STATUSES.PAUSED &&
                                        "bg-amber-500",
                                    item ===
                                        JOB_VACANCY_STATUSES.CLOSED &&
                                        "bg-slate-400",
                                    item ===
                                        JOB_VACANCY_STATUSES.CANCELLED &&
                                        "bg-red-500",
                                    item ===
                                        JOB_VACANCY_STATUSES.DRAFT &&
                                        "bg-gray-400",
                                )}
                            />
                            {formatEnum(item)}
                        </span>
                    ))}
                </div>
            </div>

            {/* Confirmation modal */}
            {action ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
                    onClick={() =>
                        !isActionLoading &&
                        setAction(null)
                    }
                >
                    <div
                        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={cn(
                                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                                    action.type ===
                                        "delete" ||
                                        action.type ===
                                            "cancel"
                                        ? "bg-red-50 text-red-600"
                                        : "bg-slate-100 text-slate-700",
                                )}
                            >
                                {action.type ===
                                    "delete" ||
                                action.type ===
                                    "cancel" ? (
                                    <Trash2 className="h-5 w-5" />
                                ) : (
                                    <BriefcaseBusiness className="h-5 w-5" />
                                )}
                            </div>

                            <div className="min-w-0">
                                <h3 className="text-sm font-bold text-gray-900">
                                    {getActionTitle(
                                        action,
                                    )}
                                </h3>

                                <p className="mt-2 text-xs leading-5 text-gray-500">
                                    {getActionDescription(
                                        action,
                                    )}
                                </p>
                            </div>

                            <button
                                type="button"
                                disabled={
                                    isActionLoading
                                }
                                onClick={() =>
                                    setAction(null)
                                }
                                className="ml-auto rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {actionError ? (
                            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
                                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />

                                <p className="text-xs leading-5">
                                    {actionError}
                                </p>
                            </div>
                        ) : null}

                        <div className="mt-5 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                disabled={
                                    isActionLoading
                                }
                                onClick={() =>
                                    setAction(null)
                                }
                                className="inline-flex h-9 items-center rounded-xl border border-gray-200 px-3.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Keep
                            </button>

                            <button
                                type="button"
                                disabled={
                                    isActionLoading
                                }
                                onClick={() =>
                                    void executeAction()
                                }
                                className={cn(
                                    "inline-flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50",
                                    action.type ===
                                        "delete" ||
                                        action.type ===
                                            "cancel"
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-slate-900 hover:bg-slate-800",
                                )}
                            >
                                {isActionLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    getActionButtonLabel(
                                        action.type,
                                    )
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}