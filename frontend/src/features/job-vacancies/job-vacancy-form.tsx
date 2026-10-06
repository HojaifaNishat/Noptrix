"use client";

import { isAxiosError } from "axios";
import {
    ArrowLeft,
    BriefcaseBusiness,
    CalendarDays,
    Check,
    ChevronDown,
    CircleAlert,
    CircleDollarSign,
    ExternalLink,
    GripVertical,
    MapPin,
    Plus,
    Save,
    Trash2,
    Users,
    X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
    useEffect,
    useMemo,
    useState,
    type FormEvent,
    type ReactNode,
} from "react";

import { jobVacanciesApi } from "@/services/api/job-vacancies.api";

import {
    JOB_EMPLOYMENT_TYPES,
    JOB_SALARY_TYPES,
    type CreateJobVacancyInput,
    type JobVacancy,
} from "./job-vacancy.types";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_CURRENCY = "BDT";

const DESCRIPTION_MIN_LENGTH = 20;
const DESCRIPTION_MAX_LENGTH = 10000;

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
    salaryCurrency: DEFAULT_CURRENCY,
    openings: 1,
    applicationDeadline: "",
};

interface JobVacancyFormProps {
    vacancyId?: string;
    initialVacancy?: JobVacancy;
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normalizeSlug = (value: string): string =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 220);

const joinDateForInput = (
    value?: string | Date,
): string => {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toISOString().slice(0, 10);
};

const getInitialForm = (
    vacancy?: JobVacancy,
): CreateJobVacancyInput => {
    if (!vacancy) {
        return {
            ...initialForm,
            responsibilities: [],
            requirements: [],
            qualifications: [],
            skills: [],
        };
    }

    return {
        title: vacancy.title,
        slug: vacancy.slug,
        department: vacancy.department,
        jobTitle: vacancy.jobTitle,
        description: vacancy.description,
        responsibilities:
            vacancy.responsibilities ?? [],
        requirements:
            vacancy.requirements ?? [],
        qualifications:
            vacancy.qualifications ?? [],
        skills: vacancy.skills ?? [],
        employmentType: vacancy.employmentType,
        location: vacancy.location ?? "",
        isRemote: vacancy.isRemote,
        salaryType: vacancy.salaryType,
        salaryMin: vacancy.salaryMin,
        salaryMax: vacancy.salaryMax,
        salaryCurrency:
            vacancy.salaryCurrency ??
            DEFAULT_CURRENCY,
        openings: vacancy.openings,
        applicationDeadline:
            joinDateForInput(
                vacancy.applicationDeadline,
            ),
    };
};

const getSaveErrorMessage = (
    error: unknown,
): string => {
    if (isAxiosError(error)) {
        const responseData: unknown =
            error.response?.data;

        if (
            typeof responseData === "object" &&
            responseData !== null &&
            "message" in responseData &&
            typeof responseData.message === "string"
        ) {
            if (
                "errors" in responseData &&
                Array.isArray(responseData.errors)
            ) {
                const firstError =
                    responseData.errors.find(
                        (
                            item,
                        ): item is {
                            field: string;
                            message: string;
                        } =>
                            typeof item ===
                                "object" &&
                            item !== null &&
                            "message" in item &&
                            typeof item.message ===
                                "string",
                    );

                if (firstError) {
                    return `${responseData.message} ${firstError.message}`;
                }
            }

            return responseData.message;
        }
    }

    return error instanceof Error
        ? error.message
        : "Unable to save the job vacancy. Please try again.";
};

const formatEnum = (
    value: string,
): string =>
    value
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) =>
            char.toUpperCase(),
        );

/*
|--------------------------------------------------------------------------
| Reusable UI
|--------------------------------------------------------------------------
*/

function Card({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={`rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${className}`}
        >
            {children}
        </section>
    );
}

