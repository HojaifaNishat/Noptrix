"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    Copy,
    Edit3,
    ExternalLink,
    FileText,
    Globe2,
    MapPin,
    PauseCircle,
    RefreshCw,
    Trash2,
    Users,
    XCircle,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    jobVacanciesApi,
} from "@/services/api/job-vacancies.api";

import {
    JOB_EMPLOYMENT_TYPES,
    JOB_SALARY_TYPES,
    JOB_VACANCY_STATUSES,
    type JobVacancy,
    type JobVacancyStatus,
} from "@/features/job-vacancies/job-vacancy.types";

import {
    useAuthStore,
} from "@/stores/auth.store";

import {
    hasAnyPermission,
} from "@/lib/permissions/permission";

import {
    Badge,
} from "@/components/ui/Badge";

import {
    Button,
} from "@/components/ui/Button";

import {
    Card,
} from "@/components/ui/Card";

const DEFAULT_CURRENCY = "BDT";

type ConfirmAction =
    | "publish"
    | "pause"
    | "close"
    | "cancel"
    | "delete"
    | null;

const STATUS_LABELS: Record<JobVacancyStatus, string> = {
    [JOB_VACANCY_STATUSES.DRAFT]: "Draft",
    [JOB_VACANCY_STATUSES.OPEN]: "Open",
    [JOB_VACANCY_STATUSES.PAUSED]: "Paused",
    [JOB_VACANCY_STATUSES.CLOSED]: "Closed",
    [JOB_VACANCY_STATUSES.CANCELLED]: "Cancelled",
};

const STATUS_CLASSES: Record<JobVacancyStatus, string> = {
    [JOB_VACANCY_STATUSES.DRAFT]:
        "border-gray-200 bg-gray-50 text-gray-700",
    [JOB_VACANCY_STATUSES.OPEN]:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    [JOB_VACANCY_STATUSES.PAUSED]:
        "border-amber-200 bg-amber-50 text-amber-700",
    [JOB_VACANCY_STATUSES.CLOSED]:
        "border-blue-200 bg-blue-50 text-blue-700",
    [JOB_VACANCY_STATUSES.CANCELLED]:
        "border-red-200 bg-red-50 text-red-700",
};

const EMPLOYMENT_LABELS: Record<string, string> = {
    [JOB_EMPLOYMENT_TYPES.FULL_TIME]: "Full Time",
    [JOB_EMPLOYMENT_TYPES.PART_TIME]: "Part Time",
    [JOB_EMPLOYMENT_TYPES.CONTRACT]: "Contract",
    [JOB_EMPLOYMENT_TYPES.INTERN]: "Intern",
    [JOB_EMPLOYMENT_TYPES.TEMPORARY]: "Temporary",
};

const SALARY_LABELS: Record<string, string> = {
    [JOB_SALARY_TYPES.FIXED]: "Fixed Salary",
    [JOB_SALARY_TYPES.RANGE]: "Salary Range",
    [JOB_SALARY_TYPES.NEGOTIABLE]: "Negotiable",
    [JOB_SALARY_TYPES.UNDISCLOSED]: "Undisclosed",
};

