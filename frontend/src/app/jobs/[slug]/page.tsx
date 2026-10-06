import type {
    Metadata,
} from "next";

import Link from "next/link";

import {
    notFound,
} from "next/navigation";

import {
    ArrowLeft,
    ArrowUpRight,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Globe2,
    MapPin,
    ShieldCheck,
    Users,
} from "lucide-react";

import { env } from "@/config/env";

import type {
    JobVacancy,
    JobVacancyApiResponse,
} from "@/features/job-vacancies/job-vacancy.types";

import {
    normalizeJobVacancy,
} from "@/features/job-vacancies/job-vacancy.types";

import type {
    ApiResponse,
} from "@/types/api";

import JobApplicationForm from "@/features/job-applications/job-application-form";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface PublicJobPageProps {
    params: Promise<{
        slug: string;
    }>;
}

/*
|--------------------------------------------------------------------------
| Data
|--------------------------------------------------------------------------
*/

const getPublicVacancy = async (
    slug: string,
): Promise<JobVacancy | null> => {
    const response = await fetch(
        `${env.apiUrl}/job-vacancies/public/${encodeURIComponent(
            slug,
        )}`,
        {
            cache: "no-store",
        },
    );

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(
            `Unable to load job vacancy (${response.status}).`,
        );
    }

    const result =
        (await response.json()) as ApiResponse<JobVacancyApiResponse>;

    if (!result.data) {
        return null;
    }

    if (result.data.status !== "OPEN") {
        return null;
    }

    return normalizeJobVacancy(result.data);
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const formatLabel = (
    value: string,
): string =>
    value
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) =>
            character.toUpperCase(),
        );

const formatDate = (
    value?: string | Date,
): string | null => {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric",
        },
    ).format(date);
};

const formatSalary = (
    vacancy: JobVacancy,
): string | null => {
    if (
        vacancy.salaryType ===
        "UNDISCLOSED"
    ) {
        return null;
    }

    if (
        vacancy.salaryType ===
        "NEGOTIABLE"
    ) {
        return "Negotiable";
    }

    const currency =
        vacancy.salaryCurrency ||
        "SAR";

    const formatter =
        new Intl.NumberFormat(
            "en-US",
            {
                maximumFractionDigits: 0,
            },
        );

    if (
        vacancy.salaryType ===
            "FIXED" &&
        vacancy.salaryMin !==
            undefined &&
        vacancy.salaryMin !== null
    ) {
        return `${currency} ${formatter.format(
            vacancy.salaryMin,
        )}`;
    }

    if (
        vacancy.salaryMin !==
            undefined &&
        vacancy.salaryMin !== null &&
        vacancy.salaryMax !==
            undefined &&
        vacancy.salaryMax !== null
    ) {
        return `${currency} ${formatter.format(
            vacancy.salaryMin,
        )} – ${currency} ${formatter.format(
            vacancy.salaryMax,
        )}`;
    }

    return null;
};

const getEmploymentLabel = (
    employmentType: string,
): string =>
    formatLabel(employmentType);

const getLocationLabel = (
    vacancy: JobVacancy,
): string => {
    if (vacancy.isRemote) {
        if (vacancy.location) {
            return `${vacancy.location} · Remote`;
        }

        return "Remote";
    }

    return vacancy.location ||
        "Location not specified";
};

/*
|--------------------------------------------------------------------------
| Metadata
|--------------------------------------------------------------------------
*/

