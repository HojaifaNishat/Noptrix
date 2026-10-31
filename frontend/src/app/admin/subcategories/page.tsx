"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

import { subcategoriesAdminApi } from "@/services/api/subcategories-admin.api";
import { categoriesAdminApi } from "@/services/api/categories-admin.api";

import type {
  Subcategory,
  SubcategoryStatus,
  SubcategoryListParams,
} from "@/features/subcategories/subcategory.types";

import type { Category } from "@/features/categories/category.types";

const STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function getCategoryName(subcategory: Subcategory): string {
  return typeof subcategory.categoryId === "object"
    ? subcategory.categoryId.name
    : subcategory.categoryId;
}

export default function SubcategoriesPage() {
  const [items, setItems] = useState<Subcategory[]>([]);
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
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [featured, setFeatured] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

  const loadCategories = useCallback(async () => {
    try {
      const result = await categoriesAdminApi.getAll({
        page: 1,
        limit: 100,
        sortBy: "name",
        sortOrder: "asc",
      });

      setCategories(result.items);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }, []);

  const loadSubcategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params: SubcategoryListParams = {
        page,
        limit: 20,
        sortBy: "sortOrder",
        sortOrder: "asc",
      };

      if (search.trim()) params.search = search.trim();
      if (categoryId) params.categoryId = categoryId;
      if (status) params.status = status as SubcategoryStatus;
      if (featured !== "") params.isFeatured = featured === "true";

      const result = await subcategoriesAdminApi.getAll(params);

      setItems(result.items);
      setPagination(result.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryId, status, featured]);

  useEffect(() => {
    void Promise.resolve().then(loadCategories);
  }, [loadCategories]);

  useEffect(() => {
    void Promise.resolve().then(loadSubcategories);
  }, [loadSubcategories]);

  const changeStatus = async (
    item: Subcategory,
    nextStatus: SubcategoryStatus,
  ) => {
    setActionId(item._id);

    try {
      await subcategoriesAdminApi.updateStatus(item._id, {
        status: nextStatus,
      });
      await loadSubcategories();
    } catch (err) {
      window.alert(getErrorMessage(err));
    } finally {
      setActionId("");
    }
  };

  const toggleFeatured = async (item: Subcategory) => {
    setActionId(item._id);

    try {
      await subcategoriesAdminApi.updateFeatured(item._id, {
        isFeatured: !item.isFeatured,
      });
      await loadSubcategories();
    } catch (err) {
      window.alert(getErrorMessage(err));
    } finally {
      setActionId("");
    }
  };

  const changeSortOrder = async (item: Subcategory) => {
    const value = window.prompt(
      "Enter new sort order:",
      String(item.sortOrder),
    );

    if (value === null) return;

    const sortOrder = Number(value);

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      window.alert("Sort order must be a non-negative integer.");
      return;
    }

    setActionId(item._id);

    try {
      await subcategoriesAdminApi.updateSortOrder(item._id, {
        sortOrder,
      });
      await loadSubcategories();
    } catch (err) {
      window.alert(getErrorMessage(err));
    } finally {
      setActionId("");
    }
  };

  const deleteSubcategory = async (item: Subcategory) => {
    if (
      !window.confirm(`Delete "${item.name}"? This action cannot be undone.`)
    ) {
      return;
    }

    setActionId(item._id);

    try {
      await subcategoriesAdminApi.delete(item._id);
      await loadSubcategories();
    } catch (err) {
      window.alert(getErrorMessage(err));
    } finally {
      setActionId("");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setCategoryId("");
    setStatus("");
    setFeatured("");
    setPage(1);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subcategories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your product subcategories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              void Promise.all([loadCategories(), loadSubcategories()])
            }
            disabled={loading}
            aria-label="Refresh subcategories"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/admin/subcategories/new"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            + Create Subcategory
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-4 md:grid-cols-2 lg:grid-cols-5">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search subcategories..."
          className="rounded-lg border px-3 py-2 text-sm"
        />

        <select
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>

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
          <option value="">All subcategories</option>
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
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button
            type="button"
            onClick={() => void loadSubcategories()}
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
              <th className="px-5 py-4">Subcategory</th>
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
                  colSpan={6}
                  className="px-5 py-12 text-center text-gray-500"
                >
                  Loading subcategories...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-gray-500"
                >
                  No subcategories found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {item.image?.secureUrl ? (
                        <img
                          src={item.image.secureUrl}
                          alt={item.name}
                          className="h-11 w-11 rounded-lg border object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                          No image
                        </div>
                      )}

                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">{item.slug}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {getCategoryName(item)}
                  </td>

                  <td className="px-5 py-4">
                    <select
                      value={item.status}
                      disabled={actionId === item._id}
                      onChange={(event) =>
                        void changeStatus(
                          item,
                          event.target.value as SubcategoryStatus,
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
                      disabled={actionId === item._id}
                      onClick={() => void toggleFeatured(item)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.isFeatured
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.isFeatured ? "Featured" : "No"}
                    </button>
                  </td>

                  <td className="px-5 py-4">
                    <button
                      type="button"
                      disabled={actionId === item._id}
                      onClick={() => void changeSortOrder(item)}
                      className="rounded border px-3 py-1 hover:bg-gray-100"
                    >
                      {item.sortOrder} · Edit
                    </button>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/subcategories/${item._id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        disabled={actionId === item._id}
                        onClick={() => void deleteSubcategory(item)}
                        className="font-medium text-red-600 hover:underline"
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
          Total: {pagination.total} subcategories
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
