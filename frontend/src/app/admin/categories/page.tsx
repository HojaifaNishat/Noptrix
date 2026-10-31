"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";

import { categoriesAdminApi } from "@/services/api/categories-admin.api";
import type {
  Category,
  CategoryListParams,
  CategoryStatus,
} from "@/features/categories/category.types";

const STATUSES: CategoryStatus[] = ["ACTIVE", "INACTIVE", "ARCHIVED"];

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [featured, setFeatured] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params: CategoryListParams = {
        page,
        limit: 20,
        sortBy: "sortOrder",
        sortOrder: "asc",
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(status ? { status: status as CategoryStatus } : {}),
        ...(featured !== "" ? { isFeatured: featured === "true" } : {}),
      };

      const result = await categoriesAdminApi.getAll(params);
      setCategories(result.items);
      setPagination(result.pagination);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [featured, page, search, status]);

  useEffect(() => {
    void Promise.resolve().then(loadCategories);
  }, [loadCategories]);

  const changeStatus = async (
    category: Category,
    nextStatus: CategoryStatus,
  ) => {
    setActionId(category._id);

    try {
      await categoriesAdminApi.updateStatus(category._id, {
        status: nextStatus,
      });
      await loadCategories();
    } catch (requestError) {
      window.alert(getErrorMessage(requestError));
    } finally {
      setActionId("");
    }
  };

  const toggleFeatured = async (category: Category) => {
    setActionId(category._id);

    try {
      await categoriesAdminApi.updateFeatured(category._id, {
        isFeatured: !category.isFeatured,
      });
      await loadCategories();
    } catch (requestError) {
      window.alert(getErrorMessage(requestError));
    } finally {
      setActionId("");
    }
  };

  const changeSortOrder = async (category: Category) => {
    const value = window.prompt(
      "Enter new sort order:",
      String(category.sortOrder),
    );

    if (value === null) return;

    const sortOrder = Number(value);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      window.alert("Sort order must be a non-negative integer.");
      return;
    }

    setActionId(category._id);

    try {
      await categoriesAdminApi.updateSortOrder(category._id, {
        sortOrder,
      });
      await loadCategories();
    } catch (requestError) {
      window.alert(getErrorMessage(requestError));
    } finally {
      setActionId("");
    }
  };

  const deleteCategory = async (category: Category) => {
    if (
      !window.confirm(
        `Delete "${category.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setActionId(category._id);

    try {
      await categoriesAdminApi.delete(category._id);
      await loadCategories();
    } catch (requestError) {
      window.alert(getErrorMessage(requestError));
    } finally {
      setActionId("");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setFeatured("");
    setPage(1);
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Categories
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage product categories, visibility and ordering.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadCategories()}
            disabled={loading}
            aria-label="Refresh categories"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/admin/categories/new"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            Create category
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-4 md:grid-cols-2 lg:grid-cols-4">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search categories..."
          className="rounded-lg border px-3 py-2 text-sm"
        />

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <select
          value={featured}
          onChange={(event) => {
            setFeatured(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          <option value="true">Featured</option>
          <option value="false">Not featured</option>
        </select>

        <button
          type="button"
          onClick={resetFilters}
          className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Reset filters
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
          <button
            type="button"
            onClick={() => void loadCategories()}
            className="ml-3 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Featured</th>
              <th className="px-5 py-4">Sort order</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-gray-500"
                >
                  Loading categories...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-gray-500"
                >
                  No categories found.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category._id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {category.image?.secureUrl ? (
                        <img
                          src={category.image.secureUrl}
                          alt={category.name}
                          className="h-11 w-11 rounded-lg border object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                          No image
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">
                          {category.name}
                        </p>
                        <p className="text-xs text-gray-500">{category.slug}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <select
                      value={category.status}
                      disabled={actionId === category._id}
                      onChange={(event) =>
                        void changeStatus(
                          category,
                          event.target.value as CategoryStatus,
                        )
                      }
                      className="rounded-md border px-2 py-1 text-xs"
                    >
                      {STATUSES.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-5 py-4">
                    <button
                      type="button"
                      disabled={actionId === category._id}
                      onClick={() => void toggleFeatured(category)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        category.isFeatured
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {category.isFeatured ? "Featured" : "No"}
                    </button>
                  </td>

                  <td className="px-5 py-4">
                    <button
                      type="button"
                      disabled={actionId === category._id}
                      onClick={() => void changeSortOrder(category)}
                      className="rounded border px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                    >
                      {category.sortOrder} · Edit
                    </button>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/categories/${category._id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={actionId === category._id}
                        onClick={() => void deleteCategory(category)}
                        className="font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Total: {pagination.total} categories
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!pagination.hasPreviousPage || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {pagination.page} of {Math.max(1, pagination.totalPages)}
          </span>

          <button
            type="button"
            disabled={!pagination.hasNextPage || loading}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
