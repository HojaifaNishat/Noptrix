"use client";

import { useCallback, useEffect, useState } from "react";

import { activityLogsApi } from "@/services/api/activity-logs.api";

import type {
  ActivityLog,
  ActivityType,
} from "@/services/api/activity-logs.api";

const ACTIVITY_TYPES: Array<"ALL" | ActivityType> = [
  "ALL",
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

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    return response?.data?.message ?? "Failed to load activity logs.";
  }

  return error instanceof Error ? error.message : "Something went wrong.";
};

const formatDate = (value?: string): string => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function CustomerActivityPage() {
  const [items, setItems] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actorIdInput, setActorIdInput] = useState("");
  const [actorId, setActorId] = useState("");
  const [activityType, setActivityType] = useState<"ALL" | ActivityType>("ALL");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadActivity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await activityLogsApi.getAll({
        page,
        limit: 20,
        actorType: "USER",
        sortOrder: "desc",
        ...(actorId ? { actorId } : {}),
        ...(activityType !== "ALL" ? { activityType } : {}),
      });

      setItems(result.items);
      setTotal(result.pagination.total);
      setTotalPages(Math.max(1, result.pagination.totalPages));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setItems([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, actorId, activityType]);

  useEffect(() => {
    void Promise.resolve().then(loadActivity);
  }, [loadActivity]);

  const handleSearch = () => {
    setPage(1);
    setActorId(actorIdInput.trim());
  };

  const handleTypeChange = (value: string) => {
    setPage(1);
    setActivityType(value as "ALL" | ActivityType);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Customer Activity
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Review recorded activity for USER accounts.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
          <div>
            <label
              htmlFor="actorId"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              User ID
            </label>
            <input
              id="actorId"
              value={actorIdInput}
              onChange={(event) => setActorIdInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Filter by user ID"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="activityType"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Activity type
            </label>
            <select
              id="activityType"
              value={activityType}
              onChange={(event) => handleTypeChange(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            >
              {ACTIVITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === "ALL" ? "All types" : type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleSearch}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 md:w-auto"
            >
              Apply filter
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {loading
            ? "Loading activity..."
            : `${total} activity record${total === 1 ? "" : "s"}`}
        </p>

        <button
          type="button"
          onClick={() => void loadActivity()}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Loading customer activity...
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <h2 className="font-medium text-gray-900 dark:text-white">
              No activity found
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No USER activity records match the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800/70 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Activity</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Request</th>
                  <th className="px-4 py-3">IP address</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((item, index) => (
                  <tr
                    key={item._id ?? item.id ?? `${item.createdAt}-${index}`}
                    className="align-top hover:bg-gray-50 dark:hover:bg-gray-800/40"
                  >
                    <td className="max-w-sm px-4 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.action}
                      </p>
                      <p className="mt-1 whitespace-normal text-gray-500 dark:text-gray-400">
                        {item.description ?? "—"}
                      </p>
                    </td>

                    <td className="px-4 py-4">{item.activityType}</td>

                    <td className="px-4 py-4 font-mono text-xs text-gray-600 dark:text-gray-300">
                      {item.actorId ?? "—"}
                    </td>

                    <td className="px-4 py-4">
                      <p>{item.resource ?? "—"}</p>
                      {item.resourceId && (
                        <p className="mt-1 font-mono text-xs text-gray-500">
                          {item.resourceId}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <p>{item.method ?? "—"}</p>
                      <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                        {item.path ?? ""}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-gray-600 dark:text-gray-300">
                      {item.ipAddress ?? "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-300">
                      {formatDate(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Page {page} of {totalPages}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
          >
            Previous
          </button>

          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
