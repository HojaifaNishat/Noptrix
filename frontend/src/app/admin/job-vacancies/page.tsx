"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    BriefcaseBusiness,
    Check,
    ChevronRight,
    Copy,
    Edit3,
    Eye,
    Loader2,
    MoreHorizontal,
    PauseCircle,
    PlayCircle,
    Plus,
    Search,
    Trash2,
    X,
    XCircle,
} from "lucide-react";

import {
    JOB_VACANCY_STATUSES,
    type JobVacancy,
    type JobVacancyStatus,
} from "@/features/job-vacancies/job-vacancy.types";

import { jobVacanciesApi } from "@/services/api/job-vacancies.api";

const STATUS_OPTIONS: Array<{
    value: JobVacancyStatus | "";
    label: string;
}> = [
    {
        value: "",
        label: "All statuses",
    },
    {
        value: JOB_VACANCY_STATUSES.DRAFT,
        label: "Draft",
    },
    {
        value: JOB_VACANCY_STATUSES.OPEN,
        label: "Published",
    },
    {
        value: JOB_VACANCY_STATUSES.PAUSED,
        label: "Paused",
    },
    {
        value: JOB_VACANCY_STATUSES.CLOSED,
        label: "Closed",
    },
    {
        value: JOB_VACANCY_STATUSES.CANCELLED,
        label: "Cancelled",
    },
];

type ActionType =
    | "publish"
    | "pause"
    | "close"
    | "cancel"
    | "delete";

interface ConfirmAction {
    type: ActionType;
    vacancy: JobVacancy;
}

const formatLabel = (value: string): string =>
    value
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) =>
            character.toUpperCase(),
        );

const getStatusClasses = (
    status: JobVacancyStatus,
): string => {
    switch (status) {
        case JOB_VACANCY_STATUSES.DRAFT:
            return "border-slate-200 bg-slate-100 text-slate-700";

        case JOB_VACANCY_STATUSES.OPEN:
            return "border-emerald-200 bg-emerald-50 text-emerald-700";

        case JOB_VACANCY_STATUSES.PAUSED:
            return "border-amber-200 bg-amber-50 text-amber-700";

        case JOB_VACANCY_STATUSES.CLOSED:
            return "border-blue-200 bg-blue-50 text-blue-700";

        case JOB_VACANCY_STATUSES.CANCELLED:
            return "border-red-200 bg-red-50 text-red-700";

        default:
            return "border-slate-200 bg-slate-100 text-slate-700";
    }
};

