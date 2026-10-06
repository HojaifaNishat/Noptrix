"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    BriefcaseBusiness,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock3,
    ExternalLink,
    FileCheck,
    Mail,
    Phone,
    RefreshCw,
    Search,
    Users,
    XCircle,
} from "lucide-react";

import { jobApplicationsApi } from "@/services/api/job-applications.api";
import JobApplicationReviewForm from "@/features/job-applications/job-application-review-form";
import { jobVacanciesApi } from "@/services/api/job-vacancies.api";

import type {
    JobVacancy,
} from "@/features/job-vacancies/job-vacancy.types";

import {
    JOB_APPLICATION_STATUSES,
    type JobApplication,
    type JobApplicationStatus,
    type UpdateJobApplicationInput,
} from "@/features/job-applications/job-application.types";


/*
|--------------------------------------------------------------------------
| Status Configuration
|--------------------------------------------------------------------------
*/

const STATUS_TRANSITIONS: Record<
    JobApplicationStatus,
    JobApplicationStatus[]
> = {
    SUBMITTED: [
        "UNDER_REVIEW",
        "REJECTED",
    ],

    UNDER_REVIEW: [
        "SHORTLISTED",
        "REJECTED",
    ],

    SHORTLISTED: [
        "INTERVIEW",
        "REJECTED",
    ],

    INTERVIEW: [
        "SELECTED",
        "REJECTED",
    ],

    SELECTED: [],

    REJECTED: [],

    WITHDRAWN: [],
};


const STATUS_STYLES: Record<
    JobApplicationStatus,
    string
> = {
    SUBMITTED:
        "bg-blue-50 text-blue-700 ring-blue-600/10",

    UNDER_REVIEW:
        "bg-amber-50 text-amber-700 ring-amber-600/10",

    SHORTLISTED:
        "bg-violet-50 text-violet-700 ring-violet-600/10",

    INTERVIEW:
        "bg-indigo-50 text-indigo-700 ring-indigo-600/10",

    SELECTED:
        "bg-emerald-50 text-emerald-700 ring-emerald-600/10",

    REJECTED:
        "bg-red-50 text-red-700 ring-red-600/10",

    WITHDRAWN:
        "bg-gray-100 text-gray-600 ring-gray-500/10",
};


const STATUS_ICONS: Record<
    JobApplicationStatus,
    typeof FileCheck
> = {
    SUBMITTED: FileCheck,
    UNDER_REVIEW: Clock3,
    SHORTLISTED: Users,
    INTERVIEW: Clock3,
    SELECTED: CheckCircle2,
    REJECTED: XCircle,
    WITHDRAWN: XCircle,
};


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const formatStatus = (
    status: JobApplicationStatus,
): string =>
    status
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) =>
            character.toUpperCase(),
        );


const formatDate = (
    value?: string | Date,
): string => {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric",
        },
    );
};


const formatDateTime = (
    value?: string | Date,
): string => {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        },
    );
};


const getVacancyTitle = (
    application: JobApplication,
): string => {
    if (
        typeof application.vacancyId === "object" &&
        application.vacancyId
    ) {
        return (
            application.vacancyId.title ||
            application.vacancyId.jobTitle ||
            "Job vacancy"
        );
    }

    return "Job vacancy";
};


const getInitials = (
    name: string,
): string =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("") || "?";


