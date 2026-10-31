"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileBarChart,
  RefreshCw,
  Users,
} from "lucide-react";

import {
  JOB_APPLICATION_STATUSES,
  type JobApplicationStatus,
  type RecruitmentReportsSummary,
} from "@/features/job-applications/job-application.types";
import { jobApplicationsApi } from "@/services/api/job-applications.api";

const STATUS_LABELS: Record<JobApplicationStatus, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  SELECTED: "Selected",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

const STATUS_COLORS: Record<JobApplicationStatus, string> = {
  SUBMITTED: "bg-sky-500",
  UNDER_REVIEW: "bg-blue-500",
  SHORTLISTED: "bg-violet-500",
  INTERVIEW: "bg-amber-500",
  SELECTED: "bg-emerald-500",
  REJECTED: "bg-rose-500",
  WITHDRAWN: "bg-slate-400",
};

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;

    if (response?.data?.message) return response.data.message;
  }

  return error instanceof Error
    ? error.message
    : "Unable to load recruitment reports. Please try again.";
}

function toDateBoundary(value: string, endOfDay = false): string | undefined {
  if (!value) return undefined;

  const date = new Date(
    `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`,
  );

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function formatMonth(value: string): string {
  const date = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatVacancyStatus(value?: string): string {
  if (!value) return "Deleted vacancy";
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export default function RecruitmentReportsPage() {
  const [report, setReport] = useState<RecruitmentReportsSummary | null>(null);
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filterError, setFilterError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await jobApplicationsApi.getRecruitmentReports({
        ...(from ? { from: toDateBoundary(from) } : {}),
        ...(to ? { to: toDateBoundary(to, true) } : {}),
      });
      setReport(result);
    } catch (requestError) {
      setReport(null);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void Promise.resolve().then(loadReport);
  }, [loadReport, refreshKey]);

  function applyDateRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (fromInput && toInput && fromInput > toInput) {
      setFilterError("The start date must not be later than the end date.");
      return;
    }

    setFilterError("");
    setFrom(fromInput);
    setTo(toInput);
  }

  function clearDateRange() {
    setFromInput("");
    setToInput("");
    setFrom("");
    setTo("");
    setFilterError("");
  }

  const statusCounts = report?.statusCounts;
  const totalApplications = report?.totalApplications ?? 0;
  const activeApplications =
    (statusCounts?.UNDER_REVIEW ?? 0) +
    (statusCounts?.SHORTLISTED ?? 0) +
    (statusCounts?.INTERVIEW ?? 0);
  const selectedApplications = statusCounts?.SELECTED ?? 0;
  const latestMonths = report?.monthlyApplications.slice(-12) ?? [];
  const maximumMonthlyCount = Math.max(
    1,
    ...latestMonths.map((month) => month.count),
  );

  const metrics = [
    {
      label: "Total applications",
      value: totalApplications,
      icon: Users,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "In progress",
      value: activeApplications,
      icon: Clock3,
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Selected",
      value: selectedApplications,
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Vacancies with applicants",
      value: report?.vacancies.length ?? 0,
      icon: BriefcaseBusiness,
      color: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
              <FileBarChart className="h-4 w-4" />
              HR &amp; Recruitment
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Recruitment Reports
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Application trends, hiring funnel, and vacancy performance.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </header>

        <form
          onSubmit={applyDateRange}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <CalendarDays className="h-4 w-4 text-slate-500" />
            Application date range
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
            <label className="text-sm font-medium text-slate-700">
              From
              <input
                type="date"
                value={fromInput}
                onChange={(event) => setFromInput(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              To
              <input
                type="date"
                value={toInput}
                onChange={(event) => setToInput(event.target.value)}
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              className="h-11 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Apply range
            </button>
            <button
              type="button"
              onClick={clearDateRange}
              className="h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              All time
            </button>
          </div>
          {filterError && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {filterError}
            </p>
          )}
        </form>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Loading recruitment report…
          </div>
        ) : report ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <article
                    key={metric.label}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          {metric.label}
                        </p>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                          {metric.value.toLocaleString()}
                        </p>
                      </div>
                      <span className={`rounded-xl p-3 ${metric.color}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Application funnel
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Current status distribution for the selected date range.
                  </p>
                </div>
                <div className="mt-6 space-y-4">
                  {JOB_APPLICATION_STATUSES.map((status) => {
                    const count = statusCounts?.[status] ?? 0;
                    const percentage =
                      totalApplications > 0
                        ? (count / totalApplications) * 100
                        : 0;

                    return (
                      <div key={status}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-slate-700">
                            {STATUS_LABELS[status]}
                          </span>
                          <span className="tabular-nums text-slate-500">
                            {count.toLocaleString()} · {percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${STATUS_COLORS[status]}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Monthly application trend
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Applications received per month, latest 12 months.
                  </p>
                </div>
                {latestMonths.length === 0 ? (
                  <p className="mt-8 rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No application activity in this date range.
                  </p>
                ) : (
                  <div className="mt-7 flex h-56 items-end gap-2 overflow-x-auto border-b border-slate-100 pb-2 sm:gap-3">
                    {latestMonths.map((month) => (
                      <div
                        key={month.month}
                        className="flex h-full min-w-10 flex-1 flex-col items-center justify-end gap-2"
                        title={`${formatMonth(month.month)}: ${month.count} applications`}
                      >
                        <span className="text-xs font-medium tabular-nums text-slate-600">
                          {month.count}
                        </span>
                        <div
                          className="w-full max-w-10 rounded-t-md bg-blue-500 transition-all"
                          style={{
                            height: `${Math.max(4, (month.count / maximumMonthlyCount) * 100)}%`,
                          }}
                        />
                        <span className="whitespace-nowrap text-[10px] text-slate-500">
                          {formatMonth(month.month)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-semibold text-slate-900">
                  Vacancy performance
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Application totals and pipeline status per vacancy.
                </p>
              </div>
              {report.vacancies.length === 0 ? (
                <div className="p-12 text-center">
                  <BriefcaseBusiness className="mx-auto h-8 w-8 text-slate-300" />
                  <h3 className="mt-3 font-semibold text-slate-900">
                    No applications in this date range
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Try widening the date range to include more applications.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Vacancy</th>
                        <th className="px-5 py-3">Department</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Total</th>
                        <th className="px-5 py-3">In review</th>
                        <th className="px-5 py-3">Interview</th>
                        <th className="px-5 py-3">Selected</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.vacancies.map((vacancy) => (
                        <tr
                          key={vacancy.vacancyId}
                          className="hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4 font-semibold text-slate-900">
                            {vacancy.title}
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {vacancy.department}
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {formatVacancyStatus(vacancy.status)}
                          </td>
                          <td className="px-5 py-4 font-semibold tabular-nums text-slate-900">
                            {vacancy.totalApplications.toLocaleString()}
                          </td>
                          <td className="px-5 py-4 tabular-nums text-slate-600">
                            {(
                              vacancy.statusCounts.UNDER_REVIEW +
                              vacancy.statusCounts.SHORTLISTED
                            ).toLocaleString()}
                          </td>
                          <td className="px-5 py-4 tabular-nums text-slate-600">
                            {vacancy.statusCounts.INTERVIEW.toLocaleString()}
                          </td>
                          <td className="px-5 py-4 tabular-nums text-emerald-700">
                            {vacancy.statusCounts.SELECTED.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
