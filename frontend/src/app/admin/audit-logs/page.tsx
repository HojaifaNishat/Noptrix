"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  FileSearch,
  Filter,
  History,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";

import {
  AUDIT_ACTIONS,
  AUDIT_ACTOR_TYPES,
  auditLogsApi,
  type AuditAction,
  type AuditActorType,
  type AuditLog,
  type AuditLogFilters,
  type AuditLogPagination,
} from "@/services/api/audit-logs.api";

const PAGE_SIZE = 20;

interface FilterForm {
  actorId: string;
  actorType: string;
  action: string;
  resource: string;
  resourceId: string;
  requestId: string;
  success: string;
  from: string;
  to: string;
  sortOrder: "asc" | "desc";
}

const INITIAL_FILTERS: FilterForm = {
  actorId: "",
  actorType: "",
  action: "",
  resource: "",
  resourceId: "",
  requestId: "",
  success: "",
  from: "",
  to: "",
  sortOrder: "desc",
};

function dateTime(value?: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

function dateOnly(value?: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

function shortId(value?: string, length = 16): string {
  if (!value) return "—";
  return value.length > length ? `${value.slice(0, length)}…` : value;
}

function toIsoStart(value: string): string | undefined {
  if (!value) return undefined;

  const date = new Date(`${value}T00:00:00.000`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function toIsoEnd(value: string): string | undefined {
  if (!value) return undefined;

  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function actorClass(actor: AuditActorType): string {
  switch (actor) {
    case "OWNER":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "ADMIN":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "EMPLOYEE":
      return "bg-indigo-50 text-indigo-700 ring-indigo-200";
    case "SYSTEM":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    case "SELLER":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "RIDER":
      return "bg-orange-50 text-orange-700 ring-orange-200";
    default:
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
}

function actionClass(action: AuditAction): string {
  switch (action) {
    case "DELETE":
    case "LOGIN_FAILED":
    case "SECURITY_EVENT":
    case "PASSWORD_RESET":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "CREATE":
    case "APPROVED":
    case "LOGIN":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "UPDATE":
    case "PERMISSION_CHANGED":
    case "STATUS_CHANGED":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred while loading audit logs.";
}

function jsonValue(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? "null";
  } catch {
    return String(value);
  }
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd
        className={`mt-1.5 break-words text-sm text-slate-800 ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value || "—"}
      </dd>
    </div>
  );
}

export default function AuditLogsPage() {
  const [form, setForm] = useState<FilterForm>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterForm>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] =
    useState<AuditLogPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const total = pagination?.total ?? 0;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);

  const requestFilters = useMemo<AuditLogFilters>(() => {
    const filters: AuditLogFilters = {
      page,
      limit: PAGE_SIZE,
      sortOrder: appliedFilters.sortOrder,
    };

    const trimmed = {
      actorId: appliedFilters.actorId.trim(),
      resource: appliedFilters.resource.trim(),
      resourceId: appliedFilters.resourceId.trim(),
      requestId: appliedFilters.requestId.trim(),
    };

    if (trimmed.actorId) filters.actorId = trimmed.actorId;
    if (appliedFilters.actorType) {
      filters.actorType = appliedFilters.actorType as AuditActorType;
    }
    if (appliedFilters.action) {
      filters.action = appliedFilters.action as AuditAction;
    }
    if (trimmed.resource) filters.resource = trimmed.resource;
    if (trimmed.resourceId) filters.resourceId = trimmed.resourceId;
    if (trimmed.requestId) filters.requestId = trimmed.requestId;

    if (appliedFilters.success === "true") filters.success = true;
    if (appliedFilters.success === "false") filters.success = false;

    const from = toIsoStart(appliedFilters.from);
    const to = toIsoEnd(appliedFilters.to);

    if (from) filters.from = from;
    if (to) filters.to = to;

    return filters;
  }, [page, appliedFilters]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await auditLogsApi.getAll(requestFilters);
      setLogs(result.items);
      setPagination(result.pagination);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      setLogs([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [requestFilters]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  function updateFilter<K extends keyof FilterForm>(
    key: K,
    value: FilterForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.from && form.to && form.from > form.to) {
      setError("The start date must be on or before the end date.");
      return;
    }

    setError("");
    setPage(1);
    setAppliedFilters({ ...form });
  }

  function resetFilters() {
    setForm(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setPage(1);
    setError("");
  }

  async function openDetails(log: AuditLog) {
    setSelectedLog(log);
    setDetailError("");
    setCopyMessage("");
    setDetailLoading(true);

    try {
      const detail = await auditLogsApi.getById(log._id);
      setSelectedLog(detail);
    } catch (detailLoadError) {
      // Keep the list record visible if the detail request fails.
      setDetailError(getErrorMessage(detailLoadError));
    } finally {
      setDetailLoading(false);
    }
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(`${label} copied.`);
    } catch {
      setCopyMessage("Clipboard access was unavailable.");
    }
  }

  const activeFilterCount = [
    appliedFilters.actorId,
    appliedFilters.actorType,
    appliedFilters.action,
    appliedFilters.resource,
    appliedFilters.resourceId,
    appliedFilters.requestId,
    appliedFilters.success,
    appliedFilters.from,
    appliedFilters.to,
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-900 p-3 text-white shadow-sm">
              <History className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Audit Logs
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Read-only
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Review recorded administrative and system actions, request
                information, and operation outcomes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadLogs()}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:self-center"
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
            className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Unable to load audit logs</p>
              <p className="mt-1 break-words">{error}</p>
              <button
                type="button"
                onClick={() => void loadLogs()}
                className="mt-2 font-semibold underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-500">
                Matching records
              </p>
              <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                <FileSearch className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-slate-950">
              {loading && !pagination ? "—" : total.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Results matching the applied filters
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-500">Current page</p>
              <span className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
                <CalendarDays className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-slate-950">
              {pagination ? `${pagination.page} / ${totalPages}` : "—"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Up to {PAGE_SIZE} records per page
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-500">Page results</p>
              <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                <Activity className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-slate-950">
              {loading && !pagination ? "—" : logs.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Records currently displayed
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-500">
                Applied filters
              </p>
              <span className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
                <Filter className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-slate-950">
              {activeFilterCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {activeFilterCount === 0
                ? "Showing all available records"
                : "Additional criteria are active"}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-slate-600" />
              <h2 className="text-lg font-bold text-slate-900">Filters</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Filters are applied to the server query. Date ranges use your
              device&apos;s local timezone.
            </p>
          </div>

          <form onSubmit={applyFilters} className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <Field label="Actor type">
                <select
                  value={form.actorType}
                  onChange={(event) =>
                    updateFilter("actorType", event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">All actor types</option>
                  {AUDIT_ACTOR_TYPES.map((actor) => (
                    <option key={actor} value={actor}>
                      {actor}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Action">
                <select
                  value={form.action}
                  onChange={(event) =>
                    updateFilter("action", event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">All actions</option>
                  {AUDIT_ACTIONS.map((action) => (
                    <option key={action} value={action}>
                      {action.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Operation status">
                <select
                  value={form.success}
                  onChange={(event) =>
                    updateFilter("success", event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">All outcomes</option>
                  <option value="true">Successful</option>
                  <option value="false">Failed</option>
                </select>
              </Field>

              <Field label="Sort by date">
                <select
                  value={form.sortOrder}
                  onChange={(event) =>
                    updateFilter(
                      "sortOrder",
                      event.target.value as "asc" | "desc",
                    )
                  }
                  className={inputClass}
                >
                  <option value="desc">Newest first</option>
                  <option value="asc">Oldest first</option>
                </select>
              </Field>

              <Field label="Actor ID">
                <input
                  value={form.actorId}
                  onChange={(event) =>
                    updateFilter("actorId", event.target.value)
                  }
                  maxLength={128}
                  placeholder="Actor identifier"
                  className={inputClass}
                />
              </Field>

              <Field label="Resource">
                <input
                  value={form.resource}
                  onChange={(event) =>
                    updateFilter("resource", event.target.value)
                  }
                  maxLength={150}
                  placeholder="e.g. products"
                  className={inputClass}
                />
              </Field>

              <Field label="Resource ID">
                <input
                  value={form.resourceId}
                  onChange={(event) =>
                    updateFilter("resourceId", event.target.value)
                  }
                  maxLength={128}
                  placeholder="Resource identifier"
                  className={inputClass}
                />
              </Field>

              <Field label="Request ID">
                <input
                  value={form.requestId}
                  onChange={(event) =>
                    updateFilter("requestId", event.target.value)
                  }
                  maxLength={128}
                  placeholder="Trace a request"
                  className={inputClass}
                />
              </Field>

              <Field label="From date">
                <input
                  type="date"
                  value={form.from}
                  max={form.to || undefined}
                  onChange={(event) => updateFilter("from", event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="To date">
                <input
                  type="date"
                  value={form.to}
                  min={form.from || undefined}
                  onChange={(event) => updateFilter("to", event.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                Apply filters
              </button>
              <button
                type="button"
                onClick={resetFilters}
                disabled={loading}
                className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset filters
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-2 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Audit records
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Immutable event history returned by the backend.
              </p>
            </div>
            <span className="text-sm text-slate-500" aria-live="polite">
              {loading ? "Loading records…" : `${logs.length} records on this page`}
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading audit logs…
            </div>
          ) : error ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
              <AlertCircle className="h-10 w-10 text-rose-400" />
              <p className="mt-3 font-semibold text-slate-800">
                Records could not be displayed
              </p>
              <p className="mt-1 max-w-lg text-sm text-slate-500">
                Check your access and API connection, then retry.
              </p>
              <button
                type="button"
                onClick={() => void loadLogs()}
                className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                Retry
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <FileSearch className="h-10 w-10 text-slate-300" />
              <p className="mt-3 font-semibold text-slate-800">
                No audit records found
              </p>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Try changing the filters or reset them to view all available
                records.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Date / time</th>
                      <th className="px-5 py-3 font-semibold">Actor</th>
                      <th className="px-5 py-3 font-semibold">Action</th>
                      <th className="px-5 py-3 font-semibold">Resource</th>
                      <th className="px-5 py-3 font-semibold">Outcome</th>
                      <th className="px-5 py-3 font-semibold">Request</th>
                      <th className="px-5 py-3 font-semibold">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log._id} className="align-top hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-600">
                          <div className="flex items-start gap-2">
                            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <span>{dateTime(log.createdAt)}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ring-1 ${actorClass(log.actorType)}`}
                          >
                            {log.actorType}
                          </span>
                          <p className="mt-2 text-xs text-slate-600">
                            {log.actorRole || "Role not recorded"}
                          </p>
                          <p
                            title={log.actorId || ""}
                            className="mt-1 max-w-40 break-all font-mono text-[11px] text-slate-400"
                          >
                            {shortId(log.actorId)}
                          </p>
                        </td>

                        <td className="max-w-64 px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ring-1 ${actionClass(log.action)}`}
                          >
                            {log.action}
                          </span>
                          <p className="mt-2 break-words font-medium text-slate-800">
                            {log.description || "No description recorded"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="break-words font-medium text-slate-700">
                            {log.resource}
                          </p>
                          <p
                            title={log.resourceId || ""}
                            className="mt-1 max-w-40 break-all font-mono text-[11px] text-slate-400"
                          >
                            {shortId(log.resourceId)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          {log.success ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                              <XCircle className="h-3.5 w-3.5" />
                              Failed
                            </span>
                          )}
                        </td>

                        <td className="max-w-52 px-5 py-4">
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
                            onClick={() => void openDetails(log)}
                            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            <FileSearch className="h-3.5 w-3.5" />
                            View details
                          </button>
                        </td>
                      </tr>
                    ))}
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
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
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
                    onClick={() =>
                      setPage((current) =>
                        Math.min(totalPages, current + 1),
                      )
                    }
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
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="leading-6">
            This screen is read-only. The backend enforces authentication and
            the <code>audit-logs.read</code> permission for administrative
            accounts. Audit metadata may contain sensitive operational data;
            access should be limited to trusted personnel.
          </p>
        </footer>
      </div>

      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedLog(null);
              setDetailError("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-detail-title"
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="audit-detail-title"
                    className="text-lg font-bold text-slate-950"
                  >
                    Audit record details
                  </h2>
                  {detailLoading && (
                    <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                  )}
                </div>
                <p className="mt-1 break-words text-sm text-slate-500">
                  {selectedLog.action} · {selectedLog.resource}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close audit details"
                onClick={() => {
                  setSelectedLog(null);
                  setDetailError("");
                }}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-5">
              {detailError && (
                <div
                  role="alert"
                  className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
                >
                  Could not fetch the full record. Showing the record from the
                  list instead. {detailError}
                  <button
                    type="button"
                    onClick={() => void openDetails(selectedLog)}
                    className="ml-2 font-semibold underline underline-offset-2"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${actorClass(selectedLog.actorType)}`}
                >
                  {selectedLog.actorType}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${actionClass(selectedLog.action)}`}
                >
                  {selectedLog.action}
                </span>
                {selectedLog.success ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Successful
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                    <XCircle className="h-3.5 w-3.5" />
                    Failed
                  </span>
                )}
              </div>

              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-900">
                  Event information
                </h3>
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <DetailRow label="Record ID" value={selectedLog._id} mono />
                  <DetailRow
                    label="Recorded at"
                    value={dateTime(selectedLog.createdAt)}
                  />
                  <DetailRow label="Actor ID" value={selectedLog.actorId} mono />
                  <DetailRow label="Actor role" value={selectedLog.actorRole} />
                  <DetailRow label="Action" value={selectedLog.action} />
                  <DetailRow label="Resource" value={selectedLog.resource} />
                  <DetailRow
                    label="Resource ID"
                    value={selectedLog.resourceId}
                    mono
                  />
                  <DetailRow
                    label="Request ID"
                    value={selectedLog.requestId}
                    mono
                  />
                </dl>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-900">
                  Description
                </h3>
                <p className="whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {selectedLog.description || "No description was recorded."}
                </p>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-900">
                  Request information
                </h3>
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <DetailRow label="HTTP method" value={selectedLog.method} />
                  <DetailRow label="IP address" value={selectedLog.ipAddress} mono />
                  <DetailRow label="Request path" value={selectedLog.path} mono />
                  <DetailRow
                    label="User agent"
                    value={selectedLog.userAgent}
                  />
                </dl>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Metadata
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      void copyText(
                        jsonValue(selectedLog.metadata ?? {}),
                        "Metadata",
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy JSON
                  </button>
                </div>
                <pre className="max-h-80 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                  {jsonValue(selectedLog.metadata ?? {})}
                </pre>
                {copyMessage && (
                  <p role="status" className="mt-2 text-xs text-slate-500">
                    {copyMessage}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <p className="text-xs text-slate-500">
                  <Clock3 className="mr-1 inline h-3.5 w-3.5" />
                  Recorded {dateOnly(selectedLog.createdAt)}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLog(null);
                    setDetailError("");
                  }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  <X className="h-4 w-4" />
                  Close details
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
