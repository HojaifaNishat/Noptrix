"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Edit,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

import { attributesAdminApi } from "@/services/api/attributes-admin.api";
import type {
  Attribute,
  AttributeListParams,
  AttributeStatus,
  AttributeType,
} from "@/features/attributes/attribute.types";

import { getErrorMessage } from "@/features/attributes/attribute-error";

const TYPES: AttributeType[] = [
  "TEXT",
  "NUMBER",
  "BOOLEAN",
  "SELECT",
  "MULTI_SELECT",
];

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

export default function AttributesPage() {
  const [items, setItems] = useState<readonly Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [isVariant, setIsVariant] = useState("");
  const [isFilterable, setIsFilterable] = useState("");
  const [sortBy, setSortBy] =
    useState<NonNullable<AttributeListParams["sortBy"]>>("sortOrder");
  const [sortOrder, setSortOrder] =
    useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [busyId, setBusyId] = useState("");

  const loadAttributes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await attributesAdminApi.getAll({
        page,
        limit: 20,
        search: search.trim() || undefined,
        status: (status || undefined) as AttributeStatus | undefined,
        type: (type || undefined) as AttributeType | undefined,
        isVariant:
          isVariant === "" ? undefined : isVariant === "true",
        isFilterable:
          isFilterable === "" ? undefined : isFilterable === "true",
        sortBy,
        sortOrder,
      });

      setItems(result.items);
      setPagination(result.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    status,
    type,
    isVariant,
    isFilterable,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    void loadAttributes();
  }, [loadAttributes]);

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setType("");
    setIsVariant("");
    setIsFilterable("");
    setSortBy("sortOrder");
    setSortOrder("asc");
    setPage(1);
  };

  const toggleStatus = async (attribute: Attribute) => {
    const nextStatus =
      attribute.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    if (
      !window.confirm(
        `Change "${attribute.name}" status to ${nextStatus}?`,
      )
    ) {
      return;
    }

    setBusyId(attribute._id);

    try {
      await attributesAdminApi.updateStatus(attribute._id, {
        status: nextStatus,
      });
      await loadAttributes();
    } catch (err) {
      window.alert(getErrorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  const changeSortOrder = async (attribute: Attribute) => {
    const value = window.prompt(
      `New sort order for ${attribute.name}`,
      String(attribute.sortOrder),
    );

    if (value === null) return;

    const sortValue = Number(value);

    if (
      !Number.isInteger(sortValue) ||
      sortValue < 0 ||
      sortValue > 1_000_000
    ) {
      window.alert("Sort order must be an integer from 0 to 1,000,000.");
      return;
    }

    setBusyId(attribute._id);

    try {
      await attributesAdminApi.updateSortOrder(attribute._id, {
        sortOrder: sortValue,
      });
      await loadAttributes();
    } catch (err) {
      window.alert(getErrorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  const deleteAttribute = async (attribute: Attribute) => {
    if (
      !window.confirm(
        `Delete "${attribute.name}"?\n\nAttributes used by products cannot be deleted.`,
      )
    ) {
      return;
    }

    setBusyId(attribute._id);

    try {
      await attributesAdminApi.delete(attribute._id);
      await loadAttributes();
    } catch (err) {
      window.alert(getErrorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Attributes
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage product attributes, options and filtering behavior.
          </p>
        </div>

        <Link
          href="/admin/attributes/new"
          className={`${buttonClass} bg-blue-600 text-white hover:bg-blue-700`}
        >
          <Plus size={17} />
          Create Attribute
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-3 text-gray-400"
            />
            <input
              className={`${inputClass} pl-9`}
              placeholder="Search attributes..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className={inputClass}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <select
            className={inputClass}
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All types</option>
            {TYPES.map((item) => (
              <option key={item} value={item}>
                {item.replace("_", " ")}
              </option>
            ))}
          </select>

          <select
            className={inputClass}
            value={isVariant}
            onChange={(event) => {
              setIsVariant(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All variant settings</option>
            <option value="true">Variant attributes</option>
            <option value="false">Non-variant attributes</option>
          </select>

          <select
            className={inputClass}
            value={isFilterable}
            onChange={(event) => {
              setIsFilterable(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All filter settings</option>
            <option value="true">Filterable</option>
            <option value="false">Not filterable</option>
          </select>

          <select
            className={inputClass}
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value as typeof sortBy);
              setPage(1);
            }}
          >
            <option value="sortOrder">Sort order</option>
            <option value="name">Name</option>
            <option value="createdAt">Created date</option>
            <option value="updatedAt">Updated date</option>
          </select>

          <select
            className={inputClass}
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(event.target.value as "asc" | "desc");
              setPage(1);
            }}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className={`${buttonClass} border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200`}
          >
            <RefreshCw size={16} />
            Reset filters
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Attribute List
          </h2>
          <span className="text-sm text-gray-500">
            {pagination.total} total attributes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3">Attribute</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Options</th>
                <th className="px-4 py-3">Settings</th>
                <th className="px-4 py-3">Sort</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    Loading attributes...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    No attributes found.
                  </td>
                </tr>
              ) : (
                items.map((attribute) => (
                  <tr key={attribute._id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {attribute.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {attribute.slug}
                      </p>
                      {attribute.description && (
                        <p className="mt-1 max-w-xs truncate text-xs text-gray-400">
                          {attribute.description}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {attribute.type}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {attribute.options.length
                        ? attribute.options.slice(0, 3).join(", ") +
                          (attribute.options.length > 3
                            ? ` +${attribute.options.length - 3}`
                            : "")
                        : "—"}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex max-w-xs flex-wrap gap-1">
                        {attribute.isRequired && (
                          <span className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">
                            Required
                          </span>
                        )}
                        {attribute.isVariant && (
                          <span className="rounded bg-purple-50 px-2 py-1 text-xs text-purple-700">
                            Variant
                          </span>
                        )}
                        {attribute.isFilterable && (
                          <span className="rounded bg-green-50 px-2 py-1 text-xs text-green-700">
                            Filterable
                          </span>
                        )}
                        {attribute.isSearchable && (
                          <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                            Searchable
                          </span>
                        )}
                        {!attribute.isRequired &&
                          !attribute.isVariant &&
                          !attribute.isFilterable &&
                          !attribute.isSearchable &&
                          "—"}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        disabled={busyId === attribute._id}
                        onClick={() => void changeSortOrder(attribute)}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {attribute.sortOrder}
                      </button>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          attribute.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {attribute.status}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/attributes/${attribute._id}`}
                          title="Edit attribute"
                          className="rounded-lg border border-gray-200 p-2 text-blue-600 hover:bg-blue-50 dark:border-gray-700"
                        >
                          <Edit size={16} />
                        </Link>

                        <button
                          type="button"
                          title="Change status"
                          disabled={busyId === attribute._id}
                          onClick={() => void toggleStatus(attribute)}
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200"
                        >
                          {attribute.status === "ACTIVE"
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          type="button"
                          title="Delete attribute"
                          disabled={busyId === attribute._id}
                          onClick={() => void deleteAttribute(attribute)}
                          className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-800">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {Math.max(1, pagination.totalPages)}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              className={`${buttonClass} border border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-200`}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <button
              type="button"
              disabled={
                loading ||
                page >= Math.max(1, pagination.totalPages)
              }
              onClick={() => setPage((current) => current + 1)}
              className={`${buttonClass} border border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-200`}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
