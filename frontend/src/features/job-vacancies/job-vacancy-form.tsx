"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { jobVacanciesApi } from "@/services/api/job-vacancies.api";

import {
    JOB_EMPLOYMENT_TYPES,
    JOB_SALARY_TYPES,
    JOB_VACANCY_STATUSES,
    type CreateJobVacancyInput,
} from "./job-vacancy.types";

const initialForm: CreateJobVacancyInput = {
    title: "",
    slug: "",
    department: "",
    jobTitle: "",
    description: "",
    responsibilities: [],
    requirements: [],
    qualifications: [],
    skills: [],
    employmentType: JOB_EMPLOYMENT_TYPES.FULL_TIME,
    location: "",
    isRemote: false,
    salaryType: JOB_SALARY_TYPES.UNDISCLOSED,
    salaryMin: undefined,
    salaryMax: undefined,
    salaryCurrency: "BDT",
    openings: 1,
    applicationDeadline: "",
    status: JOB_VACANCY_STATUSES.DRAFT,
};

export default function JobVacancyForm() {
    const router = useRouter();

    const [form, setForm] =
        useState<CreateJobVacancyInput>(initialForm);

    const [responsibilitiesText, setResponsibilitiesText] =
        useState("");

    const [requirementsText, setRequirementsText] =
        useState("");

    const [qualificationsText, setQualificationsText] =
        useState("");

    const [skillsText, setSkillsText] =
        useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const updateField = <
        K extends keyof CreateJobVacancyInput,
    >(
        field: K,
        value: CreateJobVacancyInput[K],
    ) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const handleRemoteChange = (
        remote: boolean,
    ) => {
        setForm((current) => ({
            ...current,
            isRemote: remote,
            location: remote
                ? ""
                : current.location,
        }));
    };

    const handleSalaryTypeChange = (
        salaryType: CreateJobVacancyInput["salaryType"],
    ) => {
        setForm((current) => ({
            ...current,
            salaryType,
            salaryMin:
                salaryType === JOB_SALARY_TYPES.UNDISCLOSED ||
                salaryType === JOB_SALARY_TYPES.NEGOTIABLE
                    ? undefined
                    : current.salaryMin,
            salaryMax:
                salaryType === JOB_SALARY_TYPES.FIXED ||
                salaryType === JOB_SALARY_TYPES.UNDISCLOSED ||
                salaryType === JOB_SALARY_TYPES.NEGOTIABLE
                    ? undefined
                    : current.salaryMax,
        }));
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        try {
            setLoading(true);
            setError("");

            if (
                !form.isRemote &&
                !form.location?.trim()
            ) {
                setError(
                    "Please provide a job location or enable Remote.",
                );
                return;
            }

            if (
                form.salaryType ===
                    JOB_SALARY_TYPES.FIXED &&
                form.salaryMin === undefined
            ) {
                setError(
                    "Please provide the salary amount for a fixed salary.",
                );
                return;
            }

            if (
                form.salaryType ===
                    JOB_SALARY_TYPES.RANGE &&
                (form.salaryMin === undefined ||
                    form.salaryMax === undefined)
            ) {
                setError(
                    "Please provide both minimum and maximum salary.",
                );
                return;
            }

            if (
                form.salaryMin !== undefined &&
                form.salaryMax !== undefined &&
                form.salaryMin > form.salaryMax
            ) {
                setError(
                    "Minimum salary cannot be greater than maximum salary.",
                );
                return;
            }

            const input: CreateJobVacancyInput = {
                ...form,

                slug: form.slug
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, ""),

                location: form.isRemote
                    ? undefined
                    : form.location?.trim() || undefined,

                responsibilities:
                    responsibilitiesText
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean),

                requirements:
                    requirementsText
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean),

                qualifications:
                    qualificationsText
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean),

                skills:
                    skillsText
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean),

                salaryMin:
                    form.salaryMin !== undefined
                        ? Number(form.salaryMin)
                        : undefined,

                salaryMax:
                    form.salaryMax !== undefined
                        ? Number(form.salaryMax)
                        : undefined,

                salaryCurrency:
                    form.salaryCurrency
                        ?.trim()
                        .toUpperCase() || "BDT",

                openings: Number(form.openings),

                applicationDeadline:
                    form.applicationDeadline || undefined,
            };

            const vacancy =
                await jobVacanciesApi.create(input);

            router.push(
                `/admin/job-vacancies/${vacancy.id}`,
            );
        } catch {
            setError(
                "Unable to create the job vacancy. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-8"
        >
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* ------------------------------------------------ */}
            {/* Basic Information */}
            {/* ------------------------------------------------ */}

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                    Basic Information
                </h2>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                    {/* Title */}

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Vacancy title
                        </label>

                        <input
                            required
                            value={form.title}
                            onChange={(event) =>
                                updateField(
                                    "title",
                                    event.target.value,
                                )
                            }
                            placeholder="e.g. Backend Developer"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                        />
                    </div>

                    {/* Job Title */}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Job title
                        </label>

                        <input
                            required
                            value={form.jobTitle}
                            onChange={(event) =>
                                updateField(
                                    "jobTitle",
                                    event.target.value,
                                )
                            }
                            placeholder="e.g. Software Engineer"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                        />
                    </div>

                    {/* Slug */}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Slug
                        </label>

                        <input
                            required
                            value={form.slug}
                            onChange={(event) =>
                                updateField(
                                    "slug",
                                    event.target.value
                                        .toLowerCase()
                                        .replace(
                                            /[^a-z0-9]+/g,
                                            "-",
                                        )
                                        .replace(
                                            /^-+|-+$/g,
                                            "",
                                        ),
                                )
                            }
                            placeholder="e.g. backend-developer"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                        />
                    </div>

                    {/* Department */}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Department
                        </label>

                        <input
                            required
                            value={form.department}
                            onChange={(event) =>
                                updateField(
                                    "department",
                                    event.target.value,
                                )
                            }
                            placeholder="e.g. Technology"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                        />
                    </div>

                    {/* Employment Type */}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Employment type
                        </label>

                        <select
                            value={form.employmentType}
                            onChange={(event) =>
                                updateField(
                                    "employmentType",
                                    event.target
                                        .value as CreateJobVacancyInput["employmentType"],
                                )
                            }
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                        >
                            {Object.values(
                                JOB_EMPLOYMENT_TYPES,
                            ).map((type) => (
                                <option
                                    key={type}
                                    value={type}
                                >
                                    {type.replace(
                                        /_/g,
                                        " ",
                                    )}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Remote */}

                    <div className="md:col-span-2">
                        <label className="flex cursor-pointer items-center gap-3">
                            <input
                                type="checkbox"
                                checked={form.isRemote}
                                onChange={(event) =>
                                    handleRemoteChange(
                                        event.target
                                            .checked,
                                    )
                                }
                                className="h-4 w-4 rounded border-gray-300"
                            />

                            <span className="text-sm font-medium text-gray-700">
                                This is a remote position
                            </span>
                        </label>
                    </div>

                    {/* Location */}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Location
                        </label>

                        <input
                            disabled={form.isRemote}
                            value={form.location ?? ""}
                            onChange={(event) =>
                                updateField(
                                    "location",
                                    event.target.value,
                                )
                            }
                            placeholder={
                                form.isRemote
                                    ? "Remote position"
                                    : "e.g. Dhaka, Bangladesh"
                            }
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />
                    </div>

                    {/* Openings */}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Number of openings
                        </label>

                        <input
                            required
                            type="number"
                            min={1}
                            value={form.openings}
                            onChange={(event) =>
                                updateField(
                                    "openings",
                                    Number(
                                        event.target.value,
                                    ),
                                )
                            }
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                        />
                    </div>
                </div>
            </section>

            {/* ------------------------------------------------ */}
            {/* Job Description */}
            {/* ------------------------------------------------ */}

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                    Job Description
                </h2>

                <div className="mt-6">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Description
                    </label>

                    <textarea
                        required
                        rows={7}
                        value={form.description}
                        onChange={(event) =>
                            updateField(
                                "description",
                                event.target.value,
                            )
                        }
                        placeholder="Describe the role, team, purpose and expectations..."
                        className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                    />
                </div>

                <div className="mt-5">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Responsibilities
                    </label>

                    <textarea
                        rows={6}
                        value={responsibilitiesText}
                        onChange={(event) =>
                            setResponsibilitiesText(
                                event.target.value,
                            )
                        }
                        placeholder="One responsibility per line"
                        className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                    />
                </div>

                <div className="mt-5">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Requirements
                    </label>

                    <textarea
                        rows={6}
                        value={requirementsText}
                        onChange={(event) =>
                            setRequirementsText(
                                event.target.value,
                            )
                        }
                        placeholder="One requirement per line"
                        className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                    />
                </div>

                <div className="mt-5">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Qualifications
                    </label>

                    <textarea
                        rows={5}
                        value={qualificationsText}
                        onChange={(event) =>
                            setQualificationsText(
                                event.target.value,
                            )
                        }
                        placeholder="One qualification per line"
                        className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                    />
                </div>

                <div className="mt-5">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Skills
                    </label>

                    <textarea
                        rows={5}
                        value={skillsText}
                        onChange={(event) =>
                            setSkillsText(
                                event.target.value,
                            )
                        }
                        placeholder="One skill per line"
                        className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                    />
                </div>
            </section>

            {/* ------------------------------------------------ */}
            {/* Compensation */}
            {/* ------------------------------------------------ */}

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                    Compensation & Deadline
                </h2>

                <div className="mt-6 grid gap-5 md:grid-cols-3">
                    {/* Salary Type */}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Salary type
                        </label>

                        <select
                            value={form.salaryType}
                            onChange={(event) =>
                                handleSalaryTypeChange(
                                    event.target
                                        .value as CreateJobVacancyInput["salaryType"],
                                )
                            }
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                        >
                            {Object.values(
                                JOB_SALARY_TYPES,
                            ).map((type) => (
                                <option
                                    key={type}
                                    value={type}
                                >
                                    {type.replace(
                                        /_/g,
                                        " ",
                                    )}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Currency */}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Currency
                        </label>

                        <input
                            value={
                                form.salaryCurrency ?? ""
                            }
                            onChange={(event) =>
                                updateField(
                                    "salaryCurrency",
                                    event.target.value
                                        .toUpperCase(),
                                )
                            }
                            placeholder="BDT"
                            maxLength={10}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm uppercase outline-none focus:border-gray-500"
                        />
                    </div>

                    {/* Minimum Salary */}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Minimum salary
                        </label>

                        <input
                            type="number"
                            min={0}
                            disabled={
                                form.salaryType ===
                                    JOB_SALARY_TYPES.UNDISCLOSED ||
                                form.salaryType ===
                                    JOB_SALARY_TYPES.NEGOTIABLE
                            }
                            value={
                                form.salaryMin ?? ""
                            }
                            onChange={(event) =>
                                updateField(
                                    "salaryMin",
                                    event.target.value !==
                                        ""
                                        ? Number(
                                              event
                                                  .target
                                                  .value,
                                          )
                                        : undefined,
                                )
                            }
                            placeholder="e.g. 30000"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />
                    </div>

                    {/* Maximum Salary */}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Maximum salary
                        </label>

                        <input
                            type="number"
                            min={0}
                            disabled={
                                form.salaryType !==
                                    JOB_SALARY_TYPES.RANGE
                            }
                            value={
                                form.salaryMax ?? ""
                            }
                            onChange={(event) =>
                                updateField(
                                    "salaryMax",
                                    event.target.value !==
                                        ""
                                        ? Number(
                                              event
                                                  .target
                                                  .value,
                                          )
                                        : undefined,
                                )
                            }
                            placeholder="e.g. 60000"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />
                    </div>

                    {/* Deadline */}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Application deadline
                        </label>

                        <input
                            type="date"
                            value={
                                form.applicationDeadline ??
                                ""
                            }
                            onChange={(event) =>
                                updateField(
                                    "applicationDeadline",
                                    event.target.value,
                                )
                            }
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                        />
                    </div>

                    {/* Status */}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Initial status
                        </label>

                        <select
                            value={
                                form.status ??
                                JOB_VACANCY_STATUSES.DRAFT
                            }
                            onChange={(event) =>
                                updateField(
                                    "status",
                                    event.target
                                        .value as CreateJobVacancyInput["status"],
                                )
                            }
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                        >
                            <option
                                value={
                                    JOB_VACANCY_STATUSES.DRAFT
                                }
                            >
                                Draft
                            </option>

                            <option
                                value={
                                    JOB_VACANCY_STATUSES.OPEN
                                }
                            >
                                Open
                            </option>
                        </select>
                    </div>
                </div>

                <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    Salary currency is set to BDT by
                    default for NOPTRIX Bangladesh.
                </div>
            </section>

            {/* ------------------------------------------------ */}
            {/* Actions */}
            {/* ------------------------------------------------ */}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                        router.push(
                            "/admin/job-vacancies",
                        )
                    }
                    className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading
                        ? "Creating..."
                        : "Create Vacancy"}
                </button>
            </div>
        </form>
    );
}