function CardHeader({
    icon,
    title,
    description,
}: {
    icon: ReactNode;
    title: string;
    description?: string;
}) {
    return (
        <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                {icon}
            </div>

            <div className="min-w-0">
                <h2 className="text-sm font-bold text-gray-950">
                    {title}
                </h2>

                {description && (
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}

function Field({
    label,
    required = false,
    hint,
    children,
}: {
    label: string;
    required?: boolean;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-xs font-bold uppercase tracking-[0.08em] text-gray-600">
                    {label}

                    {required && (
                        <span className="ml-1 text-red-500">
                            *
                        </span>
                    )}
                </label>

                {hint && (
                    <span className="text-[11px] font-medium text-gray-400">
                        {hint}
                    </span>
                )}
            </div>

            {children}
        </div>
    );
}

function Input({
    value,
    onChange,
    placeholder,
    type = "text",
    disabled = false,
    min,
    max,
    step,
}: {
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    disabled?: boolean;
    min?: number;
    max?: number;
    step?: number;
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={(event) =>
                onChange(event.target.value)
            }
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
        />
    );
}

function Select({
    value,
    onChange,
    children,
}: {
    value: string;
    onChange: (value: string) => void;
    children: ReactNode;
}) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 pr-10 text-sm font-medium text-gray-900 outline-none transition hover:border-gray-300 focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5"
            >
                {children}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
    );
}

function TagInput({
    label,
    description,
    value,
    onChange,
    placeholder,
    required = false,
}: {
    label: string;
    description: string;
    value: string[];
    onChange: (value: string[]) => void;
    placeholder: string;
    required?: boolean;
}) {
    const [draft, setDraft] =
        useState("");

    const add = () => {
        const item = draft.trim();

        if (!item) {
            return;
        }

        const exists = value.some(
            (current) =>
                current.toLowerCase() ===
                item.toLowerCase(),
        );

        if (!exists) {
            onChange([...value, item]);
        }

        setDraft("");
    };

    const remove = (index: number) => {
        onChange(
            value.filter(
                (_, currentIndex) =>
                    currentIndex !== index,
            ),
        );
    };

    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (
            event.key === "Enter" ||
            event.key === ","
        ) {
            event.preventDefault();
            add();
        }

        if (
            event.key === "Backspace" &&
            !draft &&
            value.length
        ) {
            remove(value.length - 1);
        }
    };

    return (
        <div>
            <div className="mb-2">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-gray-600">
                        {label}

                        {required && (
                            <span className="ml-1 text-red-500">
                                *
                            </span>
                        )}
                    </p>

                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                        {value.length}
                    </span>
                </div>

                <p className="mt-1 text-xs leading-5 text-gray-400">
                    {description}
                </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-2.5 transition focus-within:border-gray-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-gray-900/5">
                <div className="flex flex-wrap gap-1.5">
                    {value.map(
                        (item, index) => (
                            <span
                                key={`${item}-${index}`}
                                className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm"
                            >
                                <span className="max-w-[220px] truncate">
                                    {item}
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        remove(
                                            index,
                                        )
                                    }
                                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-600"
                                    aria-label={`Remove ${item}`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ),
                    )}

                    <div className="flex min-w-[160px] flex-1 items-center gap-2 px-1">
                        <Plus className="h-3.5 w-3.5 shrink-0 text-gray-400" />

                        <input
                            value={draft}
                            onChange={(event) =>
                                setDraft(
                                    event.target
                                        .value,
                                )
                            }
                            onKeyDown={
                                handleKeyDown
                            }
                            onBlur={add}
                            placeholder={
                                value.length
                                    ? "Add another..."
                                    : placeholder
                            }
                            className="h-8 min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-gray-400"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Main
|--------------------------------------------------------------------------
*/

export default function JobVacancyForm({
    vacancyId,
    initialVacancy,
}: JobVacancyFormProps) {
    const router = useRouter();

    const isEditMode = Boolean(vacancyId);

    const [form, setForm] =
        useState<CreateJobVacancyInput>(
            () =>
                getInitialForm(
                    initialVacancy,
                ),
        );

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [saved, setSaved] =
        useState(false);

    const [
        slugManuallyEdited,
        setSlugManuallyEdited,
    ] = useState(Boolean(initialVacancy));

    const initialSnapshot = useMemo(
        () =>
            JSON.stringify(
                getInitialForm(
                    initialVacancy,
                ),
            ),
        [initialVacancy],
    );

    const currentSnapshot = useMemo(
        () => JSON.stringify(form),
        [form],
    );

    const isDirty =
        initialSnapshot !==
        currentSnapshot;

    /*
    |--------------------------------------------------------------------------
    | Derived state
    |--------------------------------------------------------------------------
    */

    const hasSalaryRange =
        form.salaryType ===
        JOB_SALARY_TYPES.RANGE;

    const hasFixedSalary =
        form.salaryType ===
        JOB_SALARY_TYPES.FIXED;

    const salaryHidden =
        form.salaryType ===
            JOB_SALARY_TYPES.UNDISCLOSED ||
        form.salaryType ===
            JOB_SALARY_TYPES.NEGOTIABLE;

    const slugPreview =
        normalizeSlug(form.slug);

    const publicPath =
        slugPreview
            ? `/jobs/${slugPreview}`
            : "/jobs/your-vacancy-slug";

    /*
    |--------------------------------------------------------------------------
    | Field updates
    |--------------------------------------------------------------------------
    */

    const updateField = <
        K extends keyof CreateJobVacancyInput,
    >(
        field: K,
        value: CreateJobVacancyInput[K],
    ) => {
        setSaved(false);
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const updateTitle = (
        value: string,
    ) => {
        setSaved(false);

        setForm((current) => ({
            ...current,
            title: value,
            slug: slugManuallyEdited
                ? current.slug
                : normalizeSlug(value),
        }));
    };

    const handleRemoteChange = (
        remote: boolean,
    ) => {
        setSaved(false);

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
        setSaved(false);

        setForm((current) => {
            if (
                salaryType ===
                    JOB_SALARY_TYPES.UNDISCLOSED ||
                salaryType ===
                    JOB_SALARY_TYPES.NEGOTIABLE
            ) {
                return {
                    ...current,
                    salaryType,
                    salaryMin: undefined,
                    salaryMax: undefined,
                };
            }

            if (
                salaryType ===
                JOB_SALARY_TYPES.FIXED
            ) {
                return {
                    ...current,
                    salaryType,
                    salaryMax: undefined,
                };
            }

            return {
                ...current,
                salaryType,
            };
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Browser navigation protection
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!isDirty || loading) {
            return;
        }

        const handleBeforeUnload = (
            event: BeforeUnloadEvent,
        ) => {
            event.preventDefault();
        };

        window.addEventListener(
            "beforeunload",
            handleBeforeUnload,
        );

        return () => {
            window.removeEventListener(
                "beforeunload",
                handleBeforeUnload,
            );
        };
    }, [isDirty, loading]);

    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */

    const validateForm = (): string | null => {
        const title =
            form.title.trim();

        const jobTitle =
            form.jobTitle.trim();

        const department =
            form.department.trim();

        const description =
            form.description.trim();

        const slug =
            normalizeSlug(form.slug);

        if (title.length < 3) {
            return "Vacancy title must contain at least 3 characters.";
        }

        if (jobTitle.length < 2) {
            return "Job title must contain at least 2 characters.";
        }

        if (department.length < 2) {
            return "Department must contain at least 2 characters.";
        }

        if (!slug) {
            return "Please provide a valid vacancy slug.";
        }

        if (
            description.length <
            DESCRIPTION_MIN_LENGTH
        ) {
            return `Job description must contain at least ${DESCRIPTION_MIN_LENGTH} characters.`;
        }

        if (
            description.length >
            DESCRIPTION_MAX_LENGTH
        ) {
            return `Job description cannot exceed ${DESCRIPTION_MAX_LENGTH} characters.`;
        }

        if (!form.responsibilities.length) {
            return "Please add at least one responsibility.";
        }

        if (!form.requirements.length) {
            return "Please add at least one requirement.";
        }

        if (
            !form.isRemote &&
            !form.location?.trim()
        ) {
            return "Please provide a job location or enable Remote.";
        }

        if (form.openings < 1) {
            return "Number of openings must be at least 1.";
        }

        if (
            hasFixedSalary &&
            form.salaryMin === undefined
        ) {
            return "Please provide the salary amount for a fixed salary.";
        }

        if (
            hasSalaryRange &&
            (form.salaryMin === undefined ||
                form.salaryMax === undefined)
        ) {
            return "Please provide both minimum and maximum salary.";
        }

        if (
            form.salaryMin !== undefined &&
            form.salaryMin < 0
        ) {
            return "Minimum salary cannot be negative.";
        }

        if (
            form.salaryMax !== undefined &&
            form.salaryMax < 0
        ) {
            return "Maximum salary cannot be negative.";
        }

        if (
            form.salaryMin !== undefined &&
            form.salaryMax !== undefined &&
            form.salaryMin >
                form.salaryMax
        ) {
            return "Minimum salary cannot be greater than maximum salary.";
        }

        if (form.applicationDeadline) {
            const deadline =
                new Date(
                    `${form.applicationDeadline}T23:59:59`,
                );

            if (
                Number.isNaN(
                    deadline.getTime(),
                )
            ) {
                return "Please provide a valid application deadline.";
            }
        }

        return null;
    };

    /*
    |--------------------------------------------------------------------------
    | Submit
    |--------------------------------------------------------------------------
    */

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        const validationError =
            validateForm();

        if (validationError) {
            setError(validationError);
            setSaved(false);

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });

            return;
        }

        try {
            setLoading(true);
            setError("");
            setSaved(false);

            const input: CreateJobVacancyInput =
                {
                    ...form,

                    title:
                        form.title.trim(),

                    slug: normalizeSlug(
                        form.slug,
                    ),

                    department:
                        form.department.trim(),

                    jobTitle:
                        form.jobTitle.trim(),

                    description:
                        form.description.trim(),

                    responsibilities:
                        form.responsibilities,

                    requirements:
                        form.requirements,

                    qualifications:
                        form.qualifications,

                    skills:
                        form.skills,

                    location:
                        form.isRemote
                            ? undefined
                            : form.location
                                  ?.trim() ||
                              undefined,

                    salaryMin:
                        form.salaryMin !==
                        undefined
                            ? Number(
                                  form.salaryMin,
                              )
                            : undefined,

                    salaryMax:
                        form.salaryMax !==
                        undefined
                            ? Number(
                                  form.salaryMax,
                              )
                            : undefined,

                    salaryCurrency:
                        form.salaryCurrency
                            ?.trim()
                            .toUpperCase() ||
                        DEFAULT_CURRENCY,

                    openings:
                        Number(
                            form.openings,
                        ),

                    applicationDeadline:
                        form.applicationDeadline ||
                        undefined,
                };

            const vacancy =
                vacancyId
                    ? await jobVacanciesApi.update(
                          vacancyId,
                          {
                              title:
                                  input.title,
                              slug:
                                  input.slug,
                              department:
                                  input.department,
                              jobTitle:
                                  input.jobTitle,
                              description:
                                  input.description,
                              responsibilities:
                                  input.responsibilities,
                              requirements:
                                  input.requirements,
                              qualifications:
                                  input.qualifications,
                              skills:
                                  input.skills,
                              employmentType:
                                  input.employmentType,
                              location:
                                  input.location,
                              isRemote:
                                  input.isRemote,
                              salaryType:
                                  input.salaryType,
                              salaryMin:
                                  input.salaryMin,
                              salaryMax:
                                  input.salaryMax,
                              salaryCurrency:
                                  input.salaryCurrency,
                              openings:
                                  input.openings,
                              applicationDeadline:
                                  input.applicationDeadline,
                          },
                      )
                    : await jobVacanciesApi.create(
                          input,
                      );

            setSaved(true);

            router.push(
                `/admin/job-vacancies/${vacancy.id}`,
            );
        } catch (submitError) {
            setError(
                getSaveErrorMessage(
                    submitError,
                ),
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Cancel
    |--------------------------------------------------------------------------
    */

    const handleCancel = () => {
        if (
            isDirty &&
            !window.confirm(
                "You have unsaved changes. Leave this page anyway?",
            )
        ) {
            return;
        }

        router.push(
            vacancyId
                ? `/admin/job-vacancies/${vacancyId}`
                : "/admin/job-vacancies",
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <form
            onSubmit={handleSubmit}
            className="min-h-screen bg-gray-50/70 pb-28"
        >
            {/* ===================================================== */}
            {/* Top header */}
            {/* ===================================================== */}

            <div className="border-b border-gray-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={
                                    handleCancel
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                                aria-label="Go back"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>

                            <div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span>
                                        Jobs
                                    </span>

                                    <span>
                                        /
                                    </span>

                                    <span className="font-medium text-gray-600">
                                        {isEditMode
                                            ? "Edit vacancy"
                                            : "New vacancy"}
                                    </span>
                                </div>

                                <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-950">
                                    {isEditMode
                                        ? "Edit job vacancy"
                                        : "Create job vacancy"}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {isDirty && (
                                <span className="hidden rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 sm:inline-flex">
                                    Unsaved changes
                                </span>
                            )}

                            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500">
                                Draft workflow
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
                {/* ================================================= */}
                {/* Main column */}
                {/* ================================================= */}

                <div className="min-w-0 space-y-5">
                    {/* Error */}

                    {error && (
                        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                                <CircleAlert className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-sm font-bold text-red-900">
                                    Unable to save vacancy
                                </p>

                                <p className="mt-1 text-xs leading-5 text-red-700">
                                    {error}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setError(
                                        "",
                                    )
                                }
                                className="ml-auto text-red-400 hover:text-red-700"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* ================================================= */}
                    {/* Position */}
                    {/* ================================================= */}

                    <Card>
                        <CardHeader
                            icon={
                                <BriefcaseBusiness className="h-4 w-4" />
                            }
                            title="Position"
                            description="Basic information candidates will see first."
                        />

                        <div className="space-y-5 p-5 sm:p-6">
                            <Field
                                label="Vacancy title"
                                required
                                hint={`${form.title.length}/200`}
                            >
                                <Input
                                    value={
                                        form.title
                                    }
                                    onChange={
                                        updateTitle
                                    }
                                    placeholder="Senior Backend Engineer"
                                />
                            </Field>

                            <div className="grid gap-5 md:grid-cols-2">
                                <Field
                                    label="Job title"
                                    required
                                >
                                    <Input
                                        value={
                                            form.jobTitle
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                "jobTitle",
                                                value,
                                            )
                                        }
                                        placeholder="Software Engineer"
                                    />
                                </Field>

                                <Field
                                    label="Department"
                                    required
                                >
                                    <Input
                                        value={
                                            form.department
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                "department",
                                                value,
                                            )
                                        }
                                        placeholder="Engineering"
                                    />
                                </Field>
                            </div>

                            <Field
                                label="Public URL"
                                required
                            >
                                <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-gray-50 focus-within:border-gray-900 focus-within:ring-4 focus-within:ring-gray-900/5">
                                    <div className="flex items-center border-r border-gray-200 px-3 text-xs font-medium text-gray-400">
                                        /jobs/
                                    </div>

                                    <input
                                        value={
                                            form.slug
                                        }
                                        onChange={(
                                            event,
                                        ) => {
                                            setSlugManuallyEdited(
                                                true,
                                            );

                                            updateField(
                                                "slug",
                                                normalizeSlug(
                                                    event
                                                        .target
                                                        .value,
                                                ),
                                            );
                                        }}
                                        placeholder="senior-backend-engineer"
                                        className="h-11 min-w-0 flex-1 bg-white px-3.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                                    />

                                    {form.slug &&
                                        !slugManuallyEdited && (
                                            <div className="flex items-center px-3 text-emerald-600">
                                                <Check className="h-4 w-4" />
                                            </div>
                                        )}
                                </div>

                                <p className="mt-1.5 text-[11px] text-gray-400">
                                    Automatically generated from the vacancy title. You can customize it.
                                </p>
                            </Field>
                        </div>
                    </Card>

                    {/* ================================================= */}
                    {/* Work setup */}
                    {/* ================================================= */}

                    <Card>
                        <CardHeader
                            icon={
                                <MapPin className="h-4 w-4" />
                            }
                            title="Work setup"
                            description="Define employment type, location and number of openings."
                        />

                        <div className="space-y-5 p-5 sm:p-6">
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field
                                    label="Employment type"
                                    required
                                >
                                    <Select
                                        value={
                                            form.employmentType
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                "employmentType",
                                                value as CreateJobVacancyInput["employmentType"],
                                            )
                                        }
                                    >
                                        {Object.values(
                                            JOB_EMPLOYMENT_TYPES,
                                        ).map(
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
                                                    {formatEnum(
                                                        type,
                                                    )}
                                                </option>
                                            ),
                                        )}
                                    </Select>
                                </Field>

                                <Field
                                    label="Openings"
                                    required
                                >
                                    <div className="relative">
                                        <Users className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                                        <input
                                            type="number"
                                            min={
                                                1
                                            }
                                            max={
                                                10000
                                            }
                                            value={
                                                form.openings
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                updateField(
                                                    "openings",
                                                    Number(
                                                        event
                                                            .target
                                                            .value ||
                                                            0,
                                                    ),
                                                )
                                            }
                                            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5"
                                        />
                                    </div>
                                </Field>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">
                                            Remote position
                                        </p>

                                        <p className="mt-0.5 text-xs text-gray-500">
                                            Candidates can work remotely.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={
                                            form.isRemote
                                        }
                                        onClick={() =>
                                            handleRemoteChange(
                                                !form.isRemote,
                                            )
                                        }
                                        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                                            form.isRemote
                                                ? "bg-gray-950"
                                                : "bg-gray-300"
                                        }`}
                                    >
                                        <span
                                            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                                                form.isRemote
                                                    ? "left-6"
                                                    : "left-1"
                                            }`}
                                        />
                                    </button>
                                </div>

                                <div className="mt-4">
                                    <Field
                                        label="Location"
                                        required={
                                            !form.isRemote
                                        }
                                    >
                                        <Input
                                            value={
                                                form.location ??
                                                ""
                                            }
                                            onChange={(
                                                value,
                                            ) =>
                                                updateField(
                                                    "location",
                                                    value,
                                                )
                                            }
                                            disabled={
                                                form.isRemote
                                            }
                                            placeholder={
                                                form.isRemote
                                                    ? "Remote position"
                                                    : "Dhaka, Bangladesh"
                                            }
                                        />
                                    </Field>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* ================================================= */}
                    {/* Description */}
                    {/* ================================================= */}

                    <Card>
                        <CardHeader
                            icon={
                                <GripVertical className="h-4 w-4" />
                            }
                            title="Role description"
                            description="Explain the role clearly enough for a candidate to understand the opportunity."
                        />

                        <div className="space-y-6 p-5 sm:p-6">
                            <Field
                                label="About the role"
                                required
                                hint={`${form.description.length}/${DESCRIPTION_MAX_LENGTH}`}
                            >
                                <textarea
                                    value={
                                        form.description
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        updateField(
                                            "description",
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    minLength={
                                        DESCRIPTION_MIN_LENGTH
                                    }
                                    maxLength={
                                        DESCRIPTION_MAX_LENGTH
                                    }
                                    rows={8}
                                    placeholder="Describe the team, mission, responsibilities, impact and what success looks like..."
                                    className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3.5 py-3.5 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5"
                                />

                                <div className="mt-1.5 flex justify-between text-[11px] text-gray-400">
                                    <span>
                                        Minimum{" "}
                                        {
                                            DESCRIPTION_MIN_LENGTH
                                        }{" "}
                                        characters
                                    </span>

                                    <span>
                                        {form.description
                                            .length >
                                        DESCRIPTION_MAX_LENGTH -
                                            500
                                            ? "Near limit"
                                            : "Good"}
                                    </span>
                                </div>
                            </Field>

                            <div className="grid gap-6 md:grid-cols-2">
                                <TagInput
                                    label="Responsibilities"
                                    description="What this person will own and deliver."
                                    value={
                                        form.responsibilities
                                    }
                                    onChange={(
                                        value,
                                    ) =>
                                        updateField(
                                            "responsibilities",
                                            value,
                                        )
                                    }
                                    placeholder="Design scalable APIs"
                                    required
                                />

                                <TagInput
                                    label="Requirements"
                                    description="Experience and capabilities required."
                                    value={
                                        form.requirements
                                    }
                                    onChange={(
                                        value,
                                    ) =>
                                        updateField(
                                            "requirements",
                                            value,
                                        )
                                    }
                                    placeholder="3+ years backend experience"
                                    required
                                />

                                <TagInput
                                    label="Qualifications"
                                    description="Education, certifications or credentials."
                                    value={
                                        form.qualifications ??
                                        []
                                    }
                                    onChange={(
                                        value,
                                    ) =>
                                        updateField(
                                            "qualifications",
                                            value,
                                        )
                                    }
                                    placeholder="Bachelor's degree"
                                />

                                <TagInput
                                    label="Skills"
                                    description="Technical or professional skills."
                                    value={
                                        form.skills ??
                                        []
                                    }
                                    onChange={(
                                        value,
                                    ) =>
                                        updateField(
                                            "skills",
                                            value,
                                        )
                                    }
                                    placeholder="Node.js"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* ================================================= */}
                    {/* Compensation */}
                    {/* ================================================= */}

                    <Card>
                        <CardHeader
                            icon={
                                <CircleDollarSign className="h-4 w-4" />
                            }
                            title="Compensation"
                            description="Control how salary information is stored and displayed."
                        />

                        <div className="space-y-5 p-5 sm:p-6">
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field
                                    label="Salary visibility"
                                    required
                                >
                                    <Select
                                        value={
                                            form.salaryType
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            handleSalaryTypeChange(
                                                value as CreateJobVacancyInput["salaryType"],
                                            )
                                        }
                                    >
                                        {Object.values(
                                            JOB_SALARY_TYPES,
                                        ).map(
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
                                                    {formatEnum(
                                                        type,
                                                    )}
                                                </option>
                                            ),
                                        )}
                                    </Select>
                                </Field>

                                <Field
                                    label="Currency"
                                    required
                                >
                                    <Input
                                        value={
                                            form.salaryCurrency ??
                                            DEFAULT_CURRENCY
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                "salaryCurrency",
                                                value
                                                    .toUpperCase()
                                                    .replace(
                                                        /[^A-Z]/g,
                                                        "",
                                                    )
                                                    .slice(
                                                        0,
                                                        10,
                                                    ),
                                            )
                                        }
                                        placeholder="BDT"
                                    />
                                </Field>
                            </div>

                            {!salaryHidden && (
                                <div className="grid gap-5 rounded-2xl border border-gray-200 bg-gray-50/70 p-4 md:grid-cols-2">
                                    <Field
                                        label={
                                            hasSalaryRange
                                                ? "Minimum salary"
                                                : "Salary amount"
                                        }
                                        required={
                                            hasFixedSalary ||
                                            hasSalaryRange
                                        }
                                    >
                                        <Input
                                            type="number"
                                            min={
                                                0
                                            }
                                            step={
                                                0.01
                                            }
                                            value={
                                                form.salaryMin ??
                                                ""
                                            }
                                            onChange={(
                                                value,
                                            ) =>
                                                updateField(
                                                    "salaryMin",
                                                    value ===
                                                        ""
                                                        ? undefined
                                                        : Number(
                                                              value,
                                                          ),
                                                )
                                            }
                                            placeholder="50000"
                                        />
                                    </Field>

                                    {hasSalaryRange && (
                                        <Field
                                            label="Maximum salary"
                                            required
                                        >
                                            <Input
                                                type="number"
                                                min={
                                                    0
                                                }
                                                step={
                                                    0.01
                                                }
                                                value={
                                                    form.salaryMax ??
                                                    ""
                                                }
                                                onChange={(
                                                    value,
                                                ) =>
                                                    updateField(
                                                        "salaryMax",
                                                        value ===
                                                            ""
                                                            ? undefined
                                                            : Number(
                                                                  value,
                                                              ),
                                                    )
                                                }
                                                placeholder="90000"
                                            />
                                        </Field>
                                    )}
                                </div>
                            )}

                            {salaryHidden && (
                                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                                    <CircleDollarSign className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />

                                    <div>
                                        <p className="text-xs font-bold text-gray-700">
                                            Salary amount hidden
                                        </p>

                                        <p className="mt-0.5 text-[11px] leading-5 text-gray-500">
                                            The public vacancy page will not show a salary amount.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* ================================================= */}
                    {/* Application */}
                    {/* ================================================= */}

                    <Card>
                        <CardHeader
                            icon={
                                <CalendarDays className="h-4 w-4" />
                            }
                            title="Application settings"
                            description="Set an optional closing date for applications."
                        />

                        <div className="p-5 sm:p-6">
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field label="Application deadline">
                                    <Input
                                        type="date"
                                        value={
                                            form.applicationDeadline ??
                                            ""
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            updateField(
                                                "applicationDeadline",
                                                value,
                                            )
                                        }
                                    />

                                    <p className="mt-1.5 text-[11px] text-gray-400">
                                        Leave empty for an open-ended vacancy.
                                    </p>
                                </Field>

                                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
                                        Workflow
                                    </p>

                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-950 text-white">
                                            <Check className="h-3 w-3" />
                                        </span>

                                        <p className="text-xs font-semibold text-gray-700">
                                            Save as Draft
                                        </p>
                                    </div>

                                    <p className="mt-1 text-[11px] leading-5 text-gray-400">
                                        Publishing happens from the vacancy management page.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ================================================= */}
                {/* Preview sidebar */}
                {/* ================================================= */}

                <aside className="min-w-0">
                    <div className="space-y-5 lg:sticky lg:top-5">
                        {/* Preview */}

                        <Card className="overflow-hidden">
                            <div className="border-b border-gray-100 bg-gray-950 px-5 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
                                            Live preview
                                        </p>

                                        <p className="mt-1 text-sm font-bold text-white">
                                            Candidate view
                                        </p>
                                    </div>

                                    <ExternalLink className="h-4 w-4 text-gray-600" />
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                                    <BriefcaseBusiness className="h-5 w-5" />
                                </div>

                                <h3 className="mt-4 text-lg font-bold leading-6 text-gray-950">
                                    {form.title ||
                                        "Your vacancy title"}
                                </h3>

                                <p className="mt-1 text-xs font-medium text-gray-500">
                                    {form.department ||
                                        "Department"}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-1.5">
                                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-600">
                                        {formatEnum(
                                            form.employmentType,
                                        )}
                                    </span>

                                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-600">
                                        {form.isRemote
                                            ? "Remote"
                                            : form.location ||
                                              "Location"}
                                    </span>
                                </div>

                                <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-400">
                                            Openings
                                        </span>

                                        <span className="font-bold text-gray-800">
                                            {form.openings ||
                                                0}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-400">
                                            Salary
                                        </span>

                                        <span className="max-w-[150px] truncate text-right font-bold text-gray-800">
                                            {salaryHidden
                                                ? formatEnum(
                                                      form.salaryType,
                                                  )
                                                : form.salaryMin !==
                                                        undefined &&
                                                    form.salaryMax !==
                                                        undefined
                                                  ? `${form.salaryCurrency || DEFAULT_CURRENCY} ${form.salaryMin.toLocaleString()} – ${form.salaryMax.toLocaleString()}`
                                                  : form.salaryMin !==
                                                        undefined
                                                    ? `${form.salaryCurrency || DEFAULT_CURRENCY} ${form.salaryMin.toLocaleString()}`
                                                    : "Not set"}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-400">
                                            Deadline
                                        </span>

                                        <span className="font-bold text-gray-800">
                                            {form.applicationDeadline ||
                                                "No deadline"}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-5 rounded-xl bg-gray-50 px-3 py-3">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
                                        Public URL
                                    </p>

                                    <p className="mt-1 break-all text-[11px] font-medium text-gray-600">
                                        {publicPath}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Completion */}

                        <Card>
                            <div className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">
                                            Checklist
                                        </p>

                                        <p className="mt-1 text-sm font-bold text-gray-900">
                                            Vacancy quality
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2.5">
                                    {[
                                        [
                                            form.title.trim()
                                                .length >=
                                                3,
                                            "Position title",
                                        ],
                                        [
                                            form.department.trim()
                                                .length >=
                                                2,
                                            "Department",
                                        ],
                                        [
                                            form.description.trim()
                                                .length >=
                                                DESCRIPTION_MIN_LENGTH,
                                            "Description",
                                        ],
                                        [
                                            form.responsibilities
                                                .length >
                                                0,
                                            "Responsibilities",
                                        ],
                                        [
                                            form.requirements
                                                .length >
                                                0,
                                            "Requirements",
                                        ],
                                        [
                                            form.isRemote ||
                                                Boolean(
                                                    form.location?.trim(),
                                                ),
                                            "Work location",
                                        ],
                                        [
                                            form.openings >=
                                                1,
                                            "Openings",
                                        ],
                                    ].map(
                                        (
                                            [
                                                complete,
                                                label,
                                            ],
                                            index,
                                        ) => (
                                            <div
                                                key={`${label}-${index}`}
                                                className="flex items-center gap-2"
                                            >
                                                <span
                                                    className={`flex h-5 w-5 items-center justify-center rounded-full ${
                                                        complete
                                                            ? "bg-emerald-100 text-emerald-600"
                                                            : "bg-gray-100 text-gray-300"
                                                    }`}
                                                >
                                                    <Check className="h-3 w-3" />
                                                </span>

                                                <span
                                                    className={`text-xs font-medium ${
                                                        complete
                                                            ? "text-gray-700"
                                                            : "text-gray-400"
                                                    }`}
                                                >
                                                    {label}
                                                </span>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Tip */}

                        <div className="rounded-2xl border border-gray-200 bg-white p-4">
                            <div className="flex gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                                    <Save className="h-4 w-4 text-gray-600" />
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-gray-800">
                                        Publishing is separate
                                    </p>

                                    <p className="mt-1 text-[11px] leading-5 text-gray-500">
                                        Saving creates or updates the vacancy as a Draft. You can review it before publishing.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* ===================================================== */}
            {/* Bottom action bar */}
            {/* ===================================================== */}

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                    <div className="hidden min-w-0 sm:block">
                        {saved ? (
                            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                                <Check className="h-4 w-4" />
                                Saved successfully
                            </div>
                        ) : isDirty ? (
                            <p className="text-xs font-medium text-gray-500">
                                Unsaved changes
                            </p>
                        ) : (
                            <p className="text-xs text-gray-400">
                                No unsaved changes
                            </p>
                        )}
                    </div>

                    <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={
                                handleCancel
                            }
                            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex h-10 min-w-[150px] items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 text-xs font-bold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                                    {isEditMode
                                        ? "Saving..."
                                        : "Creating..."}
                                </>
                            ) : (
                                <>
                                    <Save className="h-3.5 w-3.5" />

                                    {isEditMode
                                        ? "Save changes"
                                        : "Create draft"}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
