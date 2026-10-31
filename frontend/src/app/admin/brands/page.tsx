"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Search,
  Tags,
  Trash2,
} from "lucide-react";

import { brandsAdminApi } from "@/services/api/brands-admin.api";

import type {
  Brand,
  BrandListParams,
  BrandStatus,
} from "@/features/brands/brand.types";

const STATUSES: BrandStatus[] = ["ACTIVE", "INACTIVE"];
const PAGE_SIZE = 20;

const inputClass =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
            errors?: Array<{ field?: string; message?: string }>;
          };
        };
      }
    ).response;

    const data = response?.data;
    if (data?.errors?.length) {
      return data.errors
        .map((item) => `${item.field ?? "Field"}: ${item.message ?? ""}`)
        .join(" | ");
    }
    if (data?.message) return data.message;
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<BrandListParams["sortBy"]>("sortOrder");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadBrands = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await brandsAdminApi.getAll({
        page,
        limit: PAGE_SIZE,
        sortBy,
        sortOrder,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(status ? { status: status as BrandStatus } : {}),
      });

      setBrands(result.items);
      setPagination(result.pagination);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortOrder, status]);

  useEffect(() => {
    void Promise.resolve().then(loadBrands);
  }, [loadBrands, refreshKey]);

  const changeStatus = async (brand: Brand, nextStatus: BrandStatus) => {
    setActionId(brand._id);

    try {
      await brandsAdminApi.updateStatus(brand._id, {
        status: nextStatus,
      });
      await loadBrands();
    } catch (requestError) {
      window.alert(getErrorMessage(requestError));
    } finally {
      setActionId("");
    }
  };

  const changeSortOrder = async (brand: Brand) => {
    const value = window.prompt(
      "Enter new sort order:",
      String(brand.sortOrder),
    );

    if (value === null) return;

    const sortOrderValue = Number(value);
    if (
      !Number.isInteger(sortOrderValue) ||
      sortOrderValue < 0 ||
      sortOrderValue > 1_000_000
    ) {
      window.alert("Sort order must be an integer between 0 and 1,000,000.");
      return;
    }

    setActionId(brand._id);
    try {
      await brandsAdminApi.updateSortOrder(brand._id, {
        sortOrder: sortOrderValue,
      });
      await loadBrands();
    } catch (requestError) {
      window.alert(getErrorMessage(requestError));
    } finally {
      setActionId("");
    }
  };

  const deleteBrand = async (brand: Brand) => {
    if (
      !window.confirm(`Delete "${brand.name}"? This action cannot be undone.`)
    ) {
      return;
    }

    setActionId(brand._id);
    try {
      await brandsAdminApi.delete(brand._id);
      await loadBrands();
    } catch (requestError) {
      window.alert(getErrorMessage(requestError));
    } finally {
      setActionId("");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setPage(1);
    setSortBy("sortOrder");
    setSortOrder("asc");
  };

  const totalPages = Math.max(1, pagination.totalPages);

  return (
    <main className="min-h-full bg-slate-50 p-4 text-slate-900 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <Tags className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Brands
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage product brands, logos, visibility and ordering.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              disabled={loading}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <Link
              href="/admin/brands/new"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              <Plus className="h-4 w-4" />
              Create brand
            </Link>
          </div>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1fr)_180px_190px_160px_auto]">
            <label className="text-sm font-medium text-slate-700">
              Search brands
              <span className="relative mt-1.5 block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Name, slug or description"
                  className={`${inputClass} pl-9`}
                />
              </span>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Status
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
                className={`${inputClass} mt-1.5`}
              >
                <option value="">All statuses</option>
                {STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value === "ACTIVE" ? "Active" : "Inactive"}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Sort by
              <select
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value as BrandListParams["sortBy"]);
                  setPage(1);
                }}
                className={`${inputClass} mt-1.5`}
              >
                <option value="sortOrder">Sort order</option>
                <option value="name">Name</option>
                <option value="createdAt">Created date</option>
                <option value="updatedAt">Updated date</option>
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Direction
              <select
                value={sortOrder}
                onChange={(event) => {
                  setSortOrder(event.target.value as "asc" | "desc");
                  setPage(1);
                }}
                className={`${inputClass} mt-1.5`}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </label>

            <button
              type="button"
              onClick={resetFilters}
              className="h-11 self-end rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-semibold text-slate-900">Brand directory</h2>
              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? "Loading brands..."
                  : `${pagination.total.toLocaleString()} brand${pagination.total === 1 ? "" : "s"} found`}
              </p>
            </div>
            {sortBy === "sortOrder" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                <ArrowDownWideNarrow className="h-3.5 w-3.5" />
                Ordered by display position
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading brands...
            </div>
          ) : brands.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <ImageIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">
                No brands found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your filters or add your first brand.
              </p>
              <Link
                href="/admin/brands/new"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
              >
                <Plus className="h-4 w-4" />
                Create brand
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Brand</th>
                    <th className="px-5 py-3">Website</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Sort order</th>
                    <th className="px-5 py-3">Updated</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {brands.map((brand) => (
                    <tr
                      key={brand._id}
                      className="align-middle transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {brand.logo ? (
                            <img
                              src={brand.logo}
                              alt={`${brand.name} logo`}
                              className="h-11 w-11 rounded-lg border border-slate-200 bg-white object-contain p-1"
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
                              <Tags className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {brand.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {brand.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {brand.website ? (
                          <a
                            href={brand.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-blue-700 hover:underline"
                          >
                            <span className="max-w-40 truncate">
                              {brand.website.replace(/^https?:\/\//, "")}
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          aria-label={`Status for ${brand.name}`}
                          value={brand.status}
                          disabled={actionId === brand._id}
                          onChange={(event) =>
                            void changeStatus(
                              brand,
                              event.target.value as BrandStatus,
                            )
                          }
                          className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold outline-none ring-1 ring-inset disabled:opacity-50 ${
                            brand.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-slate-100 text-slate-600 ring-slate-200"
                          }`}
                        >
                          {STATUSES.map((value) => (
                            <option key={value} value={value}>
                              {value === "ACTIVE" ? "Active" : "Inactive"}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          disabled={actionId === brand._id}
                          onClick={() => void changeSortOrder(brand)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm tabular-nums text-slate-700 transition hover:bg-white disabled:opacity-50"
                        >
                          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                          {brand.sortOrder}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                        {formatDate(brand.updatedAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/brands/${brand._id}`}
                            className="font-semibold text-blue-700 hover:underline"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            disabled={actionId === brand._id}
                            onClick={() => void deleteBrand(brand)}
                            className="inline-flex items-center gap-1 font-medium text-red-600 hover:underline disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:px-5">
            <p className="text-sm text-slate-500">
              Page {pagination.page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!pagination.hasPreviousPage || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage || loading}
                onClick={() => setPage((current) => current + 1)}
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
