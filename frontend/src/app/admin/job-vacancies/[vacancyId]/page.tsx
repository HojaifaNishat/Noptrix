"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
    ArrowLeft,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Copy,
    Edit3,
    ExternalLink,
    FileText,
    Globe2,
    Loader2,
    MapPin,
    PauseCircle,
    Pencil,
    RefreshCw,
    Trash2,
    Users,
    X,
    XCircle,
} from "lucide-react";

import {
    jobVacanciesApi,
} from "@/services/api/job-vacancies.api";

import type {
    JobVacancy,
} from "@/features/job-vacancies/job-vacancy.types";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const formatLabel = (
    value?: string | null,
): string => {
    if (!value) {
        return "—";
    }

    return value
        .toLowerCase()
        .split("_")
        .map(
            (word) =>
                word.charAt(0).toUpperCase() +
                word.slice(1),
        )
        .join(" ");
};

const formatDate = (
    value?: string | Date | null,
): string => {
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
            month: "short",
            day: "numeric",
            year: "numeric",
        },
    ).format(date);
};

const formatDateTime = (
    value?: string | Date | null,
): string => {
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
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        },
    ).format(date);
};

const getStatusClasses = (
    status?: string,
): string => {
    switch (status) {
        case "OPEN":
            return "border-emerald-200 bg-emerald-50 text-emerald-700";

        case "PAUSED":
            return "border-amber-200 bg-amber-50 text-amber-700";

        case "CLOSED":
            return "border-slate-200 bg-slate-100 text-slate-700";

        case "CANCELLED":
            return "border-red-200 bg-red-50 text-red-700";

        default:
            return "border-blue-200 bg-blue-50 text-blue-700";
    }
};

const getStatusDot = (
    status?: string,
): string => {
    switch (status) {
        case "OPEN":
            return "bg-emerald-500";

        case "PAUSED":
            return "bg-amber-500";

        case "CLOSED":
            return "bg-slate-500";

        case "CANCELLED":
            return "bg-red-500";

        default:
            return "bg-blue-500";
    }
};

const getSalaryText = (
    vacancy: JobVacancy,
): string => {
    const currency =
        vacancy.salaryCurrency || "SAR";

    switch (vacancy.salaryType) {
        case "FIXED":
            return vacancy.salaryMin != null
                ? `${currency} ${vacancy.salaryMin.toLocaleString()}`
                : "Fixed salary";

        case "RANGE":
            if (
                vacancy.salaryMin != null &&
                vacancy.salaryMax != null
            ) {
                return `${currency} ${vacancy.salaryMin.toLocaleString()} – ${vacancy.salaryMax.toLocaleString()}`;
            }

            return "Salary range";

        case "NEGOTIABLE":
            return "Negotiable";

        case "UNDISCLOSED":
            return "Undisclosed";

        default:
            return "—";
    }
};

const getDaysRemaining = (
    deadline?: string | Date | null,
): number | null => {
    if (!deadline) {
        return null;
    }

    const target =
        new Date(deadline).getTime();

    if (Number.isNaN(target)) {
        return null;
    }

    const diff =
        target - Date.now();

    return Math.ceil(
        diff /
            (1000 * 60 * 60 * 24),
    );
};

/*
|--------------------------------------------------------------------------
| Small UI components
|--------------------------------------------------------------------------
*/

