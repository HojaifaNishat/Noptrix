
"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  Activity,
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  activityLogsApi,
  type ActivityActorType,
  type ActivityLog,
  type ActivityLogFilters,
  type ActivityLogPagination,
  type ActivityType,
} from "@/services/api/activity-logs.api";

const ACTOR_TYPES: ActivityActorType[] = [
  "OWNER",
  "ADMIN",
  "EMPLOYEE",
  "SELLER",
  "RIDER",
  "USER",
  "SYSTEM",
];

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

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: { message?: string };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return error instanceof Error
    ? error.message
    : "Unable to load activity logs. Please try again.";
}

function formatDate(value?: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

function shortId(value?: string): string {
  if (!value) return "—";
  if (value.length <= 18) return value;

  return `${value.slice(0, 10)}…${value.slice(-5)}`;
}

function badgeClass(value: string): string {
  switch (value.toUpperCase()) {
    case "OWNER":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "ADMIN":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "SECURITY":
    case "PAYMENT":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    case "AUTHENTICATION":
      return "bg-indigo-50 text-indigo-700 ring-indigo-200";
    case "SYSTEM":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    default:
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
}

function toDateBoundary(
  value: string,
  endOfDay = false,
): string | undefined {
  if (!value) return undefined;

  const date = new Date(
    `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`,
  );

  return Number.isNaN(date.getTime())
    ? undefined
    : date.toISOString();
}

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] =
    useState<ActivityLogPagination | null>(null);

  const [actorType, setActorType] = useState("");
  const [activityType, setActivityType] = useState("");
  const [action, setAction] = useState("");
  const [resource, setResource] = useState("");
  const [actorId, setActorId] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortOrder, setSortOrder] =
    useState<"desc" | "asc">("desc");

  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] =
    useState<ActivityLog | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterError, setFilterError] = useState("");

  const loadLogs = useCallback(
    async (filters: ActivityLogFilters) => {
      setLoading(true);
      setError("");

      try {
        const result = await activityLogsApi.getAll(filters);

        setLogs(result.items);
        setPagination(result.pagination);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadLogs({
      page: 1,
      limit: PAGE_SIZE,
      sortOrder: "desc",
    });
  }, [loadLogs]);

  function buildFilters(nextPage = 1): ActivityLogFilters {
    return {
      page: nextPage,
      limit: PAGE_SIZE,
      sortOrder,
      ...(actorType ? { actorType: actorType as ActivityActorType } : {}),
      ...(activityType
        ? { activityType: activityType as ActivityType }
        : {}),
      ...(action.trim() ? { action: action.trim() } : {}),
      ...(resource.trim() ? { resource: resource.trim() } : {}),
      ...(actorId.trim() ? { actorId: actorId.trim() } : {}),
      ...(resourceId.trim() ? { resourceId: resourceId.trim() } : {}),
      ...(from ? { from: toDateBoundary(from) } : {}),
      ...(to ? { to: toDateBoundary(to, true) } : {}),
    };
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (from && to && from > to) {
      setFilterError("The start date must not be later than the end date.");
      return;
    }

    setFilterError("");
    setPage(1);
    setSelectedLog(null);
    void loadLogs(buildFilters(1));
  }

  function resetFilters() {
    setActorType("");
    setActivityType("");
    setAction("");
    setResource("");
    setActorId("");
    setResourceId("");
    setFrom("");
    setTo("");
    setSortOrder("desc");
    setPage(1);
    setFilterError("");
    setSelectedLog(null);

    void loadLogs({
      page: 1,
      limit: PAGE_SIZE,
      sortOrder: "desc",
    });
  }

  function changePage(nextPage: number) {
    if (loading || nextPage < 1) return;

    setPage(nextPage);
    setSelectedLog(null);
    void loadLogs(buildFilters(nextPage));
  }

  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 0;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
              <ShieldCheck className="h-4 w-4" />
              Administration
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Admin Activity
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review recorded system activities, administrative actions,
              authentication events and resource changes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadLogs(buildFilters(page))}
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-slate-100 disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">
                Activity logs could not be loaded
              </p>
              <p className="mt-1 break-words">{error}</p>
              <p className="mt-2 text-xs">
                Check your login, activity-logs.read permission and API route.
              </p>
            </div>
          </div>
        )}

        {filterError && (
          <div
            role="alert"
            className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
          >
            {filterError}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Matching activities
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums">
                  {loading && !pagination ? "—" : total.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                <Activity className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Records matching the current filters
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Current page
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums">
                  {pagination ? `${pagination.page} / ${totalPages}` : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
                <CalendarDays className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {PAGE_SIZE} records per page at most
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-slate-600" />
              <h2 className="text-lg font-bold">Filters</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Narrow the results using actor, activity, resource and date.
            </p>
          </div>

          <form onSubmit={applyFilters} className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block text-sm font-medium text-slate-700">
                Actor type
                <select
                  value={actorType}
                  onChange={(event) => setActorType(event.target.value)}
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">All actors</option>
                  {ACTOR_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Activity type
                <select
                  value={activityType}
                  onChange={(event) => setActivityType(event.target.value)}
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">All activities</option>
                  {ACTIVITY_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Action
                <input
                  value={action}
                  onChange={(event) => setAction(event.target.value)}
                  maxLength={150}
                  placeholder="e.g. ADMIN_LOGIN"
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Resource
                <input
                  value={resource}
                  onChange={(event) => setResource(event.target.value)}
                  maxLength={150}
                  placeholder="e.g. products"
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Actor ID
                <input
                  value={actorId}
                  onChange={(event) => setActorId(event.target.value)}
                  maxLength={128}
                  placeholder="Actor identifier"
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Resource ID
                <input
                  value={resourceId}
                  onChange={(event) => setResourceId(event.target.value)}
                  maxLength={128}
                  placeholder="Resource identifier"
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                From date
                <input
                  type="date"
                  value={from}
                  max={to || undefined}
                  onChange={(event) => setFrom(event.target.value)}
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                To date
                <input
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(event) => setTo(event.target.value)}
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Sort by date
                <select
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(event.target.value as "asc" | "desc")
                  }
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="desc">Newest first</option>
                  <option value="asc">Oldest first</option>
                </select>
              </label>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                Apply filters
              </button>

              <button
                type="button"
                onClick={resetFilters}
                disabled={loading}
                className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-2 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold">Activity log records</h2>
              <p className="mt-1 text-sm text-slate-500">
                Detailed, read-only audit information.
              </p>
            </div>
            <span className="text-sm text-slate-500">
              {loading ? "Loading…" : `${logs.length} records on this page`}
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-slate-500">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading activity logs…
            </div>
          ) : error && logs.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Fix the error above, then use Refresh to retry.
            </div>
          ) : logs.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <Activity className="h-10 w-10 text-slate-300" />
              <p className="mt-3 font-semibold">No activity records found</p>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Try changing your filters or resetting them to see more results.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Date / time</th>
                      <th className="px-5 py-3 font-semibold">Actor</th>
                      <th className="px-5 py-3 font-semibold">Activity</th>
                      <th className="px-5 py-3 font-semibold">Action</th>
                      <th className="px-5 py-3 font-semibold">Resource</th>
                      <th className="px-5 py-3 font-semibold">Request</th>
                      <th className="px-5 py-3 font-semibold">Details</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log, index) => {
                      const id = log._id || log.id || `${log.createdAt}-${index}`;

                      return (
                        <tr key={id} className="align-top hover:bg-slate-50/70">
                          <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-600">
                            <div className="flex items-start gap-2">
                              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                              {formatDate(log.createdAt)}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ring-1 ${badgeClass(log.actorType)}`}
                            >
                              {log.actorType}
                            </span>
                            <p className="mt-2 max-w-36 break-all text-xs text-slate-500">
                              {log.actorRole || "Role not recorded"}
                            </p>
                            <p className="mt-1 max-w-36 break-all font-mono text-[11px] text-slate-400">
                              {shortId(log.actorId)}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ring-1 ${badgeClass(log.activityType)}`}
                            >
                              {log.activityType}
                            </span>
                          </td>

                          <td className="max-w-52 px-5 py-4">
                            <p className="break-words font-semibold text-slate-800">
                              {log.action}
                            </p>
                            <p className="mt-1 max-w-64 break-words text-xs leading-5 text-slate-500">
                              {log.description}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="break-words font-medium text-slate-700">
                              {log.resource || "—"}
                            </p>
                            <p className="mt-1 break-all font-mono text-[11px] text-slate-400">
                              {shortId(log.resourceId)}
                            </p>
                          </td>

                          <td className="max-w-48 px-5 py-4">
                            {log.method && (
                              <span className="rounded bg-slate-100 px-2 py-1 font-mono text-[10px] font-bold text-slate-700">
                                {log.method}
                              </span>
                            )}
                            <p className="mt-2 break-all font-mono text-xs text-slate-500">
                              {log.path || "—"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => setSelectedLog(log)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              View details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center">
                <p className="text-xs text-slate-500">
                  {total === 0
                    ? "No records"
                    : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                        page * PAGE_SIZE,
                        total,
                      )} of ${total.toLocaleString()}`}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changePage(page - 1)}
                    disabled={loading || !pagination?.hasPreviousPage}
                    className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <span className="px-2 text-xs font-medium text-slate-500">
                    Page {pagination?.page ?? page} of {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => changePage(page + 1)}
                    disabled={loading || !pagination?.hasNextPage}
                    className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <footer className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          <UserRound className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="leading-6">
            This page is read-only. Access is controlled by backend
            authentication and the activity-logs.read permission for admins.
            Sensitive credentials should never be included in log metadata.
          </p>
        </footer>
      </div>

      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedLog(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="activity-details-title"
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <h2
                  id="activity-details-title"
                  className="text-lg font-bold"
                >
                  Activity details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedLog.action}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
                  {selectedLog.description}
                </p>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Actor type", selectedLog.actorType],
                  ["Actor role", selectedLog.actorRole],
                  ["Actor ID", selectedLog.actorId],
                  ["Activity type", selectedLog.activityType],
                  ["Action", selectedLog.action],
                  ["Resource", selectedLog.resource],
                  ["Resource ID", selectedLog.resourceId],
                  ["Request ID", selectedLog.requestId],
                  ["HTTP method", selectedLog.method],
                  ["Request path", selectedLog.path],
                  ["IP address", selectedLog.ipAddress],
                  ["Created at", formatDate(selectedLog.createdAt)],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-xs font-medium text-slate-500">
                      {label}
                    </dt>
                    <dd className="mt-1 break-all text-sm text-slate-800">
                      {value || "—"}
                    </dd>
                  </div>
                ))}
              </dl>

              {selectedLog.metadata &&
                Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Metadata
                    </p>
                    <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