/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function JobApplicationsPage() {
    const [applications, setApplications] =
        useState<JobApplication[]>([]);

    const [vacancies, setVacancies] =
        useState<JobVacancy[]>([]);

    const [searchInput, setSearchInput] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [status, setStatus] =
        useState<JobApplicationStatus | "">("");

    const [vacancyId, setVacancyId] =
        useState("");

    const [page, setPage] =
        useState(1);

    const [total, setTotal] =
        useState(0);

    const [totalPages, setTotalPages] =
        useState(0);

    const [expandedId, setExpandedId] =
        useState<string | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [updatingId, setUpdatingId] =
        useState<string | null>(null);

    const [error, setError] =
        useState("");

    const searchTimerRef =
        useRef<ReturnType<typeof setTimeout> | null>(null);


    /*
    |--------------------------------------------------------------------------
    | Search Debounce
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }

        searchTimerRef.current =
            setTimeout(() => {
                setSearch(
                    searchInput.trim(),
                );

                setPage(1);
                setLoading(true);
            }, 350);

        return () => {
            if (searchTimerRef.current) {
                clearTimeout(
                    searchTimerRef.current,
                );
            }
        };
    }, [searchInput]);


    /*
    |--------------------------------------------------------------------------
    | Load Applications
    |--------------------------------------------------------------------------
    */

    const loadApplications =
        useCallback(
            async (
                options?: {
                    silent?: boolean;
                },
            ) => {
                const silent =
                    options?.silent ?? false;

                try {
                    if (silent) {
                        setRefreshing(true);
                    } else {
                        setLoading(true);
                    }

                    setError("");

                    const result =
                        await jobApplicationsApi.getAll({
                            page,
                            limit: 20,
                            search:
                                search ||
                                undefined,
                            status:
                                status ||
                                undefined,
                            vacancyId:
                                vacancyId ||
                                undefined,
                        });

                    setApplications(
                        result.applications,
                    );

                    setTotal(
                        result.pagination.total,
                    );

                    setTotalPages(
                        result.pagination.totalPages,
                    );
                } catch {
                    setError(
                        "Unable to load job applications.",
                    );
                } finally {
                    setLoading(false);
                    setRefreshing(false);
                }
            },
            [
                page,
                search,
                status,
                vacancyId,
            ],
        );


    useEffect(() => {
        void loadApplications();
    }, [loadApplications]);


    /*
    |--------------------------------------------------------------------------
    | Load Vacancies
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        let mounted = true;

        const loadVacancies =
            async () => {
                try {
                    const result =
                        await jobVacanciesApi.getAll({
                            limit: 100,
                        });

                    if (mounted) {
                        setVacancies(
                            result.items,
                        );
                    }
                } catch {
                    if (mounted) {
                        setError(
                            "Unable to load vacancy filters.",
                        );
                    }
                }
            };

        void loadVacancies();

        return () => {
            mounted = false;
        };
    }, []);


    /*
    |--------------------------------------------------------------------------
    | Statistics
    |--------------------------------------------------------------------------
    */

    const statistics =
        useMemo(() => {
            const counts: Record<
                JobApplicationStatus,
                number
            > = {
                SUBMITTED: 0,
                UNDER_REVIEW: 0,
                SHORTLISTED: 0,
                INTERVIEW: 0,
                SELECTED: 0,
                REJECTED: 0,
                WITHDRAWN: 0,
            };

            for (const application of applications) {
                counts[
                    application.status
                ] += 1;
            }

            return counts;
        }, [applications]);


    /*
    |--------------------------------------------------------------------------
    | Status Update
    |--------------------------------------------------------------------------
    */

    const updateStatus =
        useCallback(
            async (
                applicationId: string,
                input: UpdateJobApplicationInput,
            ) => {
                try {
                    setUpdatingId(
                        applicationId,
                    );

                    setError("");

                    const updated =
                        await jobApplicationsApi.updateStatus(
                            applicationId,
                            input,
                        );

                    setApplications(
                        (current) =>
                            current.map(
                                (
                                    application,
                                ) =>
                                    application._id ===
                                    applicationId
                                        ? {
                                              ...application,
                                              ...updated,
                                              vacancyId:
                                                  application.vacancyId,
                                          }
                                        : application,
                            ),
                    );
                } catch {
                    setError(
                        "Unable to save the candidate review.",
                    );
                } finally {
                    setUpdatingId(
                        null,
                    );
                }
            },
            [],
        );


    /*
    |--------------------------------------------------------------------------
    | Filter Helpers
    |--------------------------------------------------------------------------
    */

    const handleStatusFilter =
        (
            value: string,
        ) => {
            setStatus(
                value as
                    | JobApplicationStatus
                    | "",
            );

            setPage(1);
            setLoading(true);
            setExpandedId(null);
        };


    const handleVacancyFilter =
        (
            value: string,
        ) => {
            setVacancyId(value);

            setPage(1);
            setLoading(true);
            setExpandedId(null);
        };


    const clearFilters =
        () => {
            setSearchInput("");
            setSearch("");
            setStatus("");
            setVacancyId("");
            setPage(1);
            setExpandedId(null);
            setLoading(true);
        };


    const hasFilters =
        Boolean(
            search ||
            status ||
            vacancyId,
        );


    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <main className="min-h-full bg-gray-50/50 p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-[1600px]">
                {/* Header */}
                <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white shadow-sm">
                                <BriefcaseBusiness
                                    size={22}
                                />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
                                    Job Applications
                                </h1>

                                <p className="mt-1 text-sm text-gray-500">
                                    Review candidates and manage recruitment progress.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            void loadApplications({
                                silent: true,
                            })
                        }
                        disabled={
                            loading ||
                            refreshing
                        }
                        className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={
                                refreshing
                                    ? "animate-spin"
                                    : ""
                            }
                        />
                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>
                </div>


                {/* Statistics */}
                <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
                    <StatCard
                        label="Total"
                        value={total}
                        icon={FileCheck}
                    />

                    <StatCard
                        label="Submitted"
                        value={
                            statistics.SUBMITTED
                        }
                        icon={FileCheck}
                    />

                    <StatCard
                        label="Review"
                        value={
                            statistics.UNDER_REVIEW
                        }
                        icon={Clock3}
                    />

                    <StatCard
                        label="Shortlisted"
                        value={
                            statistics.SHORTLISTED
                        }
                        icon={Users}
                    />

                    <StatCard
                        label="Interview"
                        value={
                            statistics.INTERVIEW
                        }
                        icon={Clock3}
                    />

                    <StatCard
                        label="Selected"
                        value={
                            statistics.SELECTED
                        }
                        icon={CheckCircle2}
                    />

                    <StatCard
                        label="Rejected"
                        value={
                            statistics.REJECTED
                        }
                        icon={XCircle}
                    />
                </div>


                {/* Filters */}
                <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
                        <div className="min-w-0 flex-1">
                            <label
                                htmlFor="application-search"
                                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500"
                            >
                                Search
                            </label>

                            <div className="relative">
                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    id="application-search"
                                    type="search"
                                    value={
                                        searchInput
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setSearchInput(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Search by candidate name or email..."
                                    className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
                                />
                            </div>
                        </div>


                        <div className="w-full xl:w-56">
                            <label
                                htmlFor="application-status"
                                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500"
                            >
                                Status
                            </label>

                            <select
                                id="application-status"
                                value={status}
                                onChange={(
                                    event,
                                ) =>
                                    handleStatusFilter(
                                        event.target.value,
                                    )
                                }
                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
                            >
                                <option value="">
                                    All statuses
                                </option>

                                {JOB_APPLICATION_STATUSES.map(
                                    (
                                        item,
                                    ) => (
                                        <option
                                            key={
                                                item
                                            }
                                            value={
                                                item
                                            }
                                        >
                                            {formatStatus(
                                                item,
                                            )}
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>


                        <div className="w-full xl:w-72">
                            <label
                                htmlFor="application-vacancy"
                                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500"
                            >
                                Vacancy
                            </label>

                            <select
                                id="application-vacancy"
                                value={
                                    vacancyId
                                }
                                onChange={(
                                    event,
                                ) =>
                                    handleVacancyFilter(
                                        event.target.value,
                                    )
                                }
                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
                            >
                                <option value="">
                                    All vacancies
                                </option>

                                {vacancies.map(
                                    (
                                        vacancy,
                                    ) => (
                                        <option
                                            key={
                                                vacancy.id
                                            }
                                            value={
                                                vacancy.id
                                            }
                                        >
                                            {
                                                vacancy.title
                                            }
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>


                        {hasFilters && (
                            <button
                                type="button"
                                onClick={
                                    clearFilters
                                }
                                className="inline-flex h-[42px] items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                                <XCircle
                                    size={16}
                                />
                                Clear
                            </button>
                        )}
                    </div>
                </section>


                {/* Error */}
                {error && (
                    <div
                        role="alert"
                        className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <span>
                            {error}
                        </span>

                        <button
                            type="button"
                            onClick={() => {
                                setError("");
                                void loadApplications();
                            }}
                            className="font-semibold underline underline-offset-2"
                        >
                            Try again
                        </button>
                    </div>
                )}


                {/* Results Header */}
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-gray-500">
                        Showing{" "}
                        <span className="font-semibold text-gray-800">
                            {applications.length}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-gray-800">
                            {total}
                        </span>{" "}
                        applications
                    </div>

                    {hasFilters && (
                        <div className="text-xs text-gray-400">
                            Filters are active
                        </div>
                    )}
                </div>


                {/* Applications Table */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1050px] text-left">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Candidate
                                    </th>

                                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Position
                                    </th>

                                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Applied
                                    </th>

                                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Status
                                    </th>

                                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Next action
                                    </th>

                                    <th className="w-12 px-3 py-4" />
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <ApplicationSkeletonRows />
                                ) : applications.length ===
                                  0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-16 text-center"
                                        >
                                            <div className="mx-auto flex max-w-sm flex-col items-center">
                                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                                                    <BriefcaseBusiness
                                                        size={
                                                            22
                                                        }
                                                        className="text-gray-400"
                                                    />
                                                </div>

                                                <h2 className="text-sm font-semibold text-gray-900">
                                                    No applications found
                                                </h2>

                                                <p className="mt-1 text-sm leading-6 text-gray-500">
                                                    Try changing your search or filters.
                                                </p>

                                                {hasFilters && (
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            clearFilters
                                                        }
                                                        className="mt-4 text-sm font-semibold text-gray-900 underline underline-offset-4"
                                                    >
                                                        Clear filters
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    applications.map(
                                        (
                                            application,
                                        ) => {
                                            const nextStatuses =
                                                STATUS_TRANSITIONS[
                                                    application.status
                                                ];

                                            const StatusIcon =
                                                STATUS_ICONS[
                                                    application.status
                                                ];

                                            const isExpanded =
                                                expandedId ===
                                                application._id;

                                            const isUpdating =
                                                updatingId ===
                                                application._id;

                                            return (
                                                <ApplicationRow
                                                    key={
                                                        application._id
                                                    }
                                                    application={
                                                        application
                                                    }
                                                    nextStatuses={
                                                        nextStatuses
                                                    }
                                                    StatusIcon={
                                                        StatusIcon
                                                    }
                                                    isExpanded={
                                                        isExpanded
                                                    }
                                                    isUpdating={
                                                        isUpdating
                                                    }
                                                    onToggle={() =>
                                                        setExpandedId(
                                                            (
                                                                current,
                                                            ) =>
                                                                current ===
                                                                application._id
                                                                    ? null
                                                                    : application._id,
                                                        )
                                                    }
                                                    onUpdateStatus={
                                                        updateStatus
                                                    }
                                                />
                                            );
                                        },
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>


                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-gray-500">
                            Page{" "}
                            <span className="font-semibold text-gray-800">
                                {page}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-gray-800">
                                {totalPages}
                            </span>
                        </p>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={
                                    page <=
                                        1 ||
                                    loading
                                }
                                onClick={() => {
                                    setPage(
                                        (
                                            current,
                                        ) =>
                                            current -
                                            1,
                                    );
                                    setLoading(
                                        true,
                                    );
                                    setExpandedId(
                                        null,
                                    );
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft
                                    size={16}
                                />
                                Previous
                            </button>

                            <button
                                type="button"
                                disabled={
                                    page >=
                                        totalPages ||
                                    loading
                                }
                                onClick={() => {
                                    setPage(
                                        (
                                            current,
                                        ) =>
                                            current +
                                            1,
                                    );
                                    setLoading(
                                        true,
                                    );
                                    setExpandedId(
                                        null,
                                    );
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                                <ChevronRight
                                    size={16}
                                />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}


/*
|--------------------------------------------------------------------------
| Stat Card
|--------------------------------------------------------------------------
*/

interface StatCardProps {
    label: string;
    value: number;
    icon: typeof FileCheck;
}

function StatCard({
    label,
    value,
    icon: Icon,
}: StatCardProps) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {label}
                </span>

                <Icon
                    size={17}
                    className="text-gray-400"
                />
            </div>

            <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                {value}
            </p>
        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Application Row
|--------------------------------------------------------------------------
*/

interface ApplicationRowProps {
    application: JobApplication;

    nextStatuses: JobApplicationStatus[];

    StatusIcon: typeof FileCheck;

    isExpanded: boolean;

    isUpdating: boolean;

    onToggle: () => void;

    onUpdateStatus: (
        applicationId: string,
        input: UpdateJobApplicationInput,
    ) => Promise<void>;
}


function ApplicationRow({
    application,
    nextStatuses,
    StatusIcon,
    isExpanded,
    isUpdating,
    onToggle,
    onUpdateStatus,
}: ApplicationRowProps) {
    const vacancyTitle =
        getVacancyTitle(
            application,
        );

    return (
        <>
            <tr className="group">
                <td
                    colSpan={6}
                    className="p-0"
                >
                    <div className="grid min-w-[1050px] grid-cols-[1.25fr_1.25fr_0.85fr_1fr_1fr_48px] items-center transition hover:bg-gray-50">
                        {/* Candidate */}
                        <div className="px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                                    {getInitials(
                                        application.name,
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-gray-900">
                                        {
                                            application.name
                                        }
                                    </p>

                                    <a
                                        href={`mailto:${application.email}`}
                                        className="mt-0.5 block truncate text-sm text-gray-500 transition hover:text-gray-900"
                                    >
                                        {
                                            application.email
                                        }
                                    </a>
                                </div>
                            </div>
                        </div>


                        {/* Position */}
                        <div className="px-5 py-4">
                            <p className="truncate text-sm font-medium text-gray-800">
                                {
                                    vacancyTitle
                                }
                            </p>

                            {application.phone && (
                                <p className="mt-1 text-xs text-gray-400">
                                    {
                                        application.phone
                                    }
                                </p>
                            )}
                        </div>


                        {/* Applied */}
                        <div className="px-5 py-4 text-sm text-gray-600">
                            <p>
                                {formatDate(
                                    application.appliedAt,
                                )}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                                {
                                    formatDateTime(
                                        application.appliedAt,
                                    )
                                }
                            </p>
                        </div>


                        {/* Status */}
                        <div className="px-5 py-4">
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[application.status]}`}
                            >
                                <StatusIcon
                                    size={13}
                                />

                                {formatStatus(
                                    application.status,
                                )}
                            </span>
                        </div>


                        {/* Next action */}
                        <div className="px-5 py-4">
                            {nextStatuses.length >
                            0 ? (
                                <select
                                    aria-label={`Update status for ${application.name}`}
                                    value=""
                                    disabled={
                                        isUpdating
                                    }
                                    onChange={(
                                        event,
                                    ) => {
                                        const nextStatus =
                                            event
                                                .target
                                                .value as JobApplicationStatus;

                                        if (
                                            nextStatus
                                        ) {
                                            void onUpdateStatus(
                                                application._id,
                                                {
                                                    status:
                                                        nextStatus,
                                                },
                                            );
                                        }
                                    }}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs font-medium text-gray-700 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">
                                        {isUpdating
                                            ? "Updating..."
                                            : "Change status"}
                                    </option>

                                    {nextStatuses.map(
                                        (
                                            nextStatus,
                                        ) => (
                                            <option
                                                key={
                                                    nextStatus
                                                }
                                                value={
                                                    nextStatus
                                                }
                                            >
                                                {formatStatus(
                                                    nextStatus,
                                                )}
                                            </option>
                                        ),
                                    )}
                                </select>
                            ) : (
                                <span className="text-xs text-gray-400">
                                    No further actions
                                </span>
                            )}
                        </div>


                        {/* Expand */}
                        <button
                            type="button"
                            aria-label={
                                isExpanded
                                    ? `Hide details for ${application.name}`
                                    : `Show details for ${application.name}`
                            }
                            aria-expanded={
                                isExpanded
                            }
                            onClick={
                                onToggle
                            }
                            className="flex h-full min-h-[88px] items-center justify-center text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
                        >
                            <ChevronDown
                                size={18}
                                className={
                                    isExpanded
                                        ? "rotate-180 transition"
                                        : "transition"
                                }
                            />
                        </button>
                    </div>


                    {/* Expanded Details */}
                    {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50/80 px-5 py-6">
                            <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1.2fr]">
                                {/* Candidate details */}
                                <div className="rounded-xl border border-gray-200 bg-white p-5">
                                    <div className="mb-4 flex items-center gap-2">
                                        <Users
                                            size={17}
                                            className="text-gray-500"
                                        />

                                        <h2 className="text-sm font-semibold text-gray-900">
                                            Candidate
                                        </h2>
                                    </div>

                                    <div className="space-y-4 text-sm">
                                        <DetailItem
                                            label="Full name"
                                            value={
                                                application.name
                                            }
                                        />

                                        <div>
                                            <span className="block text-xs font-medium uppercase tracking-wide text-gray-400">
                                                Email
                                            </span>

                                            <a
                                                href={`mailto:${application.email}`}
                                                className="mt-1 inline-flex items-center gap-1.5 text-gray-700 hover:text-gray-900 hover:underline"
                                            >
                                                <Mail
                                                    size={
                                                        14
                                                    }
                                                />
                                                {
                                                    application.email
                                                }
                                            </a>
                                        </div>

                                        <div>
                                            <span className="block text-xs font-medium uppercase tracking-wide text-gray-400">
                                                Phone
                                            </span>

                                            {application.phone ? (
                                                <a
                                                    href={`tel:${application.phone}`}
                                                    className="mt-1 inline-flex items-center gap-1.5 text-gray-700 hover:text-gray-900 hover:underline"
                                                >
                                                    <Phone
                                                        size={
                                                            14
                                                        }
                                                    />
                                                    {
                                                        application.phone
                                                    }
                                                </a>
                                            ) : (
                                                <p className="mt-1 text-gray-500">
                                                    Not provided
                                                </p>
                                            )}
                                        </div>

                                        <DetailItem
                                            label="Applied"
                                            value={formatDateTime(
                                                application.appliedAt,
                                            )}
                                        />

                                        {application.resumeUrl && (
                                            <a
                                                href={
                                                    application.resumeUrl
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                            >
                                                View resume
                                                <ExternalLink
                                                    size={
                                                        14
                                                    }
                                                />
                                            </a>
                                        )}
                                    </div>
                                </div>


                                {/* Application status */}
                                <div className="rounded-xl border border-gray-200 bg-white p-5">
                                    <div className="mb-4 flex items-center gap-2">
                                        <StatusIcon
                                            size={
                                                17
                                            }
                                            className="text-gray-500"
                                        />

                                        <h2 className="text-sm font-semibold text-gray-900">
                                            Application status
                                        </h2>
                                    </div>

                                    <div className="space-y-4 text-sm">
                                        <DetailItem
                                            label="Current status"
                                            value={formatStatus(
                                                application.status,
                                            )}
                                        />

                                        {application.reviewedAt && (
                                            <DetailItem
                                                label="Reviewed"
                                                value={formatDateTime(
                                                    application.reviewedAt,
                                                )}
                                            />
                                        )}

                                        {application.interviewAt && (
                                            <DetailItem
                                                label="Interview"
                                                value={formatDateTime(
                                                    application.interviewAt,
                                                )}
                                            />
                                        )}

                                        {application.selectedAt && (
                                            <DetailItem
                                                label="Selected"
                                                value={formatDateTime(
                                                    application.selectedAt,
                                                )}
                                            />
                                        )}

                                        {application.rejectedAt && (
                                            <DetailItem
                                                label="Rejected"
                                                value={formatDateTime(
                                                    application.rejectedAt,
                                                )}
                                            />
                                        )}

                                        {application.withdrawnAt && (
                                            <DetailItem
                                                label="Withdrawn"
                                                value={formatDateTime(
                                                    application.withdrawnAt,
                                                )}
                                            />
                                        )}

                                        {application.rejectionReason && (
                                            <div>
                                                <span className="block text-xs font-medium uppercase tracking-wide text-gray-400">
                                                    Rejection reason
                                                </span>

                                                <p className="mt-1 whitespace-pre-wrap leading-6 text-gray-600">
                                                    {
                                                        application.rejectionReason
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>


                                {/* Cover letter */}
                                <div className="rounded-xl border border-gray-200 bg-white p-5">
                                    <h2 className="text-sm font-semibold text-gray-900">
                                        Cover letter
                                    </h2>

                                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-600">
                                        {application.coverLetter ||
                                            "No cover letter provided."}
                                    </p>

                                    {application.notes && (
                                        <div className="mt-5 border-t border-gray-100 pt-5">
                                            <h3 className="text-sm font-semibold text-gray-900">
                                                Reviewer notes
                                            </h3>

                                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-600">
                                                {
                                                    application.notes
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>


                            {/* Review Form */}
                            <div className="mt-6">
                                <JobApplicationReviewForm
                                    key={`${application._id}-${application.status}-${application.reviewedAt ?? ""}-${application.interviewAt ?? ""}`}
                                    application={
                                        application
                                    }
                                    onSave={
                                        onUpdateStatus
                                    }
                                    saving={
                                        isUpdating
                                    }
                                />
                            </div>
                        </div>
                    )}
                </td>
            </tr>
        </>
    );
}


/*
|--------------------------------------------------------------------------
| Detail Item
|--------------------------------------------------------------------------
*/

interface DetailItemProps {
    label: string;
    value: string;
}

function DetailItem({
    label,
    value,
}: DetailItemProps) {
    return (
        <div>
            <span className="block text-xs font-medium uppercase tracking-wide text-gray-400">
                {label}
            </span>

            <p className="mt-1 leading-6 text-gray-700">
                {value}
            </p>
        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Loading Skeleton
|--------------------------------------------------------------------------
*/

function ApplicationSkeletonRows() {
    return (
        <>
            {Array.from(
                {
                    length: 6,
                },
                (_, index) => (
                    <tr
                        key={index}
                    >
                        <td
                            colSpan={6}
                            className="p-0"
                        >
                            <div className="grid min-w-[1050px] grid-cols-[1.25fr_1.25fr_0.85fr_1fr_1fr_48px] items-center">
                                {Array.from(
                                    {
                                        length: 6,
                                    },
                                    (
                                        __,
                                        cellIndex,
                                    ) => (
                                        <div
                                            key={
                                                cellIndex
                                            }
                                            className="px-5 py-6"
                                        >
                                            <div className="h-4 animate-pulse rounded bg-gray-100" />
                                        </div>
                                    ),
                                )}
                            </div>
                        </td>
                    </tr>
                ),
            )}
        </>
    );
}