function DetailCard({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof BriefcaseBusiness;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {label}
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}

function Section({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-950">
                    {title}
                </h2>

                {description ? (
                    <p className="mt-1 text-sm text-slate-500">
                        {description}
                    </p>
                ) : null}
            </div>

            {children}
        </section>
    );
}

function TagList({
    items,
}: {
    items?: string[];
}) {
    if (!items?.length) {
        return (
            <p className="text-sm text-slate-400">
                Not specified.
            </p>
        );
    }

    return (
        <div className="flex flex-wrap gap-2">
            {items.map((item) => (
                <span
                    key={item}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700"
                >
                    {item}
                </span>
            ))}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function JobVacancyDetailsPage() {
    const params = useParams();
    const router = useRouter();

    const vacancyId =
        typeof params.vacancyId === "string"
            ? params.vacancyId
            : "";

    const [vacancy, setVacancy] =
        useState<JobVacancy | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [actionLoading, setActionLoading] =
        useState<string | null>(null);

    const [error, setError] =
        useState<string | null>(null);

    const [deleteOpen, setDeleteOpen] =
        useState(false);

    const [copied, setCopied] =
        useState(false);

    /*
    |--------------------------------------------------------------------------
    | Load vacancy
    |--------------------------------------------------------------------------
    */

    const loadVacancy = useCallback(
        async () => {
            if (!vacancyId) {
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const result =
                    await jobVacanciesApi.getById(
                        vacancyId,
                    );

                setVacancy(result);
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "Unable to load job vacancy.";

                setError(message);
            } finally {
                setLoading(false);
            }
        },
        [vacancyId],
    );

    useEffect(() => {
        void loadVacancy();
    }, [loadVacancy]);

    /*
    |--------------------------------------------------------------------------
    | Status actions
    |--------------------------------------------------------------------------
    */

    const runAction = async (
        action: string,
        callback: () => Promise<unknown>,
    ) => {
        try {
            setActionLoading(action);
            setError(null);

            const result =
                await callback();

            setVacancy(
                result as JobVacancy,
            );
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Action failed.";

            setError(message);
        } finally {
            setActionLoading(null);
        }
    };

    const handlePublish = async () => {
        await runAction(
            "publish",
            () =>
                jobVacanciesApi.publish(
                    vacancyId,
                ),
        );
    };

    const handlePause = async () => {
        await runAction(
            "pause",
            () =>
                jobVacanciesApi.pause(
                    vacancyId,
                ),
        );
    };

    const handleClose = async () => {
        await runAction(
            "close",
            () =>
                jobVacanciesApi.close(
                    vacancyId,
                ),
        );
    };

    const handleCancel = async () => {
        await runAction(
            "cancel",
            () =>
                jobVacanciesApi.updateStatus(
                    vacancyId,
                    {
                        status: "CANCELLED",
                    },
                ),
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */

    const canDelete =
        vacancy?.status === "DRAFT" ||
        vacancy?.status === "CANCELLED";

    const handleDelete = async () => {
        try {
            setActionLoading("delete");
            setError(null);

            await jobVacanciesApi.delete(
                vacancyId,
            );

            router.replace(
                "/admin/job-vacancies",
            );
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Unable to delete this vacancy.";

            setError(message);
            setDeleteOpen(false);
        } finally {
            setActionLoading(null);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Copy public URL
    |--------------------------------------------------------------------------
    */

    const publicUrl = useMemo(() => {
        if (
            typeof window ===
            "undefined"
        ) {
            return "";
        }

        if (!vacancy?.slug) {
            return "";
        }

        return `${window.location.origin}/jobs/${vacancy.slug}`;
    }, [vacancy?.slug]);

    const handleCopyLink = async () => {
        if (!publicUrl) {
            return;
        }

        try {
            await navigator.clipboard.writeText(
                publicUrl,
            );

            setCopied(true);

            window.setTimeout(
                () => setCopied(false),
                1800,
            );
        } catch {
            setError(
                "Unable to copy the public link.",
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Loading
    |--------------------------------------------------------------------------
    */

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50 p-6 md:p-8">
                <div className="mx-auto max-w-7xl animate-pulse space-y-6">
                    <div className="h-8 w-48 rounded-lg bg-slate-200" />

                    <div className="h-72 rounded-3xl bg-slate-200" />

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {Array.from({
                            length: 4,
                        }).map((_, index) => (
                            <div
                                key={index}
                                className="h-28 rounded-2xl bg-slate-200"
                            />
                        ))}
                    </div>

                    <div className="h-96 rounded-3xl bg-slate-200" />
                </div>
            </main>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Error / not found
    |--------------------------------------------------------------------------
    */

    if (!vacancy) {
        return (
            <main className="min-h-screen bg-slate-50 p-6 md:p-8">
                <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <XCircle className="h-7 w-7" />
                    </div>

                    <h1 className="mt-5 text-2xl font-bold text-slate-950">
                        Vacancy unavailable
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        {error ||
                            "The requested job vacancy could not be found."}
                    </p>

                    <Link
                        href="/admin/job-vacancies"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to vacancies
                    </Link>
                </div>
            </main>
        );
    }

    const daysRemaining =
        getDaysRemaining(
            vacancy.applicationDeadline,
        );

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">

                {/* ======================================================
                    Breadcrumb / top navigation
                ======================================================= */}

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Link
                            href="/admin/job-vacancies"
                            className="font-medium text-slate-500 transition hover:text-slate-950"
                        >
                            Job Vacancies
                        </Link>

                        <ChevronRight className="h-4 w-4 text-slate-400" />

                        <span className="font-semibold text-slate-900">
                            Details
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            void loadVacancy()
                        }
                        disabled={
                            actionLoading !== null
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                </div>

                {/* ======================================================
                    Error banner
                ======================================================= */}

                {error ? (
                    <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                        <div>
                            <p className="font-semibold">
                                Action failed
                            </p>

                            <p className="mt-1">
                                {error}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setError(null)
                            }
                            className="rounded-lg p-1 transition hover:bg-red-100"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : null}

                {/* ======================================================
                    Hero
                ======================================================= */}

                <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl">
                    <div className="relative p-7 md:p-10">
                        <div className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

                        <div className="relative">
                            <div className="flex flex-wrap items-center gap-3">
                                <span
                                    className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold ${getStatusClasses(
                                        vacancy.status,
                                    )}`}
                                >
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
                                            vacancy.status,
                                        )}`}
                                    />

                                    {formatLabel(
                                        vacancy.status,
                                    )}
                                </span>

                                <span className="rounded-full border border-white/10 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-slate-200">
                                    {formatLabel(
                                        vacancy.employmentType,
                                    )}
                                </span>

                                {vacancy.isRemote ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-slate-200">
                                        <Globe2 className="h-3.5 w-3.5" />
                                        Remote
                                    </span>
                                ) : null}
                            </div>

                            <div className="mt-7 max-w-4xl">
                                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    {vacancy.department ||
                                        "Recruitment"}
                                </p>

                                <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
                                    {vacancy.title}
                                </h1>

                                <p className="mt-3 text-base font-medium text-slate-300 md:text-lg">
                                    {vacancy.jobTitle ||
                                        vacancy.title}
                                </p>
                            </div>

                            <div className="mt-8 grid gap-5 text-sm md:grid-cols-3">
                                <div className="flex items-start gap-3">
                                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Location
                                        </p>

                                        <p className="mt-1 font-semibold text-slate-100">
                                            {vacancy.isRemote
                                                ? "Remote"
                                                : vacancy.location ||
                                                  "Location not specified"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Openings
                                        </p>

                                        <p className="mt-1 font-semibold text-slate-100">
                                            {vacancy.openings}
                                            {" "}
                                            {vacancy.openings ===
                                            1
                                                ? "position"
                                                : "positions"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <BriefcaseBusiness className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Compensation
                                        </p>

                                        <p className="mt-1 font-semibold text-slate-100">
                                            {getSalaryText(
                                                vacancy,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Hero actions */}

                            <div className="mt-9 flex flex-wrap gap-3">
                                <Link
                                    href={`/admin/job-vacancies/${vacancyId}/edit`}
                                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
                                >
                                    <Edit3 className="h-4 w-4" />
                                    Edit Vacancy
                                </Link>

                                {vacancy.status ===
                                "DRAFT" ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            void handlePublish()
                                        }
                                        disabled={
                                            actionLoading !==
                                            null
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-400 disabled:opacity-50"
                                    >
                                        {actionLoading ===
                                        "publish" ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="h-4 w-4" />
                                        )}
                                        Publish
                                    </button>
                                ) : null}

                                {vacancy.status ===
                                "OPEN" ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            void handlePause()
                                        }
                                        disabled={
                                            actionLoading !==
                                            null
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15 disabled:opacity-50"
                                    >
                                        {actionLoading ===
                                        "pause" ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <PauseCircle className="h-4 w-4" />
                                        )}
                                        Pause
                                    </button>
                                ) : null}

                                {vacancy.status ===
                                "PAUSED" ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            void handlePublish()
                                        }
                                        disabled={
                                            actionLoading !==
                                            null
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-400 disabled:opacity-50"
                                    >
                                        {actionLoading ===
                                        "publish" ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="h-4 w-4" />
                                        )}
                                        Reopen
                                    </button>
                                ) : null}

                                {vacancy.status !==
                                    "CLOSED" &&
                                vacancy.status !==
                                    "CANCELLED" ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void handleClose()
                                            }
                                            disabled={
                                                actionLoading !==
                                                null
                                            }
                                            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15 disabled:opacity-50"
                                        >
                                            {actionLoading ===
                                            "close" ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <XCircle className="h-4 w-4" />
                                            )}
                                            Close
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                void handleCancel()
                                            }
                                            disabled={
                                                actionLoading !==
                                                null
                                            }
                                            className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
                                        >
                                            {actionLoading ===
                                            "cancel" ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <XCircle className="h-4 w-4" />
                                            )}
                                            Cancel
                                        </button>
                                    </>
                                ) : null}

                                <button
                                    type="button"
                                    onClick={() =>
                                        setDeleteOpen(true)
                                    }
                                    disabled={
                                        !canDelete ||
                                        actionLoading !== null
                                    }
                                    title={
                                        canDelete
                                            ? "Permanently delete vacancy"
                                            : "Only draft or cancelled vacancies can be deleted"
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ======================================================
                    Quick stats
                ======================================================= */}

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <DetailCard
                        icon={BriefcaseBusiness}
                        label="Employment"
                        value={formatLabel(
                            vacancy.employmentType,
                        )}
                    />

                    <DetailCard
                        icon={MapPin}
                        label="Workplace"
                        value={
                            vacancy.isRemote
                                ? "Remote"
                                : vacancy.location ||
                                  "Not specified"
                        }
                    />

                    <DetailCard
                        icon={Users}
                        label="Openings"
                        value={String(
                            vacancy.openings,
                        )}
                    />

                    <DetailCard
                        icon={CalendarDays}
                        label="Deadline"
                        value={formatDate(
                            vacancy.applicationDeadline,
                        )}
                    />
                </div>

                {/* ======================================================
                    Main content
                ======================================================= */}

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">

                    <div className="space-y-6">

                        <Section
                            title="Job Description"
                            description="The primary overview candidates will see."
                        >
                            <div className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
                                {vacancy.description ||
                                    "No description has been added yet."}
                            </div>
                        </Section>

                        <Section
                            title="Responsibilities"
                            description="Core responsibilities for this position."
                        >
                            {vacancy.responsibilities?.length ? (
                                <ul className="space-y-3">
                                    {vacancy.responsibilities.map(
                                        (
                                            item,
                                            index,
                                        ) => (
                                            <li
                                                key={`${item}-${index}`}
                                                className="flex gap-3 text-sm leading-6 text-slate-700"
                                            >
                                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />

                                                <span>
                                                    {item}
                                                </span>
                                            </li>
                                        ),
                                    )}
                                </ul>
                            ) : (
                                <p className="text-sm text-slate-400">
                                    No responsibilities
                                    specified.
                                </p>
                            )}
                        </Section>

                        <Section
                            title="Requirements"
                            description="Candidate requirements and qualifications."
                        >
                            {vacancy.requirements?.length ? (
                                <ul className="space-y-3">
                                    {vacancy.requirements.map(
                                        (
                                            item,
                                            index,
                                        ) => (
                                            <li
                                                key={`${item}-${index}`}
                                                className="flex gap-3 text-sm leading-6 text-slate-700"
                                            >
                                                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />

                                                <span>
                                                    {item}
                                                </span>
                                            </li>
                                        ),
                                    )}
                                </ul>
                            ) : (
                                <p className="text-sm text-slate-400">
                                    No requirements
                                    specified.
                                </p>
                            )}
                        </Section>

                        <Section
                            title="Qualifications & Skills"
                            description="Education, experience and preferred skills."
                        >
                            <div className="space-y-6">
                                <div>
                                    <p className="mb-3 text-sm font-bold text-slate-900">
                                        Qualifications
                                    </p>

                                    <TagList
                                        items={
                                            vacancy.qualifications
                                        }
                                    />
                                </div>

                                <div className="border-t border-slate-100 pt-6">
                                    <p className="mb-3 text-sm font-bold text-slate-900">
                                        Skills
                                    </p>

                                    <TagList
                                        items={
                                            vacancy.skills
                                        }
                                    />
                                </div>
                            </div>
                        </Section>

                    </div>

                    {/* ==================================================
                        Sidebar
                    =================================================== */}

                    <aside className="space-y-6">

                        {/* Deadline */}

                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                                    <Clock3 className="h-5 w-5 text-slate-700" />
                                </div>

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Application Deadline
                                    </p>

                                    <p className="mt-1 font-bold text-slate-950">
                                        {formatDate(
                                            vacancy.applicationDeadline,
                                        )}
                                    </p>
                                </div>
                            </div>

                            {daysRemaining !==
                            null ? (
                                <div
                                    className={`mt-5 rounded-2xl p-4 ${
                                        daysRemaining < 0
                                            ? "bg-red-50 text-red-700"
                                            : daysRemaining <=
                                                7
                                              ? "bg-amber-50 text-amber-700"
                                              : "bg-emerald-50 text-emerald-700"
                                    }`}
                                >
                                    <p className="text-sm font-bold">
                                        {daysRemaining < 0
                                            ? "Deadline passed"
                                            : daysRemaining ===
                                                0
                                              ? "Deadline is today"
                                              : `${daysRemaining} days remaining`}
                                    </p>
                                </div>
                            ) : null}
                        </section>

                        {/* Compensation */}

                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Compensation
                            </p>

                            <p className="mt-2 text-2xl font-black text-slate-950">
                                {getSalaryText(
                                    vacancy,
                                )}
                            </p>

                            <p className="mt-2 text-sm text-slate-500">
                                {formatLabel(
                                    vacancy.salaryType,
                                )}
                            </p>
                        </section>

                        {/* Vacancy metadata */}

                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-base font-bold text-slate-950">
                                Vacancy Timeline
                            </h2>

                            <div className="mt-5 space-y-5">
                                <div className="flex gap-3">
                                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            Created
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-slate-800">
                                            {formatDateTime(
                                                vacancy.createdAt,
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-400" />

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            Last Updated
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-slate-800">
                                            {formatDateTime(
                                                vacancy.updatedAt,
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {vacancy.publishedAt ? (
                                    <div className="flex gap-3">
                                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                Published
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-800">
                                                {formatDateTime(
                                                    vacancy.publishedAt,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ) : null}

                                {vacancy.closedAt ? (
                                    <div className="flex gap-3">
                                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-red-500" />

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                Closed
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-800">
                                                {formatDateTime(
                                                    vacancy.closedAt,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </section>

                        {/* Public link */}

                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                                    <ExternalLink className="h-5 w-5 text-slate-700" />
                                </div>

                                <div>
                                    <h2 className="text-sm font-bold text-slate-950">
                                        Public Vacancy
                                    </h2>

                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Share this position with
                                        candidates.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    void handleCopyLink()
                                }
                                disabled={!publicUrl}
                                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        Link Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        Copy Public Link
                                    </>
                                )}
                            </button>
                        </section>

                        {/* Applications */}

                        <Link
                            href={`/admin/job-applications?vacancyId=${encodeURIComponent(
                                vacancyId,
                            )}`}
                            className="group block rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
                                    <FileText className="h-5 w-5" />
                                </div>

                                <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-900" />
                            </div>

                            <h2 className="mt-5 text-base font-bold text-slate-950">
                                View Applications
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                Review candidates who applied
                                for this position.
                            </p>
                        </Link>

                    </aside>
                </div>

                {/* ======================================================
                    Bottom navigation
                ======================================================= */}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
                    <Link
                        href="/admin/job-vacancies"
                        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-slate-950"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Job Vacancies
                    </Link>

                    <Link
                        href={`/admin/job-vacancies/${vacancyId}/edit`}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                    >
                        <Pencil className="h-4 w-4" />
                        Edit Vacancy
                    </Link>
                </div>

            </div>

            {/* ==========================================================
                Delete Confirmation Modal
            =========================================================== */}

            {deleteOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-vacancy-title"
                        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                                <Trash2 className="h-6 w-6" />
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setDeleteOpen(false)
                                }
                                disabled={
                                    actionLoading ===
                                    "delete"
                                }
                                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <h2
                            id="delete-vacancy-title"
                            className="mt-6 text-xl font-black text-slate-950"
                        >
                            Delete this vacancy?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            You are about to permanently
                            delete{" "}
                            <span className="font-bold text-slate-950">
                                {vacancy.title}
                            </span>
                            . This action cannot be undone.
                        </p>

                        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                            <p className="text-sm font-semibold text-amber-800">
                                Important
                            </p>

                            <p className="mt-1 text-xs leading-5 text-amber-700">
                                Vacancies with associated
                                applications cannot be deleted
                                by the backend.
                            </p>
                        </div>

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() =>
                                    setDeleteOpen(false)
                                }
                                disabled={
                                    actionLoading ===
                                    "delete"
                                }
                                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Keep Vacancy
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    void handleDelete()
                                }
                                disabled={
                                    actionLoading ===
                                    "delete"
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {actionLoading ===
                                "delete" ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}

                                Permanently Delete
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </main>
    );
}
