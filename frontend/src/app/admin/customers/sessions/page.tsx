"use client";

import { type FormEvent, useState } from "react";

import {
  AlertCircle,
  LoaderCircle,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

import { customersApi } from "@/services/api/customers.api";
import {
  customerSessionsApi,
  type CustomerSession,
} from "@/services/api/customer-sessions.api";

import type { PeopleRecord } from "@/features/people/people.types";

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (
      error as {
        response?: { data?: { message?: string } };
      }
    ).response;
    if (response?.data?.message) return response.data.message;
  }

  return error instanceof Error ? error.message : "Unable to load sessions.";
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export default function CustomerSessionsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [customers, setCustomers] = useState<PeopleRecord[]>([]);
  const [userId, setUserId] = useState("");
  const [sessions, setSessions] = useState<CustomerSession[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    setError("");
    setNotice("");
    setUserId("");
    setSessions([]);
    try {
      const result = await customersApi.getAll({
        page: 1,
        limit: 50,
        ...(searchInput.trim() ? { search: searchInput.trim() } : {}),
      });
      setCustomers(result.items);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const searchCustomers = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loadCustomers();
  };

  const selectCustomer = async (selectedUserId: string) => {
    setUserId(selectedUserId);
    setNotice("");
    setError("");
    if (!selectedUserId) {
      setSessions([]);
      return;
    }

    setLoadingSessions(true);
    try {
      setSessions(await customerSessionsApi.getAll(selectedUserId));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const revokeSession = async (session: CustomerSession) => {
    setRevokingSessionId(session._id);
    setError("");
    setNotice("");
    try {
      await customerSessionsApi.revoke(userId, session._id);
      setSessions((current) =>
        current.filter((item) => item._id !== session._id),
      );
      setNotice("Session revoked.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setRevokingSessionId("");
    }
  };

  const revokeAll = async () => {
    if (!userId) return;
    setRevoking(true);
    setError("");
    setNotice("");
    try {
      const count = await customerSessionsApi.revokeAll(userId);
      setSessions([]);
      setNotice(`${count} active session${count === 1 ? "" : "s"} revoked.`);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setRevoking(false);
    }
  };

  const selectedCustomer = customers.find(
    (customer) => customer.accountUserId === userId,
  );

  return (
    <section className="space-y-6">
      <header>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Customer Sessions
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Review device sessions and revoke access for a selected customer.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              userId ? void selectCustomer(userId) : void loadCustomers()
            }
            disabled={loadingCustomers || loadingSessions}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <RefreshCw
              size={16}
              className={
                loadingCustomers || loadingSessions ? "animate-spin" : ""
              }
            />
            Refresh
          </button>
        </div>
      </header>

      <form
        onSubmit={searchCustomers}
        className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-[1fr_auto] dark:border-gray-800 dark:bg-gray-900"
      >
        <label className="space-y-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
          Find customer by name, email, or phone
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search customers"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 font-normal text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </div>
        </label>
        <button
          type="submit"
          disabled={loadingCustomers}
          className="self-end rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loadingCustomers ? "Searching…" : "Search"}
        </button>
      </form>

      {customers.length > 0 && (
        <label className="block space-y-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
          Customer
          <select
            value={userId}
            onChange={(event) => void selectCustomer(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          >
            <option value="">Select a customer</option>
            {customers
              .filter((customer) => customer.accountUserId)
              .map((customer) => (
                <option key={customer.id} value={customer.accountUserId}>
                  {customer.name} —{" "}
                  {customer.email || customer.phone || customer.id}
                </option>
              ))}
          </select>
        </label>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          {notice}
        </div>
      )}

      {userId && (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {selectedCustomer?.name ?? "Customer"} sessions
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {sessions.length} active session
                {sessions.length === 1 ? "" : "s"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void revokeAll()}
              disabled={revoking || loadingSessions || sessions.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-50 dark:border-red-900 dark:text-red-300"
            >
              {revoking ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : (
                <LogOut size={15} />
              )}
              Revoke all sessions
            </button>
          </div>

          {loadingSessions ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
              <LoaderCircle size={16} className="animate-spin" />
              Loading sessions…
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">
              No active sessions for this customer.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-950/50">
                  <tr>
                    <th className="px-5 py-3">Device / browser</th>
                    <th className="px-5 py-3">IP address</th>
                    <th className="px-5 py-3">Last active</th>
                    <th className="px-5 py-3">Expires</th>
                    <th className="px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {sessions.map((session) => (
                    <tr
                      key={session._id}
                      className="text-gray-700 dark:text-gray-300"
                    >
                      <td className="max-w-sm px-5 py-4">
                        <p className="break-words">
                          {session.userAgent || "Unknown device"}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                          <ShieldCheck size={13} />
                          {session.secretVerified
                            ? "Security verified"
                            : "Not verified"}
                        </p>
                      </td>
                      <td className="px-5 py-4">{session.ipAddress || "—"}</td>
                      <td className="px-5 py-4">
                        {formatDate(session.lastUsedAt)}
                      </td>
                      <td className="px-5 py-4">
                        {formatDate(session.expiresAt)}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => void revokeSession(session)}
                          disabled={revokingSessionId === session._id}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-50 dark:border-red-900 dark:text-red-300"
                        >
                          {revokingSessionId === session._id
                            ? "Revoking…"
                            : "Revoke"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </section>
  );
}