const getActionTitle = (
    type: ActionType,
): string => {
    switch (type) {
        case "publish":
            return "Reopen vacancy";

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
    type: ActionType,
): string => {
    switch (type) {
        case "publish":
            return "This vacancy will become active again and candidates will be able to see it.";

        case "pause":
            return "This vacancy will temporarily stop accepting new recruitment activity. You can reopen it later.";

        case "close":
            return "This will permanently close the vacancy. A closed vacancy cannot be reopened.";

        case "cancel":
            return "This will cancel the vacancy. Cancelled vacancies can be deleted later if there are no applications.";

        case "delete":
            return "This will permanently remove the vacancy. This action cannot be undone.";
    }
};

const getActionButtonLabel = (
    type: ActionType,
): string => {
    switch (type) {
        case "publish":
            return "Reopen vacancy";

        case "pause":
            return "Pause vacancy";

        case "close":
            return "Close vacancy";

        case "cancel":
            return "Cancel vacancy";

        case "delete":
            return "Delete permanently";
    }
};

export default function JobVacanciesPage() {
    const [vacancies, setVacancies] = useState<JobVacancy[]>(
        [],
    );

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<
        JobVacancyStatus | ""
    >("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [copiedVacancyId, setCopiedVacancyId] =
        useState<string | null>(null);

    const [confirmAction, setConfirmAction] =
        useState<ConfirmAction | null>(null);

    const [actionLoading, setActionLoading] =
        useState<string | null>(null);

    const loadVacancies = async (
        showLoading = true,
    ) => {
        try {
            if (showLoading) {
                setLoading(true);
            }

            setError("");

            const response =
                await jobVacanciesApi.getAll({
                    search: search.trim() || undefined,
                    status: status || undefined,
                });

            setVacancies(response.items);
        } catch {
            setError(
                "Unable to load job vacancies.",
            );
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                setLoading(true);
                setError("");

                const response =
                    await jobVacanciesApi.getAll({
                        search:
                            search.trim() || undefined,
                        status:
                            status || undefined,
                    });

                if (mounted) {
                    setVacancies(response.items);
                }
            } catch {
                if (mounted) {
                    setError(
                        "Unable to load job vacancies.",
                    );
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            mounted = false;
        };
    }, [search, status]);

    const copyShareLink = async (
        vacancy: JobVacancy,
    ) => {
        try {
            const shareUrl =
                `${window.location.origin}/jobs/${encodeURIComponent(
                    vacancy.slug,
                )}`;

            await navigator.clipboard.writeText(
                shareUrl,
            );

            setCopiedVacancyId(vacancy.id);
            setError("");

            window.setTimeout(() => {
                setCopiedVacancyId((current) =>
                    current === vacancy.id
                        ? null
                        : current,
                );
            }, 2000);
        } catch {
            setError(
                "Unable to copy the vacancy link. Please check clipboard permissions.",
            );
        }
    };

    const executeAction = async () => {
        if (!confirmAction) {
            return;
        }

        const {
            type,
            vacancy,
        } = confirmAction;

        try {
            setActionLoading(vacancy.id);
            setError("");

            if (type === "publish") {
                await jobVacanciesApi.publish(
                    vacancy.id,
                );
            }

            if (type === "pause") {
                await jobVacanciesApi.pause(
                    vacancy.id,
                );
            }

            if (type === "close") {
                await jobVacanciesApi.close(
                    vacancy.id,
                );
            }

            if (type === "cancel") {
                await jobVacanciesApi.updateStatus(
                    vacancy.id,
                    {
                        status:
                            JOB_VACANCY_STATUSES.CANCELLED,
                    },
                );
            }

            if (type === "delete") {
                await jobVacanciesApi.delete(
                    vacancy.id,
                );
            }

            setConfirmAction(null);

            await loadVacancies(false);
        } catch (actionError) {
            const message =
                actionError instanceof Error
                    ? actionError.message
                    : "Unable to complete the requested action.";

            setError(message);
        } finally {
            setActionLoading(null);
        }
    };

    const canEdit = (
        vacancy: JobVacancy,
    ): boolean =>
        vacancy.status !==
            JOB_VACANCY_STATUSES.CLOSED &&
        vacancy.status !==
            JOB_VACANCY_STATUSES.CANCELLED;

    const canPause = (
        vacancy: JobVacancy,
    ): boolean =>
        vacancy.status ===
        JOB_VACANCY_STATUSES.OPEN;

    const canReopen = (
        vacancy: JobVacancy,
    ): boolean =>
        vacancy.status ===
        JOB_VACANCY_STATUSES.PAUSED;

    const canClose = (
        vacancy: JobVacancy,
    ): boolean =>
        vacancy.status ===
            JOB_VACANCY_STATUSES.DRAFT ||
        vacancy.status ===
            JOB_VACANCY_STATUSES.OPEN ||
        vacancy.status ===
            JOB_VACANCY_STATUSES.PAUSED;

    const canCancel = (
        vacancy: JobVacancy,
    ): boolean =>
        vacancy.status ===
            JOB_VACANCY_STATUSES.DRAFT ||
        vacancy.status ===
            JOB_VACANCY_STATUSES.OPEN ||
        vacancy.status ===
            JOB_VACANCY_STATUSES.PAUSED;

    const canDelete = (
        vacancy: JobVacancy,
    ): boolean =>
        vacancy.status ===
            JOB_VACANCY_STATUSES.DRAFT ||
        vacancy.status ===
            JOB_VACANCY_STATUSES.CANCELLED;

    return (
        <main className="min-h-full bg-slate-50 p-6 md:p-8">
            {/* ==========================================================
                Header
            =========================================================== */}

            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 shadow-sm">
                        <BriefcaseBusiness className="h-3.5 w-3.5" />
                        Recruitment
                    </div>

                    <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                        Job Vacancies
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                        Create, publish, pause, close and
                        manage NOPTRIX job vacancies from
                        one place.
                    </p>
                </div>

                <Link
                    href="/admin/job-vacancies/create"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
                >
                    <Plus className="h-4 w-4" />
                    Create Vacancy
                </Link>
            </div>

            {/* ==========================================================
                Filters
            =========================================================== */}

            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-[1fr_220px_auto]">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />

                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value,
                                )
                            }
                            placeholder="Search by job title..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                        />
                    </div>

                    <select
                        value={status}
                        onChange={(event) =>
                            setStatus(
                                event.target.value as
                                    | JobVacancyStatus
                                    | "",
                            )
                        }
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                    >
                        {STATUS_OPTIONS.map(
                            (option) => (
                                <option
                                    key={
                                        option.value
                                    }
                                    value={
                                        option.value
                                    }
                                >
                                    {option.label}
                                </option>
                            ),
                        )}
                    </select>

                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
                        {vacancies.length}{" "}
                        {vacancies.length === 1
                            ? "vacancy"
                            : "vacancies"}
                    </div>
                </div>
            </div>

            {/* ==========================================================
                Error
            =========================================================== */}

            {error ? (
                <div
                    role="alert"
                    className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700"
                >
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0" />

                    <div className="flex-1">
                        <p className="font-bold">
                            Something went wrong
                        </p>

                        <p className="mt-1 leading-6">
                            {error}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                        className="rounded-lg p-1 transition hover:bg-red-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : null}

            {/* ==========================================================
                Table
            =========================================================== */}

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1250px] text-left">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                                    Position
                                </th>

                                <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                                    Department
                                </th>

                                <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                                    Employment
                                </th>

                                <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                                    Openings
                                </th>

                                <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                                    Status
                                </th>

                                <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                                    Deadline
                                </th>

                                <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                                    Share
                                </th>

                                <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wider text-slate-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-5 py-16 text-center"
                                    >
                                        <div className="flex flex-col items-center justify-center">
                                            <Loader2 className="h-7 w-7 animate-spin text-slate-400" />

                                            <p className="mt-3 text-sm font-semibold text-slate-500">
                                                Loading job
                                                vacancies...
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : vacancies.length ===
                              0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-5 py-16 text-center"
                                    >
                                        <div className="mx-auto flex max-w-md flex-col items-center">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                                                <BriefcaseBusiness className="h-6 w-6 text-slate-400" />
                                            </div>

                                            <h2 className="mt-4 text-base font-black text-slate-900">
                                                No vacancies
                                                found
                                            </h2>

                                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                                Try changing
                                                your search
                                                or status
                                                filter.
                                            </p>

                                            <Link
                                                href="/admin/job-vacancies/create"
                                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Create Vacancy
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                vacancies.map(
                                    (vacancy) => (
                                        <tr
                                            key={
                                                vacancy.id
                                            }
                                            className="group transition hover:bg-slate-50/80"
                                        >
                                            {/* Position */}

                                            <td className="px-5 py-5">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                                                        <BriefcaseBusiness className="h-4 w-4" />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <Link
                                                            href={`/admin/job-vacancies/${vacancy.id}`}
                                                            className="line-clamp-2 font-bold text-slate-950 transition hover:text-slate-600 hover:underline"
                                                        >
                                                            {
                                                                vacancy.title
                                                            }
                                                        </Link>

                                                        {vacancy.location ? (
                                                            <p className="mt-1 text-xs font-medium text-slate-500">
                                                                {
                                                                    vacancy.location
                                                                }
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Department */}

                                            <td className="px-5 py-5 text-sm font-medium text-slate-600">
                                                {vacancy.department ||
                                                    "—"}
                                            </td>

                                            {/* Employment */}

                                            <td className="px-5 py-5 text-sm font-medium text-slate-600">
                                                {formatLabel(
                                                    vacancy.employmentType,
                                                )}
                                            </td>

                                            {/* Openings */}

                                            <td className="px-5 py-5 text-sm font-bold text-slate-700">
                                                {
                                                    vacancy.openings
                                                }
                                            </td>

                                            {/* Status */}

                                            <td className="px-5 py-5">
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-black ${getStatusClasses(
                                                        vacancy.status,
                                                    )}`}
                                                >
                                                    {
                                                        formatLabel(
                                                            vacancy.status,
                                                        )
                                                    }
                                                </span>
                                            </td>

                                            {/* Deadline */}

                                            <td className="px-5 py-5 text-sm font-medium text-slate-600">
                                                {vacancy.applicationDeadline
                                                    ? new Date(
                                                          vacancy.applicationDeadline,
                                                      ).toLocaleDateString(
                                                          undefined,
                                                          {
                                                              year: "numeric",
                                                              month: "short",
                                                              day: "numeric",
                                                          },
                                                      )
                                                    : "No deadline"}
                                            </td>

                                            {/* Share */}

                                            <td className="px-5 py-5">
                                                {vacancy.status ===
                                                JOB_VACANCY_STATUSES.OPEN ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void copyShareLink(
                                                                vacancy,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                                                    >
                                                        {copiedVacancyId ===
                                                        vacancy.id ? (
                                                            <>
                                                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                                Copied
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="h-3.5 w-3.5" />
                                                                Copy link
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <span className="text-xs font-medium text-slate-400">
                                                        —
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}

                                            <td className="px-5 py-5">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* View */}

                                                    <Link
                                                        href={`/admin/job-vacancies/${vacancy.id}`}
                                                        title="View vacancy"
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>

                                                    {/* Edit */}

                                                    {canEdit(
                                                        vacancy,
                                                    ) ? (
                                                        <Link
                                                            href={`/admin/job-vacancies/${vacancy.id}/edit`}
                                                            title="Edit vacancy"
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Link>
                                                    ) : null}

                                                    {/* Pause */}

                                                    {canPause(
                                                        vacancy,
                                                    ) ? (
                                                        <button
                                                            type="button"
                                                            title="Pause vacancy"
                                                            onClick={() =>
                                                                setConfirmAction(
                                                                    {
                                                                        type: "pause",
                                                                        vacancy,
                                                                    },
                                                                )
                                                            }
                                                            disabled={
                                                                actionLoading !==
                                                                null
                                                            }
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <PauseCircle className="h-4 w-4" />
                                                        </button>
                                                    ) : null}

                                                    {/* Reopen */}

                                                    {canReopen(
                                                        vacancy,
                                                    ) ? (
                                                        <button
                                                            type="button"
                                                            title="Reopen vacancy"
                                                            onClick={() =>
                                                                setConfirmAction(
                                                                    {
                                                                        type: "publish",
                                                                        vacancy,
                                                                    },
                                                                )
                                                            }
                                                            disabled={
                                                                actionLoading !==
                                                                null
                                                            }
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <PlayCircle className="h-4 w-4" />
                                                        </button>
                                                    ) : null}

                                                    {/* Close */}

                                                    {canClose(
                                                        vacancy,
                                                    ) ? (
                                                        <button
                                                            type="button"
                                                            title="Close vacancy"
                                                            onClick={() =>
                                                                setConfirmAction(
                                                                    {
                                                                        type: "close",
                                                                        vacancy,
                                                                    },
                                                                )
                                                            }
                                                            disabled={
                                                                actionLoading !==
                                                                null
                                                            }
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    ) : null}

                                                    {/* Cancel */}

                                                    {canCancel(
                                                        vacancy,
                                                    ) ? (
                                                        <button
                                                            type="button"
                                                            title="Cancel vacancy"
                                                            onClick={() =>
                                                                setConfirmAction(
                                                                    {
                                                                        type: "cancel",
                                                                        vacancy,
                                                                    },
                                                                )
                                                            }
                                                            disabled={
                                                                actionLoading !==
                                                                null
                                                            }
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    ) : null}

                                                    {/* Delete */}

                                                    {canDelete(
                                                        vacancy,
                                                    ) ? (
                                                        <button
                                                            type="button"
                                                            title="Delete vacancy"
                                                            onClick={() =>
                                                                setConfirmAction(
                                                                    {
                                                                        type: "delete",
                                                                        vacancy,
                                                                    },
                                                                )
                                                            }
                                                            disabled={
                                                                actionLoading !==
                                                                null
                                                            }
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    ) : null}

                                                    <ChevronRight className="ml-1 h-4 w-4 text-slate-300" />
                                                </div>
                                            </td>
                                        </tr>
                                    ),
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ==========================================================
                Action Legend
            =========================================================== */}

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs font-semibold text-slate-500 shadow-sm">
                <span className="inline-flex items-center gap-2">
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                </span>

                <span className="inline-flex items-center gap-2">
                    <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
                    Pause
                </span>

                <span className="inline-flex items-center gap-2">
                    <PlayCircle className="h-3.5 w-3.5 text-emerald-600" />
                    Reopen
                </span>

                <span className="inline-flex items-center gap-2">
                    <XCircle className="h-3.5 w-3.5" />
                    Close
                </span>

                <span className="inline-flex items-center gap-2">
                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    Delete
                </span>
            </div>

            {/* ==========================================================
                Confirmation Modal
            =========================================================== */}

            {confirmAction ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setConfirmAction(null);
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="vacancy-action-title"
                        className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
                    >
                        <div className="p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div
                                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                                        confirmAction.type ===
                                        "delete"
                                            ? "bg-red-50 text-red-600"
                                            : confirmAction.type ===
                                                "pause"
                                              ? "bg-amber-50 text-amber-600"
                                              : "bg-slate-100 text-slate-700"
                                    }`}
                                >
                                    {confirmAction.type ===
                                    "delete" ? (
                                        <Trash2 className="h-6 w-6" />
                                    ) : confirmAction.type ===
                                      "pause" ? (
                                        <PauseCircle className="h-6 w-6" />
                                    ) : confirmAction.type ===
                                      "publish" ? (
                                        <PlayCircle className="h-6 w-6" />
                                    ) : (
                                        <XCircle className="h-6 w-6" />
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setConfirmAction(
                                            null,
                                        )
                                    }
                                    disabled={
                                        actionLoading !==
                                        null
                                    }
                                    className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <h2
                                id="vacancy-action-title"
                                className="mt-5 text-xl font-black text-slate-950"
                            >
                                {getActionTitle(
                                    confirmAction.type,
                                )}
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                {getActionDescription(
                                    confirmAction.type,
                                )}
                            </p>

                            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Vacancy
                                </p>

                                <p className="mt-1 font-bold text-slate-900">
                                    {
                                        confirmAction
                                            .vacancy
                                            .title
                                    }
                                </p>

                                <p className="mt-1 text-xs font-medium text-slate-500">
                                    Status:{" "}
                                    {formatLabel(
                                        confirmAction
                                            .vacancy
                                            .status,
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                            <button
                                type="button"
                                onClick={() =>
                                    setConfirmAction(
                                        null,
                                    )
                                }
                                disabled={
                                    actionLoading !==
                                    null
                                }
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                            >
                                Keep vacancy
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    void executeAction()
                                }
                                disabled={
                                    actionLoading !==
                                    null
                                }
                                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                    confirmAction.type ===
                                    "delete"
                                        ? "bg-red-600 hover:bg-red-700"
                                        : confirmAction.type ===
                                            "pause"
                                          ? "bg-amber-600 hover:bg-amber-700"
                                          : "bg-slate-950 hover:bg-slate-800"
                                }`}
                            >
                                {actionLoading ===
                                confirmAction.vacancy.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : null}

                                {getActionButtonLabel(
                                    confirmAction.type,
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </main>
    );
}