export async function generateMetadata({
    params,
}: PublicJobPageProps): Promise<Metadata> {
    const { slug } = await params;

    const vacancy =
        await getPublicVacancy(slug);

    if (!vacancy) {
        return {
            title:
                "Job vacancy not found | NOPTRIX",
            description:
                "This NOPTRIX job vacancy is no longer available.",
        };
    }

    const description =
        vacancy.description
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 160);

    const canonicalPath =
        `/jobs/${encodeURIComponent(
            vacancy.slug,
        )}`;

    return {
        title: `${vacancy.title} | NOPTRIX Careers`,
        description,
        alternates: {
            canonical: canonicalPath,
        },
        openGraph: {
            title: `${vacancy.title} | NOPTRIX Careers`,
            description,
            type: "website",
            url: canonicalPath,
            siteName: "NOPTRIX",
        },
        twitter: {
            card: "summary_large_image",
            title: `${vacancy.title} | NOPTRIX Careers`,
            description,
        },
    };
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default async function PublicJobPage({
    params,
}: PublicJobPageProps) {
    const { slug } = await params;

    const vacancy =
        await getPublicVacancy(slug);

    if (!vacancy) {
        notFound();
    }

    const salary =
        formatSalary(vacancy);

    const deadline =
        formatDate(
            vacancy.applicationDeadline,
        );

    const publishedDate =
        formatDate(
            vacancy.publishedAt,
        );

    const employment =
        getEmploymentLabel(
            vacancy.employmentType,
        );

    const location =
        getLocationLabel(vacancy);

    const isRemote =
        vacancy.isRemote;

    return (
        <main className="min-h-screen bg-[#f7f8fa]">
            {/* ---------------------------------------------------------------- */}
            {/* Top navigation */}
            {/* ---------------------------------------------------------------- */}

            <div className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <Link
                        href="/"
                        className="group inline-flex items-center gap-2 text-sm font-semibold text-gray-900"
                    >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white transition group-hover:border-gray-300 group-hover:bg-gray-50">
                            <ArrowLeft
                                size={17}
                            />
                        </span>

                        <span>
                            NOPTRIX
                        </span>
                    </Link>

                    <Link
                        href="/jobs"
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                    >
                        All jobs
                        <ArrowUpRight
                            size={15}
                        />
                    </Link>
                </div>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Hero */}
            {/* ---------------------------------------------------------------- */}

            <section className="border-b border-gray-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
                    <div className="max-w-4xl">
                        <div className="mb-5 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-600">
                                {vacancy.department}
                            </span>

                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Open position
                            </span>
                        </div>

                        <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
                            {vacancy.title}
                        </h1>

                        <p className="mt-5 max-w-3xl text-base leading-7 text-gray-600 sm:text-lg">
                            Join NOPTRIX and help us build,
                            operate, and scale a modern
                            ecommerce marketplace.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700">
                                <BriefcaseBusiness
                                    size={17}
                                />
                                {employment}
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700">
                                <MapPin
                                    size={17}
                                />
                                {location}
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700">
                                <Users
                                    size={17}
                                />
                                {vacancy.openings}{" "}
                                {vacancy.openings ===
                                1
                                    ? "opening"
                                    : "openings"}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------------------- */}
            {/* Main content */}
            {/* ---------------------------------------------------------------- */}

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                    {/* ======================================================== */}
                    {/* Main column */}
                    {/* ======================================================== */}

                    <div className="min-w-0 space-y-6">
                        {/* About */}
                        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                            <div className="mb-6">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                                    The opportunity
                                </p>

                                <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950">
                                    About the role
                                </h2>
                            </div>

                            <div className="whitespace-pre-wrap text-sm leading-7 text-gray-600 sm:text-[15px]">
                                {vacancy.description}
                            </div>
                        </section>

                        {/* Responsibilities */}
                        {vacancy.responsibilities.length >
                            0 && (
                            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                                <div className="mb-6">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                                        What you will do
                                    </p>

                                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950">
                                        Responsibilities
                                    </h2>
                                </div>

                                <ul className="space-y-4">
                                    {vacancy.responsibilities.map(
                                        (
                                            item,
                                            index,
                                        ) => (
                                            <li
                                                key={`${index}-${item}`}
                                                className="flex gap-3 text-sm leading-7 text-gray-600 sm:text-[15px]"
                                            >
                                                <CheckCircle2
                                                    size={
                                                        19
                                                    }
                                                    className="mt-1 shrink-0 text-gray-900"
                                                />

                                                <span>
                                                    {
                                                        item
                                                    }
                                                </span>
                                            </li>
                                        ),
                                    )}
                                </ul>
                            </section>
                        )}

                        {/* Requirements */}
                        {vacancy.requirements.length >
                            0 && (
                            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                                <div className="mb-6">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                                        What we are looking for
                                    </p>

                                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950">
                                        Requirements
                                    </h2>
                                </div>

                                <ul className="space-y-3">
                                    {vacancy.requirements.map(
                                        (
                                            item,
                                            index,
                                        ) => (
                                            <li
                                                key={`${index}-${item}`}
                                                className="flex gap-3 text-sm leading-7 text-gray-600 sm:text-[15px]"
                                            >
                                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />

                                                <span>
                                                    {
                                                        item
                                                    }
                                                </span>
                                            </li>
                                        ),
                                    )}
                                </ul>
                            </section>
                        )}

                        {/* Qualifications */}
                        {vacancy.qualifications &&
                            vacancy
                                .qualifications
                                .length >
                                0 && (
                                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                                    <div className="mb-6">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                                            Background
                                        </p>

                                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950">
                                            Qualifications
                                        </h2>
                                    </div>

                                    <ul className="space-y-3">
                                        {vacancy.qualifications.map(
                                            (
                                                item,
                                                index,
                                            ) => (
                                                <li
                                                    key={`${index}-${item}`}
                                                    className="flex gap-3 text-sm leading-7 text-gray-600 sm:text-[15px]"
                                                >
                                                    <CheckCircle2
                                                        size={
                                                            18
                                                        }
                                                        className="mt-1 shrink-0 text-gray-700"
                                                    />

                                                    <span>
                                                        {
                                                            item
                                                        }
                                                    </span>
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </section>
                            )}

                        {/* Skills */}
                        {vacancy.skills &&
                            vacancy.skills.length >
                                0 && (
                                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                                    <div className="mb-6">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                                            Core capabilities
                                        </p>

                                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950">
                                            Skills
                                        </h2>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {vacancy.skills.map(
                                            (
                                                skill,
                                            ) => (
                                                <span
                                                    key={
                                                        skill
                                                    }
                                                    className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm font-medium text-gray-700"
                                                >
                                                    {
                                                        skill
                                                    }
                                                </span>
                                            ),
                                        )}
                                    </div>
                                </section>
                            )}

                        {/* Application */}
                        <section
                            id="apply"
                            className="scroll-mt-8"
                        >
                            <JobApplicationForm
                                vacancyId={
                                    vacancy.id
                                }
                                vacancyTitle={
                                    vacancy.title
                                }
                                returnUrl={`/jobs/${encodeURIComponent(
                                    vacancy.slug,
                                )}`}
                            />
                        </section>
                    </div>

                    {/* ======================================================== */}
                    {/* Sidebar */}
                    {/* ======================================================== */}

                    <aside className="lg:sticky lg:top-6 lg:self-start">
                        <div className="space-y-4">
                            {/* Apply card */}
                            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                <div className="border-b border-gray-100 bg-gray-950 px-6 py-6 text-white">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                                        Ready to apply?
                                    </p>

                                    <h2 className="mt-2 text-xl font-bold">
                                        Join NOPTRIX
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-gray-400">
                                        Submit your application
                                        for this position.
                                    </p>
                                </div>

                                <div className="p-5">
                                    <Link
                                        href="#apply"
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                                    >
                                        Apply for this role
                                        <ArrowUpRight
                                            size={17}
                                        />
                                    </Link>
                                </div>
                            </div>

                            {/* Job overview */}
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h2 className="text-base font-bold text-gray-950">
                                    Job overview
                                </h2>

                                <div className="mt-5 divide-y divide-gray-100">
                                    <div className="flex gap-3 py-4 first:pt-0">
                                        <BriefcaseBusiness
                                            size={18}
                                            className="mt-0.5 shrink-0 text-gray-400"
                                        />

                                        <div>
                                            <p className="text-xs font-medium text-gray-400">
                                                Employment
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-gray-800">
                                                {
                                                    employment
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 py-4">
                                        {isRemote ? (
                                            <Globe2
                                                size={
                                                    18
                                                }
                                                className="mt-0.5 shrink-0 text-gray-400"
                                            />
                                        ) : (
                                            <MapPin
                                                size={
                                                    18
                                                }
                                                className="mt-0.5 shrink-0 text-gray-400"
                                            />
                                        )}

                                        <div>
                                            <p className="text-xs font-medium text-gray-400">
                                                Location
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-gray-800">
                                                {
                                                    location
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 py-4">
                                        <Users
                                            size={18}
                                            className="mt-0.5 shrink-0 text-gray-400"
                                        />

                                        <div>
                                            <p className="text-xs font-medium text-gray-400">
                                                Openings
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-gray-800">
                                                {
                                                    vacancy.openings
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {salary && (
                                        <div className="flex gap-3 py-4">
                                            <ShieldCheck
                                                size={
                                                    18
                                                }
                                                className="mt-0.5 shrink-0 text-gray-400"
                                            />

                                            <div>
                                                <p className="text-xs font-medium text-gray-400">
                                                    Salary
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-gray-800">
                                                    {
                                                        salary
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {deadline && (
                                        <div className="flex gap-3 py-4 last:pb-0">
                                            <CalendarDays
                                                size={
                                                    18
                                                }
                                                className="mt-0.5 shrink-0 text-gray-400"
                                            />

                                            <div>
                                                <p className="text-xs font-medium text-gray-400">
                                                    Application deadline
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-gray-800">
                                                    {
                                                        deadline
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Hiring information */}
                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                                        <Clock3
                                            size={
                                                17
                                            }
                                            className="text-gray-700"
                                        />
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">
                                            Hiring process
                                        </h3>

                                        <p className="mt-1 text-sm leading-6 text-gray-600">
                                            Applications are
                                            reviewed by the
                                            NOPTRIX team.
                                            Shortlisted
                                            candidates may be
                                            contacted for the
                                            next stage.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Published information */}
                            {publishedDate && (
                                <p className="px-1 text-xs text-gray-400">
                                    Published{" "}
                                    {publishedDate}
                                </p>
                            )}
                        </div>
                    </aside>
                </div>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Bottom mobile CTA */}
            {/* ---------------------------------------------------------------- */}

            <div className="sticky bottom-0 z-30 border-t border-gray-200 bg-white/95 p-3 backdrop-blur lg:hidden">
                <Link
                    href="#apply"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white shadow-lg"
                >
                    Apply for this role
                    <ArrowUpRight
                        size={17}
                    />
                </Link>
            </div>
        </main>
    );
}