function formatDate(
    value?: string,
): string {
    if (!value) {
        return "Not specified";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not specified";
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

function formatDateTime(
    value?: string,
): string {
    if (!value) {
        return "Not specified";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not specified";
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        },
    ).format(date);
}

function formatCurrency(
    amount?: number,
    currency = DEFAULT_CURRENCY,
): string {
    if (
        typeof amount !== "number" ||
        Number.isNaN(amount)
    ) {
        return "";
    }

    try {
        return new Intl.NumberFormat(
            "en-BD",
            {
                style: "currency",
                currency: currency || DEFAULT_CURRENCY,
                maximumFractionDigits: 0,
            },
        ).format(amount);
    } catch {
        return `${currency || DEFAULT_CURRENCY} ${amount.toLocaleString()}`;
    }
}

function getSalaryText(
    vacancy: JobVacancy,
): string {
    const currency =
        vacancy.salaryCurrency ||
        DEFAULT_CURRENCY;

    switch (vacancy.salaryType) {
        case JOB_SALARY_TYPES.FIXED:
            return vacancy.salaryMin !== undefined
                ? formatCurrency(vacancy.salaryMin, currency)
                : "Not specified";

        case JOB_SALARY_TYPES.RANGE:
            if (
                vacancy.salaryMin !== undefined &&
                vacancy.salaryMax !== undefined
            ) {
                return `${formatCurrency(
                    vacancy.salaryMin,
                    currency,
                )} – ${formatCurrency(
                    vacancy.salaryMax,
                    currency,
                )}`;
            }

            if (vacancy.salaryMin !== undefined) {
                return `${formatCurrency(
                    vacancy.salaryMin,
                    currency,
                )}+`;
            }

            return "Not specified";

        case JOB_SALARY_TYPES.NEGOTIABLE:
            return "Negotiable";

        case JOB_SALARY_TYPES.UNDISCLOSED:
            return "Undisclosed";

        default:
            return "Not specified";
    }
}

function getPublicJobUrl(
    vacancy: JobVacancy,
): string {
    if (typeof window === "undefined") {
        return `/jobs/${vacancy.slug}`;
    }

    return `${window.location.origin}/jobs/${vacancy.slug}`;
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />

            <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="space-y-4">
                    <div className="h-8 w-2/3 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />

                    <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map(
                            (_, index) => (
                                <div
                                    key={index}
                                    className="h-20 animate-pulse rounded-lg bg-gray-100"
                                />
                            ),
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="h-96 animate-pulse rounded-xl bg-gray-100" />
                <div className="h-72 animate-pulse rounded-xl bg-gray-100" />
            </div>
        </div>
    );
}

function ErrorState({
    message,
    onRetry,
}: {
    message: string;
    onRetry: () => void;
}) {
    return (
        <Card className="border-red-200 bg-red-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="font-semibold text-red-800">
                        Unable to load vacancy
                    </h2>

                    <p className="mt-1 text-sm text-red-700">
                        {message}
                    </p>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    onClick={onRetry}
                    className="shrink-0"
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                </Button>
            </div>
        </Card>
    );
}

function Section({
    title,
    icon,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                <div className="rounded-lg bg-gray-100 p-2 text-gray-700">
                    {icon}
                </div>

                <h2 className="font-semibold text-gray-900">
                    {title}
                </h2>
            </div>

            <div className="p-5">
                {children}
            </div>
        </Card>
    );
}

function BulletList({
    items,
    emptyText,
}: {
    items?: string[];
    emptyText: string;
}) {
    if (!items || items.length === 0) {
        return (
            <p className="text-sm text-gray-500">
                {emptyText}
            </p>
        );
    }

    return (
        <ul className="space-y-3">
            {items.map(
                (item, index) => (
                    <li
                        key={`${item}-${index}`}
                        className="flex gap-3 text-sm leading-6 text-gray-700"
                    >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                        <span>{item}</span>
                    </li>
                ),
            )}
        </ul>
    );
}

function InfoItem({
    label,
    value,
    icon,
}: {
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                {icon}
                <span>{label}</span>
            </div>

            <div className="mt-2 text-sm font-semibold text-gray-900">
                {value}
            </div>
        </div>
    );
}

export default function JobVacancyDetailPage() {
    const params = useParams<{
        vacancyId: string;
    }>();

    const router = useRouter();

    const user = useAuthStore(
        (state) => state.user,
    );

    const vacancyId =
        typeof params?.vacancyId === "string"
            ? params.vacancyId
            : "";

    const [vacancy, setVacancy] =
        useState<JobVacancy | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [actionLoading, setActionLoading] =
        useState(false);

    const [confirmAction, setConfirmAction] =
        useState<ConfirmAction>(null);

    const [copied, setCopied] =
        useState(false);

    const [showMetadata, setShowMetadata] =
        useState(false);

    const canUpdate =
        hasAnyPermission(user, [
            "job_vacancies.update",
            "job_vacancies.manage",
        ]);

    const canDelete =
        hasAnyPermission(user, [
            "job_vacancies.delete",
            "job_vacancies.manage",
        ]);

    const canManage =
        hasAnyPermission(user, [
            "job_vacancies.manage",
        ]);

    const loadVacancy =
        useCallback(
            async () => {
                if (!vacancyId) {
                    setError(
                        "Invalid vacancy ID.",
                    );
                    setLoading(false);
                    return;
                }

                try {
                    setLoading(true);
                    setError("");

                    const data =
                        await jobVacanciesApi.getById(
                            vacancyId,
                        );

                    setVacancy(data);
                } catch (requestError) {
                    const message =
                        requestError instanceof Error
                            ? requestError.message
                            : "Something went wrong while loading the vacancy.";

                    setError(message);
                    setVacancy(null);
                } finally {
                    setLoading(false);
                }
            },
            [vacancyId],
        );

    useEffect(() => {
        void loadVacancy();
    }, [loadVacancy]);

    const publicUrl = useMemo(
        () =>
            vacancy
                ? getPublicJobUrl(vacancy)
                : "",
        [vacancy],
    );

    const canPublish =
        vacancy?.status === JOB_VACANCY_STATUSES.DRAFT ||
        vacancy?.status === JOB_VACANCY_STATUSES.PAUSED;

    const canPause =
        vacancy?.status === JOB_VACANCY_STATUSES.OPEN;

    const canClose =
        vacancy?.status === JOB_VACANCY_STATUSES.OPEN ||
        vacancy?.status === JOB_VACANCY_STATUSES.PAUSED;

    const canCancel =
        vacancy?.status === JOB_VACANCY_STATUSES.DRAFT ||
        vacancy?.status === JOB_VACANCY_STATUSES.OPEN ||
        vacancy?.status === JOB_VACANCY_STATUSES.PAUSED;

    const executeAction =
        async (
            action: Exclude<ConfirmAction, null>,
        ) => {
            if (!vacancy) {
                return;
            }

            try {
                setActionLoading(true);
                setError("");

                let updated: JobVacancy;

                if (action === "publish") {
                    updated =
                        await jobVacanciesApi.publish(
                            vacancy.id,
                        );
                } else if (action === "pause") {
                    updated =
                        await jobVacanciesApi.pause(
                            vacancy.id,
                        );
                } else if (action === "close") {
                    updated =
                        await jobVacanciesApi.close(
                            vacancy.id,
                        );
                } else if (action === "cancel") {
                    updated =
                        await jobVacanciesApi.updateStatus(
                            vacancy.id,
                            {
                                status:
                                    JOB_VACANCY_STATUSES.CANCELLED,
                            },
                        );
                } else {
                    await jobVacanciesApi.delete(
                        vacancy.id,
                    );

                    router.push(
                        "/admin/job-vacancies",
                    );

                    return;
                }

                setVacancy(updated);
                setConfirmAction(null);
            } catch (requestError) {
                const message =
                    requestError instanceof Error
                        ? requestError.message
                        : "The requested action could not be completed.";

                setError(message);
            } finally {
                setActionLoading(false);
            }
        };

    const copyPublicUrl =
        async () => {
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
                    2000,
                );
            } catch {
                setError(
                    "Unable to copy the public vacancy URL.",
                );
            }
        };

    if (loading) {
        return (
            <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
                <LoadingSkeleton />
            </div>
        );
    }

    if (error && !vacancy) {
        return (
            <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
                <ErrorState
                    message={error}
                    onRetry={() => void loadVacancy()}
                />
            </div>
        );
    }

    if (!vacancy) {
        return (
            <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
                <ErrorState
                    message="The requested vacancy could not be found."
                    onRetry={() => void loadVacancy()}
                />
            </div>
        );
    }

    const status =
        vacancy.status;

    const statusLabel =
        STATUS_LABELS[status] ??
        status;

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/admin/job-vacancies"
                        className="inline-flex items-center text-sm font-medium text-gray-600 transition hover:text-gray-900"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Job Vacancies
                    </Link>

                    <span className="text-gray-300">
                        /
                    </span>

                    <span className="truncate text-sm text-gray-500">
                        {vacancy.title}
                    </span>
                </div>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="break-words text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                                {vacancy.title}
                            </h1>

                            <span
                                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[status]}`}
                            >
                                {statusLabel}
                            </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
                            <span className="inline-flex items-center gap-1.5">
                                <BriefcaseBusiness className="h-4 w-4" />
                                {vacancy.jobTitle}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                                <ClipboardList className="h-4 w-4" />
                                {vacancy.department}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" />
                                {vacancy.isRemote
                                    ? "Remote"
                                    : vacancy.location ||
                                      "Location not specified"}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => void loadVacancy()}
                            disabled={actionLoading}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>

                        {canUpdate && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    router.push(
                                        `/admin/job-vacancies/${vacancy.id}/edit`,
                                    )
                                }
                            >
                                <Edit3 className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <InfoItem
                    label="Employment"
                    value={
                        EMPLOYMENT_LABELS[
                            vacancy.employmentType
                        ] ??
                        vacancy.employmentType
                    }
                    icon={
                        <BriefcaseBusiness className="h-3.5 w-3.5" />
                    }
                />

                <InfoItem
                    label="Salary"
                    value={getSalaryText(vacancy)}
                    icon={
                        <span className="text-xs font-bold">
                            ৳
                        </span>
                    }
                />

                <InfoItem
                    label="Openings"
                    value={`${vacancy.openings} ${
                        vacancy.openings === 1
                            ? "position"
                            : "positions"
                    }`}
                    icon={
                        <Users className="h-3.5 w-3.5" />
                    }
                />

                <InfoItem
                    label="Deadline"
                    value={
                        vacancy.applicationDeadline
                            ? formatDate(
                                  vacancy.applicationDeadline,
                              )
                            : "No deadline"
                    }
                    icon={
                        <CalendarDays className="h-3.5 w-3.5" />
                    }
                />
            </div>

            {/* Main content */}
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0 space-y-6">
                    <Section
                        title="Job Description"
                        icon={
                            <FileText className="h-4 w-4" />
                        }
                    >
                        <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                            {vacancy.description ||
                                "No job description has been provided."}
                        </div>
                    </Section>

                    <Section
                        title="Responsibilities"
                        icon={
                            <CheckCircle2 className="h-4 w-4" />
                        }
                    >
                        <BulletList
                            items={
                                vacancy.responsibilities
                            }
                            emptyText="No responsibilities have been specified."
                        />
                    </Section>

                    <Section
                        title="Requirements"
                        icon={
                            <ClipboardList className="h-4 w-4" />
                        }
                    >
                        <BulletList
                            items={
                                vacancy.requirements
                            }
                            emptyText="No requirements have been specified."
                        />
                    </Section>

                    <Section
                        title="Qualifications"
                        icon={
                            <CheckCircle2 className="h-4 w-4" />
                        }
                    >
                        <BulletList
                            items={
                                vacancy.qualifications
                            }
                            emptyText="No specific qualifications have been specified."
                        />
                    </Section>

                    <Section
                        title="Skills"
                        icon={
                            <BriefcaseBusiness className="h-4 w-4" />
                        }
                    >
                        {vacancy.skills &&
                        vacancy.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {vacancy.skills.map(
                                    (
                                        skill,
                                        index,
                                    ) => (
                                        <span
                                            key={`${skill}-${index}`}
                                            className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700"
                                        >
                                            {skill}
                                        </span>
                                    ),
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                No skills have been specified.
                            </p>
                        )}
                    </Section>

                    {/* Metadata */}
                    <Card className="overflow-hidden">
                        <button
                            type="button"
                            onClick={() =>
                                setShowMetadata(
                                    (current) =>
                                        !current,
                                )
                            }
                            className="flex w-full items-center justify-between px-5 py-4 text-left"
                        >
                            <span className="font-semibold text-gray-900">
                                Vacancy Metadata
                            </span>

                            {showMetadata ? (
                                <ChevronUp className="h-5 w-5 text-gray-500" />
                            ) : (
                                <ChevronDown className="h-5 w-5 text-gray-500" />
                            )}
                        </button>

                        {showMetadata && (
                            <div className="border-t border-gray-100 px-5 py-4">
                                <dl className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Vacancy ID
                                        </dt>
                                        <dd className="mt-1 break-all text-sm text-gray-800">
                                            {vacancy.id}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Slug
                                        </dt>
                                        <dd className="mt-1 break-all text-sm text-gray-800">
                                            {vacancy.slug}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Created
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-800">
                                            {formatDateTime(
                                                vacancy.createdAt,
                                            )}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Last Updated
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-800">
                                            {formatDateTime(
                                                vacancy.updatedAt,
                                            )}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Published
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-800">
                                            {formatDateTime(
                                                vacancy.publishedAt,
                                            )}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Closed
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-800">
                                            {formatDateTime(
                                                vacancy.closedAt,
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Sidebar */}
                <aside className="space-y-6">
                    <Section
                        title="Vacancy Actions"
                        icon={
                            <BriefcaseBusiness className="h-4 w-4" />
                        }
                    >
                        <div className="space-y-2">
                            {canUpdate &&
                                canPublish && (
                                    <Button
                                        type="button"
                                        className="w-full justify-start"
                                        onClick={() =>
                                            setConfirmAction(
                                                "publish",
                                            )
                                        }
                                        disabled={
                                            actionLoading
                                        }
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        {status ===
                                        JOB_VACANCY_STATUSES.DRAFT
                                            ? "Publish Vacancy"
                                            : "Reopen Vacancy"}
                                    </Button>
                                )}

                            {canUpdate &&
                                canPause && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() =>
                                            setConfirmAction(
                                                "pause",
                                            )
                                        }
                                        disabled={
                                            actionLoading
                                        }
                                    >
                                        <PauseCircle className="mr-2 h-4 w-4" />
                                        Pause Vacancy
                                    </Button>
                                )}

                            {canUpdate &&
                                canClose && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() =>
                                            setConfirmAction(
                                                "close",
                                            )
                                        }
                                        disabled={
                                            actionLoading
                                        }
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Close Vacancy
                                    </Button>
                                )}

                            {canUpdate &&
                                canCancel && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-start text-red-600 hover:text-red-700"
                                        onClick={() =>
                                            setConfirmAction(
                                                "cancel",
                                            )
                                        }
                                        disabled={
                                            actionLoading
                                        }
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Cancel Vacancy
                                    </Button>
                                )}

                            {canDelete && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full justify-start text-red-600 hover:text-red-700"
                                    onClick={() =>
                                        setConfirmAction(
                                            "delete",
                                        )
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Vacancy
                                </Button>
                            )}
                        </div>

                        {!canUpdate &&
                            !canDelete && (
                                <p className="text-sm text-gray-500">
                                    You have view-only access to
                                    this vacancy.
                                </p>
                            )}
                    </Section>

                    <Section
                        title="Public Vacancy"
                        icon={
                            <Globe2 className="h-4 w-4" />
                        }
                    >
                        <div className="space-y-3">
                            <div className="break-all rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                                {publicUrl}
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        void copyPublicUrl()
                                    }
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    {copied
                                        ? "Copied"
                                        : "Copy Link"}
                                </Button>

                                <a
                                    href={publicUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Open Public Page
                                </a>
                            </div>
                        </div>
                    </Section>

                    <Section
                        title="Job Information"
                        icon={
                            <BriefcaseBusiness className="h-4 w-4" />
                        }
                    >
                        <dl className="space-y-4">
                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-sm text-gray-500">
                                    Employment
                                </dt>
                                <dd className="text-right text-sm font-medium text-gray-900">
                                    {EMPLOYMENT_LABELS[
                                        vacancy.employmentType
                                    ] ??
                                        vacancy.employmentType}
                                </dd>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-sm text-gray-500">
                                    Location
                                </dt>
                                <dd className="text-right text-sm font-medium text-gray-900">
                                    {vacancy.isRemote
                                        ? "Remote"
                                        : vacancy.location ||
                                          "Not specified"}
                                </dd>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-sm text-gray-500">
                                    Salary Type
                                </dt>
                                <dd className="text-right text-sm font-medium text-gray-900">
                                    {SALARY_LABELS[
                                        vacancy.salaryType
                                    ] ??
                                        vacancy.salaryType}
                                </dd>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-sm text-gray-500">
                                    Currency
                                </dt>
                                <dd className="text-right text-sm font-medium text-gray-900">
                                    {vacancy.salaryCurrency ||
                                        DEFAULT_CURRENCY}
                                </dd>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-sm text-gray-500">
                                    Openings
                                </dt>
                                <dd className="text-right text-sm font-medium text-gray-900">
                                    {vacancy.openings}
                                </dd>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-sm text-gray-500">
                                    Deadline
                                </dt>
                                <dd className="text-right text-sm font-medium text-gray-900">
                                    {vacancy.applicationDeadline
                                        ? formatDate(
                                              vacancy.applicationDeadline,
                                          )
                                        : "No deadline"}
                                </dd>
                            </div>
                        </dl>
                    </Section>

                    {canManage && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                Management Access
                            </p>

                            <p className="mt-1 text-sm leading-6 text-blue-800">
                                You have full vacancy management
                                permission.
                            </p>
                        </div>
                    )}
                </aside>
            </div>

            {/* Confirmation modal */}
            {confirmAction && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    role="dialog"
                    aria-modal="true"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setConfirmAction(null);
                        }
                    }}
                >
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start gap-4">
                            <div
                                className={`rounded-full p-3 ${
                                    confirmAction ===
                                        "delete" ||
                                    confirmAction ===
                                        "cancel"
                                        ? "bg-red-100 text-red-600"
                                        : "bg-blue-100 text-blue-600"
                                }`}
                            >
                                {confirmAction ===
                                    "delete" ||
                                confirmAction ===
                                    "cancel" ? (
                                    <Trash2 className="h-5 w-5" />
                                ) : (
                                    <CheckCircle2 className="h-5 w-5" />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {confirmAction ===
                                        "publish" &&
                                        (status ===
                                        JOB_VACANCY_STATUSES.DRAFT
                                            ? "Publish vacancy?"
                                            : "Reopen vacancy?")}

                                    {confirmAction ===
                                        "pause" &&
                                        "Pause vacancy?"}

                                    {confirmAction ===
                                        "close" &&
                                        "Close vacancy?"}

                                    {confirmAction ===
                                        "cancel" &&
                                        "Cancel vacancy?"}

                                    {confirmAction ===
                                        "delete" &&
                                        "Delete vacancy?"}
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-gray-600">
                                    {confirmAction ===
                                        "publish" &&
                                        "This will change the vacancy to OPEN and make it available publicly."}

                                    {confirmAction ===
                                        "pause" &&
                                        "This will temporarily stop the vacancy from accepting new applications."}

                                    {confirmAction ===
                                        "close" &&
                                        "This will close the vacancy and stop recruitment for this position."}

                                    {confirmAction ===
                                        "cancel" &&
                                        "This will cancel the vacancy. Make sure this is intentional."}

                                    {confirmAction ===
                                        "delete" &&
                                        "This action cannot be undone. The vacancy will be permanently removed."}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    setConfirmAction(
                                        null,
                                    )
                                }
                                disabled={
                                    actionLoading
                                }
                            >
                                Keep Vacancy
                            </Button>

                            <Button
                                type="button"
                                className={
                                    confirmAction ===
                                        "delete" ||
                                    confirmAction ===
                                        "cancel"
                                        ? "bg-red-600 hover:bg-red-700"
                                        : ""
                                }
                                onClick={() =>
                                    void executeAction(
                                        confirmAction,
                                    )
                                }
                                disabled={
                                    actionLoading
                                }
                            >
                                {actionLoading && (
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                )}

                                {actionLoading
                                    ? "Processing..."
                                    : confirmAction ===
                                        "delete"
                                    ? "Delete"
                                    : confirmAction ===
                                        "cancel"
                                    ? "Cancel Vacancy"
                                    : confirmAction ===
                                        "pause"
                                    ? "Pause Vacancy"
                                    : confirmAction ===
                                        "close"
                                    ? "Close Vacancy"
                                    : status ===
                                        JOB_VACANCY_STATUSES.DRAFT
                                    ? "Publish Vacancy"
                                    : "Reopen Vacancy"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
