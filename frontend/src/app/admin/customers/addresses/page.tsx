"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

import { AlertCircle, LoaderCircle, RefreshCw, Search } from "lucide-react";

import {
  customerAddressesApi,
  type CustomerAddress,
} from "@/services/api/customer-addresses.api";

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

  return error instanceof Error ? error.message : "Unable to load addresses.";
}

function getCustomerName(address: CustomerAddress): string {
  return typeof address.userId === "object"
    ? address.userId.name
    : address.fullName;
}

function getCustomerContact(address: CustomerAddress): string {
  if (typeof address.userId === "string") return address.userId;
  return address.userId.email ?? address.userId.phone ?? address.userId._id;
}

function formatAddress(address: CustomerAddress): string {
  return [
    address.addressLine1,
    address.addressLine2,
    address.area,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

export default function CustomerAddressesPage() {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"ALL" | CustomerAddress["type"]>("ALL");
  const [defaultFilter, setDefaultFilter] = useState<
    "ALL" | "DEFAULT" | "OTHER"
  >("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await customerAddressesApi.getAll({
        page,
        limit: PAGE_SIZE,
        ...(search ? { search } : {}),
        ...(type !== "ALL" ? { type } : {}),
        ...(defaultFilter !== "ALL"
          ? { isDefault: defaultFilter === "DEFAULT" }
          : {}),
      });
      setAddresses(result.items);
      setTotal(result.pagination.total);
      setTotalPages(Math.max(1, result.pagination.totalPages));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setAddresses([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [defaultFilter, page, search, type]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAddresses();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadAddresses]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Customer Addresses
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Search and review active shipping addresses across customers.
        </p>
      </header>

      <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-[1fr_180px_180px_auto] dark:border-gray-800 dark:bg-gray-900">
        <form onSubmit={handleSearch} className="space-y-1.5">
          <label
            htmlFor="address-search"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Search addresses
          </label>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                id="address-search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Customer, street, city, phone"
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </div>
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Search
            </button>
          </div>
        </form>

        <label className="space-y-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
          Address type
          <select
            value={type}
            onChange={(event) => {
              setPage(1);
              setType(event.target.value as typeof type);
            }}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          >
            <option value="ALL">All types</option>
            <option value="HOME">Home</option>
            <option value="WORK">Work</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <label className="space-y-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
          Default address
          <select
            value={defaultFilter}
            onChange={(event) => {
              setPage(1);
              setDefaultFilter(event.target.value as typeof defaultFilter);
            }}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          >
            <option value="ALL">All addresses</option>
            <option value="DEFAULT">Default only</option>
            <option value="OTHER">Non-default</option>
          </select>
        </label>

        <button
          type="button"
          onClick={() => void loadAddresses()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-end rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Address directory
          </h2>
          <span className="text-sm text-gray-500">{total} addresses</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-950/50">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Recipient</th>
                <th className="px-5 py-3">Address</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Default</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    <span className="inline-flex items-center gap-2">
                      <LoaderCircle size={16} className="animate-spin" />
                      Loading addresses…
                    </span>
                  </td>
                </tr>
              ) : addresses.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    No addresses found.
                  </td>
                </tr>
              ) : (
                addresses.map((address) => (
                  <tr
                    key={address._id}
                    className="text-gray-700 dark:text-gray-300"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getCustomerName(address)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {getCustomerContact(address)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p>{address.fullName}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {address.phone}
                      </p>
                    </td>
                    <td className="max-w-md whitespace-normal px-5 py-4">
                      {formatAddress(address)}
                      {address.landmark && (
                        <p className="mt-1 text-xs text-gray-500">
                          Near {address.landmark}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">{address.type}</td>
                    <td className="px-5 py-4">
                      {address.isDefault ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          Default
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 text-sm text-gray-500 dark:border-gray-800">
          <span>
            Showing {total ? (page - 1) * PAGE_SIZE + 1 : 0}–
            {Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-3">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40 dark:border-gray-700"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40 dark:border-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
