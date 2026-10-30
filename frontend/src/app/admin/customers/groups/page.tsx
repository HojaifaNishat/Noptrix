"use client";

import { useCallback, useEffect, useState } from "react";

import { AlertCircle, LoaderCircle, Users } from "lucide-react";

import { customersApi, type CustomerGroup } from "@/services/api/customers.api";
import type {
  CustomerSegment,
  PeopleRecord,
} from "@/features/people/people.types";

const PAGE_SIZE = 20;

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (
      error as {
        response?: { data?: { message?: string } };
      }
    ).response;
    if (response?.data?.message) return response.data.message;
  }

  return error instanceof Error ? error.message : "Unable to load groups.";
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export default function CustomerGroupsPage() {
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CustomerSegment | null>(
    null,
  );
  const [customers, setCustomers] = useState<PeopleRecord[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [error, setError] = useState("");

  const loadGroups = useCallback(async () => {
    setLoadingGroups(true);
    setError("");
    try {
      setGroups(await customersApi.getGroups());
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    if (!selectedGroup) return;
    setLoadingCustomers(true);
    setError("");
    try {
      const result = await customersApi.getAll({
        page,
        limit: PAGE_SIZE,
        segment: selectedGroup,
      });
      setCustomers(result.items);
      setTotal(result.pagination.total);
      setTotalPages(Math.max(1, result.pagination.totalPages));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setCustomers([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoadingCustomers(false);
    }
  }, [page, selectedGroup]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadGroups();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadGroups]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCustomers();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadCustomers]);

  const chooseGroup = (groupId: CustomerSegment) => {
    setPage(1);
    setSelectedGroup(groupId);
  };

  const selectedGroupDetails = groups.find(
    (group) => group.id === selectedGroup,
  );

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Customer Groups
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Browse live customer segments based on account status and order
          history.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {loadingGroups ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-10 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          <LoaderCircle size={16} className="animate-spin" />
          Loading customer groups…
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => chooseGroup(group.id)}
              className={`rounded-xl border p-5 text-left transition ${
                selectedGroup === group.id
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/20"
                  : "border-gray-200 bg-white hover:border-blue-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
              }`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                <Users size={19} />
              </span>
              <span className="mt-4 block text-lg font-semibold text-gray-900 dark:text-white">
                {group.count.toLocaleString()}
              </span>
              <span className="mt-1 block font-medium text-gray-800 dark:text-gray-200">
                {group.name}
              </span>
              <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">
                {group.description}
              </span>
            </button>
          ))}
        </div>
      )}

      {selectedGroup && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {selectedGroupDetails?.name ?? "Customers"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {total.toLocaleString()} matching customers
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadCustomers()}
              disabled={loadingCustomers}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
            >
              Refresh group
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-950/50">
                <tr>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Email / phone</th>
                  <th className="px-5 py-3">Orders</th>
                  <th className="px-5 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loadingCustomers ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-gray-500"
                    >
                      <span className="inline-flex items-center gap-2">
                        <LoaderCircle size={16} className="animate-spin" />
                        Loading customers…
                      </span>
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-gray-500"
                    >
                      No customers in this group.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="text-gray-700 dark:text-gray-300"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {customer.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {customer.status}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        {customer.email || "—"}
                        <p className="mt-1 text-xs text-gray-500">
                          {customer.phone || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4">{customer.totalOrders ?? 0}</td>
                      <td className="px-5 py-4">
                        {formatDate(customer.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 text-sm text-gray-500 dark:border-gray-800">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loadingCustomers}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40 dark:border-gray-700"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loadingCustomers}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40 dark:border-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
