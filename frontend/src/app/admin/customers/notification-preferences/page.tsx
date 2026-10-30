"use client";

import { type FormEvent, useState } from "react";

import { AlertCircle, Bell, LoaderCircle, Search } from "lucide-react";

import {
  customersApi,
  type CustomerNotificationPreferences,
} from "@/services/api/customers.api";

import type { PeopleRecord } from "@/features/people/people.types";

const DEFAULT_PREFERENCES: CustomerNotificationPreferences = {
  email: true,
  sms: true,
  push: true,
  marketing: false,
};

const PREFERENCE_ITEMS: Array<{
  key: keyof CustomerNotificationPreferences;
  title: string;
  description: string;
}> = [
  {
    key: "email",
    title: "Email notifications",
    description: "Order updates, account messages, and service information.",
  },
  {
    key: "sms",
    title: "SMS notifications",
    description: "Order status, delivery updates, and verification messages.",
  },
  {
    key: "push",
    title: "Push notifications",
    description: "Browser or mobile push notifications.",
  },
  {
    key: "marketing",
    title: "Marketing notifications",
    description: "Campaigns, offers, and promotional announcements.",
  },
];

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (
      error as {
        response?: { data?: { message?: string } };
      }
    ).response;
    if (response?.data?.message) return response.data.message;
  }

  return error instanceof Error
    ? error.message
    : "Unable to update preferences.";
}

export default function CustomerNotificationPreferencesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [customers, setCustomers] = useState<PeopleRecord[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [preferences, setPreferences] =
    useState<CustomerNotificationPreferences>(DEFAULT_PREFERENCES);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const searchCustomers = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoadingCustomers(true);
    setError("");
    setNotice("");
    setSelectedCustomerId("");
    setPreferences(DEFAULT_PREFERENCES);

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

  const selectCustomer = async (customerId: string) => {
    setSelectedCustomerId(customerId);
    setNotice("");
    setError("");
    if (!customerId) {
      setPreferences(DEFAULT_PREFERENCES);
      return;
    }

    setLoadingPreferences(true);
    try {
      setPreferences(await customersApi.getNotificationPreferences(customerId));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setLoadingPreferences(false);
    }
  };

  const savePreferences = async () => {
    if (!selectedCustomerId) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      setPreferences(
        await customersApi.updateNotificationPreferences(
          selectedCustomerId,
          preferences,
        ),
      );
      setNotice("Notification preferences saved.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const selectedCustomer = customers.find(
    (customer) => customer.id === selectedCustomerId,
  );

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Notification Preferences
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Review and update a customer&apos;s saved notification choices.
        </p>
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
            value={selectedCustomerId}
            onChange={(event) => void selectCustomer(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          >
            <option value="">Select a customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
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

      {selectedCustomerId && (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              <Bell size={18} />
            </span>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {selectedCustomer?.name ?? "Customer preferences"}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedCustomer?.email ??
                  selectedCustomer?.phone ??
                  selectedCustomerId}
              </p>
            </div>
          </div>

          {loadingPreferences ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
              <LoaderCircle size={16} className="animate-spin" />
              Loading preferences…
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100 px-5 dark:divide-gray-800">
                {PREFERENCE_ITEMS.map((item) => (
                  <label
                    key={item.key}
                    className="flex cursor-pointer items-center justify-between gap-5 py-4"
                  >
                    <span>
                      <span className="block text-sm font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">
                        {item.description}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={preferences[item.key]}
                      onChange={(event) =>
                        setPreferences((current) => ({
                          ...current,
                          [item.key]: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                ))}
              </div>
              <div className="flex justify-end border-t border-gray-200 p-4 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => void savePreferences()}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving && (
                    <LoaderCircle size={15} className="animate-spin" />
                  )}
                  Save preferences
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </section>
  );
}
