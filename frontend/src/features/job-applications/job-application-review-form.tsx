"use client";

import {
    FormEvent,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    AlertCircle,
    CalendarClock,
    Check,
    ChevronRight,
    CircleDot,
    FileCheck2,
    MessageSquareText,
    ShieldCheck,
    UserRoundCheck,
    XCircle,
} from "lucide-react";

import {
    type JobApplication,
    type JobApplicationStatus,
    type UpdateJobApplicationInput,
} from "./job-application.types";

interface JobApplicationReviewFormProps {
    application: JobApplication;
    onSave: (
        applicationId: string,
        input: UpdateJobApplicationInput,
    ) => Promise<void>;
    saving: boolean;
}

const STATUS_TRANSITIONS: Record<
    JobApplicationStatus,
    readonly JobApplicationStatus[]
> = {
    SUBMITTED: [
        "UNDER_REVIEW",
        "REJECTED",
        "WITHDRAWN",
    ],
    UNDER_REVIEW: [
        "SHORTLISTED",
        "REJECTED",
        "WITHDRAWN",
    ],
    SHORTLISTED: [
        "INTERVIEW",
        "REJECTED",
        "WITHDRAWN",
    ],
    INTERVIEW: [
        "SELECTED",
        "REJECTED",
        "WITHDRAWN",
    ],
    SELECTED: [],
    REJECTED: [],
    WITHDRAWN: [],
};

const STATUS_META: Record<
    JobApplicationStatus,
    {
        label: string;
        description: string;
        className: string;
        iconClassName: string;
    }
> = {
    SUBMITTED: {
        label: "Submitted",
        description: "Application received and awaiting review.",
        className:
            "border-blue-200 bg-blue-50 text-blue-700",
        iconClassName: "text-blue-600",
    },
    UNDER_REVIEW: {
        label: "Under review",
        description: "Candidate is currently being evaluated.",
        className:
            "border-amber-200 bg-amber-50 text-amber-700",
        iconClassName: "text-amber-600",
    },
    SHORTLISTED: {
        label: "Shortlisted",
        description: "Candidate has passed the initial review.",
        className:
            "border-violet-200 bg-violet-50 text-violet-700",
        iconClassName: "text-violet-600",
    },
    INTERVIEW: {
        label: "Interview",
        description: "Candidate is scheduled for an interview.",
        className:
            "border-indigo-200 bg-indigo-50 text-indigo-700",
        iconClassName: "text-indigo-600",
    },
    SELECTED: {
        label: "Selected",
        description: "Candidate has been selected for the role.",
        className:
            "border-emerald-200 bg-emerald-50 text-emerald-700",
        iconClassName: "text-emerald-600",
    },
    REJECTED: {
        label: "Rejected",
        description: "Application has been declined.",
        className:
            "border-red-200 bg-red-50 text-red-700",
        iconClassName: "text-red-600",
    },
    WITHDRAWN: {
        label: "Withdrawn",
        description: "Application was withdrawn by the candidate.",
        className:
            "border-gray-200 bg-gray-100 text-gray-600",
        iconClassName: "text-gray-500",
    },
};

const formatDate = (value?: string) => {
    if (!value) {
        return "";
    }

    return new Date(value).toLocaleString();
};

