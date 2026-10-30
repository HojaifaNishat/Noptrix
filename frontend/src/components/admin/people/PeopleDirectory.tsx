"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";

import { hasPermission } from "@/lib/permissions/permission";

import { useAuthStore } from "@/stores/auth.store";

import type {
  PeopleListParams,
  PeopleListResponse,
  PeopleRecord,
  PersonStatus,
} from "@/features/people/people.types";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: Array<"ALL" | PersonStatus> = [
  "ALL",
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "BLOCKED",
];

interface PeopleDirectoryProps {
  title: string;
  description: string;
  entityLabel: string;
  readPermission: string;
  updatePermission: string;
  getPeople: (params: PeopleListParams) => Promise<PeopleListResponse>;
  updateStatus: (id: string, status: PersonStatus) => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function formatDate(value?: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function statusClass(status: PersonStatus): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900";
    case "SUSPENDED":
      return "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900";
    case "BLOCKED":
      return "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-900";
    default:
      return "bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700";
  }
}

export default function PeopleDirectory({
  title,
  description,
  entityLabel,
  readPermission,
  updatePermission,
  getPeople,
  updateStatus,
}: PeopleDirectoryProps) {
  const user = useAuthStore((state) => state.user);
  const canUpdate = hasPermission(user, updatePermission);

  const [people, setPeople] = useState<PeopleRecord[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PersonStatus>("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [changingStatusId, setChangingStatusId] = useState("");
  const [error, setError] = useState("");

  const loadPeople = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getPeople({
        page,
        limit: PAGE_SIZE,
        ...(search ? { search } : {}),
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
      });

      setPeople(result.items);
      setTotal(result.pagination.total);
      setTotalPages(Math.max(1, result.pagination.totalPages));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setPeople([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [getPeople, page, search, statusFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPeople();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadPeople]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleStatusFilter = (value: string) => {
    setPage(1);
    setStatusFilter(value as "ALL" | PersonStatus);
  };

  const handleStatusChange = async (
    person: PeopleRecord,
    status: PersonStatus,
  ) => {
    setChangingStatusId(person.id);
    setError("");

    try {
      await updateStatus(person.id, status);
      await loadPeople();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setChangingStatusId("");
    }
  };

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  if (!hasPermission(user, readPermission)) {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
        You do not have permission to view {entityLabel.toLowerCase()}.
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </header>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <form
            onSubmit={handleSearch}
            className="flex min-w-0 flex-1 flex-col gap-1.5"
          >
            <label
              htmlFor={`${entityLabel}-search`}
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Search {entityLabel.toLowerCase()}
            </label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id={`${entityLabel}-search`}
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Name, email, or phone"
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex flex-col gap-1.5 md:w-48">
            <label
              htmlFor={`${entityLabel}-status`}
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Account status
            </label>
            <select
              id={`${entityLabel}-status`}
              value={statusFilter}
              onChange={(event) => handleStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL"
                    ? "All statuses"
                    : status.charAt(0) + status.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => void loadPeople()}
            disabled={loading}
            aria-label={`Refresh ${entityLabel.toLowerCase()}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-gray-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {entityLabel}
            </h2>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {total.toLocaleString()} total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-950/50 dark:text-gray-400">
              <tr>
                <th className="px-5 py-3 font-medium">Person</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Status</th>
                {entityLabel === "Customers" && (
                  <th className="px-5 py-3 font-medium">Orders</th>
                )}
                <th className="px-5 py-3 font-medium">Last login</th>
                <th className="px-5 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={entityLabel === "Customers" ? 6 : 5}
                    className="px-5 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <span className="inline-flex items-center gap-2">
                      <LoaderCircle size={16} className="animate-spin" />
                      Loading {entityLabel.toLowerCase()}…
                    </span>
                  </td>
                </tr>
              ) : people.length === 0 ? (
                <tr>
                  <td
                    colSpan={entityLabel === "Customers" ? 6 : 5}
                    className="px-5 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    No {entityLabel.toLowerCase()} found.
                  </td>
                </tr>
              ) : (
                people.map((person) => (
                  <tr
                    key={person.id}
                    className="text-gray-700 dark:text-gray-300"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-sm font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                          {person.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={person.avatarUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            getInitials(person.name)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900 dark:text-white">
                            {person.name}
                          </p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {person.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div>{person.email || "—"}</div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {person.phone || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusClass(person.status)}`}
                        >
                          {person.status}
                        </span>
                        {canUpdate && (
                          <select
                            aria-label={`Change ${person.name} status`}
                            value={person.status}
                            disabled={changingStatusId === person.id}
                            onChange={(event) =>
                              void handleStatusChange(
                                person,
                                event.target.value as PersonStatus,
                              )
                            }
                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
                          >
                            {STATUS_OPTIONS.filter(
                              (status) => status !== "ALL",
                            ).map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                    {entityLabel === "Customers" && (
                      <td className="px-5 py-4">{person.totalOrders ?? 0}</td>
                    )}
                    <td className="px-5 py-4">
                      {formatDate(person.lastLoginAt)}
                    </td>
                    <td className="px-5 py-4">
                      {formatDate(person.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-3 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {rangeStart}–{rangeEnd} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => current - 1)}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
            >
              <ChevronLeft size={15} />
              Previous
            </button>
            <span className="px-2">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
