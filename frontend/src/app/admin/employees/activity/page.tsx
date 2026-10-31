"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Activity,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  activityLogsApi,
  type ActivityLog,
  type ActivityLogPagination,
  type ActivityType,
} from "@/services/api/activity-logs.api";

const ACTIVITY_TYPES: ActivityType[] = [
  "AUTHENTICATION",
  "PROFILE",
  "PRODUCT",
  "ORDER",
  "PAYMENT",
  "INVENTORY",
  "SUPPORT",
  "COMMUNICATION",
  "SETTINGS",
  "SECURITY",
  "OTHER",
];

const PAGE_SIZE = 20;

interface ActivityFilters {
  actorId: string;
  activityType: ActivityType | "";
  from: string;
  to: string;
}

const EMPTY_FILTERS: ActivityFilters = {
  actorId: "",
  activityType: "",
  from: "",
  to: "",
};

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;

    if (response?.data?.message) return response.data.message;
  }

  return error instanceof Error
    ? error.message
    : "Unable to load employee activity. Please try again.";
}

function toDateBoundary(value: string, endOfDay = false): string | undefined {
  if (!value) return undefined;

  const date = new Date(
    `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`,
  );

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function shortId(value?: string): string {
  if (!value) return "—";
  return value.length > 18 ? `${value.slice(0, 10)}…${value.slice(-5)}` : value;
}

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function EmployeeActivityPage() {
  const [items, setItems] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<ActivityLogPagination | null>(
    null,
  );
  const [filters, setFilters] = useState<ActivityFilters>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] =
    useState<ActivityFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterError, setFilterError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadActivity = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await activityLogsApi.getAll({
        page,
        limit: PAGE_SIZE,
        actorType: "EMPLOYEE",
        sortOrder: "desc",
        ...(filters.actorId ? { actorId: filters.actorId } : {}),
        ...(filters.activityType ? { activityType: filters.activityType } : {}),
        ...(filters.from ? { from: toDateBoundary(filters.from) } : {}),
        ...(filters.to ? { to: toDateBoundary(filters.to, true) } : {}),
      });

      setItems(result.items);
      setPagination(result.pagination);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    void Promise.resolve().then(loadActivity);
  }, [loadActivity, refreshKey]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      draftFilters.from &&
      draftFilters.to &&
      draftFilters.from > draftFilters.to
    ) {
      setFilterError("The start date must not be later than the end date.");
      return;
    }

    setFilterError("");
    setPage(1);
    setFilters({
      ...draftFilters,
      actorId: draftFilters.actorId.trim(),
    });
  }

  function resetFilters() {
    setDraftFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setFilterError("");
    setPage(1);
  }

  const totalPages = Math.max(1, pagination?.totalPages ?? 0);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
              <Activity className="h-4 w-4" />
              HR &amp; Recruitment
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Employee Activity
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review recorded actions performed by employees.
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
          onSubmit={applyFilters}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-sm font-medium text-slate-700">
              Employee ID
              <input
                value={draftFilters.actorId}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    actorId: event.target.value,
                  }))
                }
                placeholder="Filter by employee ID"
                className={inputClass}
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Activity type
              <select
                value={draftFilters.activityType}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    activityType: event.target.value as ActivityType | "",
                  }))
                }
                className={inputClass}
              >
                <option value="">All activity types</option>
                {ACTIVITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              From
              <input
                type="date"
                value={draftFilters.from}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    from: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              To
              <input
                type="date"
                value={draftFilters.to}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    to: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </label>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                <Search className="h-4 w-4" />
                Apply
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
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

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-semibold text-slate-900">Activity log</h2>
              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? "Loading employee activity…"
                  : `${pagination?.total ?? 0} matching record${pagination?.total === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading employee activity…
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="mx-auto h-8 w-8 text-slate-300" />
              <h3 className="mt-3 font-semibold text-slate-900">
                No employee activity found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Try changing the filters or check back after employees have
                performed recorded actions.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Activity</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Employee ID</th>
                    <th className="px-5 py-3">Resource</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, index) => (
                    <tr
                      key={item._id ?? item.id ?? `${item.createdAt}-${index}`}
                      className="align-top hover:bg-slate-50/70"
                    >
                      <td className="max-w-lg px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {item.action}
                        </p>
                        <p className="mt-1 whitespace-normal text-slate-500">
                          {item.description}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {item.activityType.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">
                        {shortId(item.actorId)}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <p>{item.resource ?? "—"}</p>
                        {item.resourceId && (
                          <p className="mt-1 font-mono text-xs text-slate-400">
                            {shortId(item.resourceId)}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(item.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <footer className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:px-5">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={page >= totalPages || loading}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