export default function JobApplicationReviewForm({
    application,
    onSave,
    saving,
}: JobApplicationReviewFormProps) {
    const [status, setStatus] =
        useState<JobApplicationStatus>(
            application.status,
        );

    const [notes, setNotes] =
        useState(application.notes ?? "");

    const [rejectionReason, setRejectionReason] =
        useState(
            application.rejectionReason ?? "",
        );

    const [interviewAt, setInterviewAt] =
        useState(
            application.interviewAt
                ? new Date(application.interviewAt)
                      .toISOString()
                      .slice(0, 16)
                : "",
        );

    const [error, setError] = useState("");

    useEffect(() => {
        setStatus(application.status);
        setNotes(application.notes ?? "");
        setRejectionReason(
            application.rejectionReason ?? "",
        );
        setInterviewAt(
            application.interviewAt
                ? new Date(application.interviewAt)
                      .toISOString()
                      .slice(0, 16)
                : "",
        );
        setError("");
    }, [
        application._id,
        application.status,
        application.notes,
        application.rejectionReason,
        application.interviewAt,
    ]);

    const nextStatuses = useMemo(
        () =>
            STATUS_TRANSITIONS[
                application.status
            ],
        [application.status],
    );

    const isTerminal =
        STATUS_TRANSITIONS[
            application.status
        ].length === 0;

    const isInterview =
        status === "INTERVIEW";

    const isRejected =
        status === "REJECTED";

    const hasStatusChanged =
        status !== application.status;

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        setError("");

        if (isTerminal && !hasStatusChanged) {
            setError(
                "This application is already in a final status.",
            );
            return;
        }

        if (
            isInterview &&
            !interviewAt
        ) {
            setError(
                "Please schedule an interview date and time.",
            );
            return;
        }

        if (
            isInterview &&
            interviewAt &&
            new Date(interviewAt).getTime() <=
                Date.now()
        ) {
            setError(
                "Interview date and time must be in the future.",
            );
            return;
        }

        if (
            isRejected &&
            !rejectionReason.trim()
        ) {
            setError(
                "Please provide a rejection reason.",
            );
            return;
        }

        const input: UpdateJobApplicationInput = {
            status,
            notes:
                notes.trim() || undefined,
            rejectionReason:
                isRejected
                    ? rejectionReason.trim() ||
                      undefined
                    : undefined,
            interviewAt:
                isInterview && interviewAt
                    ? new Date(
                          interviewAt,
                      ).toISOString()
                    : undefined,
        };

        try {
            await onSave(
                application._id,
                input,
            );
        } catch (saveError) {
            setError(
                saveError instanceof Error
                    ? saveError.message
                    : "Unable to save candidate review.",
            );
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
            {/* Header */}
            <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white">
                            <FileCheck2
                                size={18}
                            />
                        </div>

                        <div>
                            <p className="text-sm font-bold text-gray-900">
                                Candidate review
                            </p>

                            <p className="mt-1 text-xs leading-5 text-gray-500">
                                Evaluate the application and
                                move the candidate through the
                                recruitment pipeline.
                            </p>
                        </div>
                    </div>

                    <div
                        className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${STATUS_META[application.status].className}`}
                    >
                        <CircleDot
                            size={13}
                            className={
                                STATUS_META[
                                    application.status
                                ].iconClassName
                            }
                        />
                        {
                            STATUS_META[
                                application.status
                            ].label
                        }
                    </div>
                </div>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
                {/* Pipeline */}
                <section>
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
                                Decision
                            </p>

                            <h3 className="mt-1 text-sm font-bold text-gray-900">
                                Candidate status
                            </h3>
                        </div>

                        {hasStatusChanged && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-3 py-1.5 text-[11px] font-bold text-white">
                                <ChevronRight
                                    size={12}
                                />
                                Unsaved change
                            </span>
                        )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            application.status,
                            ...nextStatuses,
                        ].map(
                            (item) => {
                                const selected =
                                    status ===
                                    item;

                                return (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() =>
                                            setStatus(
                                                item,
                                            )
                                        }
                                        disabled={
                                            saving
                                        }
                                        className={`group rounded-xl border p-3 text-left transition ${
                                            selected
                                                ? "border-gray-900 bg-gray-900 text-white shadow-sm"
                                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-bold">
                                                {
                                                    STATUS_META[
                                                        item
                                                    ].label
                                                }
                                            </span>

                                            {selected && (
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-gray-900">
                                                    <Check
                                                        size={
                                                            12
                                                        }
                                                    />
                                                </span>
                                            )}
                                        </div>

                                        <p
                                            className={`mt-1 text-[11px] leading-4 ${
                                                selected
                                                    ? "text-gray-300"
                                                    : "text-gray-400"
                                            }`}
                                        >
                                            {
                                                STATUS_META[
                                                    item
                                                ].description
                                            }
                                        </p>
                                    </button>
                                );
                            },
                        )}
                    </div>

                    {isTerminal &&
                        !hasStatusChanged && (
                            <div className="mt-3 flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                                <ShieldCheck
                                    size={16}
                                    className="mt-0.5 shrink-0 text-gray-500"
                                />

                                <p className="text-xs leading-5 text-gray-500">
                                    This application has reached
                                    a final status and cannot
                                    move further through the
                                    workflow.
                                </p>
                            </div>
                        )}
                </section>

                {/* Interview */}
                {isInterview && (
                    <section className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                                <CalendarClock
                                    size={17}
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-bold text-gray-900">
                                    Schedule interview
                                </h3>

                                <p className="mt-1 text-xs leading-5 text-gray-500">
                                    Choose a future date and time
                                    for the candidate interview.
                                </p>

                                <div className="mt-4">
                                    <label
                                        htmlFor={`interview-at-${application._id}`}
                                        className="mb-1.5 block text-xs font-bold text-gray-700"
                                    >
                                        Interview date & time
                                    </label>

                                    <input
                                        id={`interview-at-${application._id}`}
                                        type="datetime-local"
                                        value={
                                            interviewAt
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setInterviewAt(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        disabled={
                                            saving
                                        }
                                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition hover:border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Rejection */}
                {isRejected && (
                    <section className="rounded-2xl border border-red-100 bg-red-50/60 p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
                                <XCircle
                                    size={17}
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-bold text-gray-900">
                                    Rejection reason
                                </h3>

                                <p className="mt-1 text-xs leading-5 text-gray-500">
                                    Record why this candidate is
                                    not moving forward.
                                </p>

                                <textarea
                                    id={`rejection-reason-${application._id}`}
                                    value={
                                        rejectionReason
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setRejectionReason(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    disabled={
                                        saving
                                    }
                                    maxLength={
                                        2000
                                    }
                                    rows={4}
                                    placeholder="Provide a clear internal reason for the decision..."
                                    className="mt-4 w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm leading-6 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-red-400 focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                                />

                                <div className="mt-1 flex justify-end text-[11px] text-gray-400">
                                    {
                                        rejectionReason.length
                                    }
                                    /2000
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Notes */}
                <section>
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                            <MessageSquareText
                                size={17}
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-bold text-gray-900">
                                Internal notes
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-gray-500">
                                Keep private feedback, interview
                                observations and follow-up notes.
                            </p>

                            <textarea
                                id={`review-notes-${application._id}`}
                                value={notes}
                                onChange={(
                                    event,
                                ) =>
                                    setNotes(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                disabled={
                                    saving
                                }
                                maxLength={
                                    5000
                                }
                                rows={5}
                                placeholder="Add internal reviewer notes..."
                                className="mt-4 w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm leading-6 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 disabled:cursor-not-allowed disabled:opacity-60"
                            />

                            <div className="mt-1 flex justify-between text-[11px] text-gray-400">
                                <span>
                                    Visible to authorized
                                    reviewers only.
                                </span>

                                <span>
                                    {notes.length}
                                    /5000
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Error */}
                {error && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                    >
                        <AlertCircle
                            size={17}
                            className="mt-0.5 shrink-0 text-red-600"
                        />

                        <p className="text-sm leading-5 text-red-700">
                            {error}
                        </p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <UserRoundCheck
                        size={14}
                    />

                    {application.reviewedAt ? (
                        <span>
                            Last reviewed{" "}
                            {formatDate(
                                application.reviewedAt,
                            )}
                        </span>
                    ) : (
                        <span>
                            This application has not been
                            reviewed yet.
                        </span>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-900/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Check size={16} />

                    {saving
                        ? "Saving review..."
                        : "Save review"}
                </button>
            </div>
        </form>
    );
}
