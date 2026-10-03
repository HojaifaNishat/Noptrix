"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import Link from "next/link";

import {
    categoriesAdminApi,
} from "@/services/api/categories-admin.api";

import type {
    Category,
    CategoryListParams,
    CategoryStatus,
} from "@/features/categories/category.types";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const STATUS_OPTIONS: Array<
    "ALL" | CategoryStatus
> = [
    "ALL",
    "ACTIVE",
    "INACTIVE",
    "ARCHIVED",
];


const getErrorMessage = (
    error: unknown,
): string => {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error
    ) {
        const response = (
            error as {
                response?: {
                    data?: {
                        message?: string;
                    };
                };
            }
        ).response;

        return (
            response?.data?.message ??
            "Something went wrong."
        );
    }

    if (
        error instanceof Error
    ) {
        return error.message;
    }

    return "Something went wrong.";
};


/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function AdminCategoriesPage() {
    const [
        categories,
        setCategories,
    ] = useState<Category[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState<string | null>(
        null,
    );

    const [
        search,
        setSearch,
    ] = useState("");

    const [
        status,
        setStatus,
    ] = useState<
        "ALL" | CategoryStatus
    >("ALL");

    const [
        featured,
        setFeatured,
    ] = useState<
        "ALL" | "true" | "false"
    >("ALL");

    const [
        page,
        setPage,
    ] = useState(1);

    const [
        totalPages,
        setTotalPages,
    ] = useState(1);

    const [
        total,
        setTotal,
    ] = useState(0);


    /*
    |--------------------------------------------------------------------------
    | Load Categories
    |--------------------------------------------------------------------------
    */

    const loadCategories =
        useCallback(
            async () => {
                try {
                    setLoading(true);
                    setError(null);

                    const trimmedSearch =
                        search.trim();

                    const params: CategoryListParams =
                        {
                            page,
                            limit: 20,
                            sortBy:
                                "sortOrder",
                            sortOrder:
                                "asc",

                            ...(trimmedSearch
                                ? {
                                      search:
                                          trimmedSearch,
                                  }
                                : {}),

                            ...(status !==
                            "ALL"
                                ? {
                                      status,
                                  }
                                : {}),

                            ...(featured !==
                            "ALL"
                                ? {
                                      isFeatured:
                                          featured ===
                                          "true",
                                  }
                                : {}),
                        };

                    const result =
                        await categoriesAdminApi.getAll(
                            params,
                        );

                    setCategories(
                        result.items,
                    );

                    setTotalPages(
                        result.pagination
                            .totalPages,
                    );

                    setTotal(
                        result.pagination
                            .total,
                    );
                } catch (
                    requestError
                ) {
                    setError(
                        getErrorMessage(
                            requestError,
                        ),
                    );
                } finally {
                    setLoading(false);
                }
            },
            [
                page,
                search,
                status,
                featured,
            ],
        );


    useEffect(() => {
        void loadCategories();
    }, [
        loadCategories,
    ]);


    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    const handleSearch =
        () => {
            setPage(1);
        };


    /*
    |--------------------------------------------------------------------------
    | Status Badge
    |--------------------------------------------------------------------------
    */

    const statusClass = (
        value: CategoryStatus,
    ): string => {
        switch (value) {
            case "ACTIVE":
                return "bg-green-100 text-green-700";

            case "INACTIVE":
                return "bg-gray-100 text-gray-700";

            case "ARCHIVED":
                return "bg-yellow-100 text-yellow-700";

            default:
                return "bg-gray-100 text-gray-700";
        }
    };


    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Categories
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Manage product categories,
                        visibility and ordering.
                    </p>
                </div>

                <Link
                    href="/admin/categories/new"
                    className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                    + Add Category
                </Link>
            </div>


            {/* Filters */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <label
                            htmlFor="category-search"
                            className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                            Search
                        </label>

                        <div className="flex gap-2">
                            <input
                                id="category-search"
                                type="search"
                                value={search}
                                onChange={(
                                    event,
                                ) =>
                                    setSearch(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                onKeyDown={(
                                    event,
                                ) => {
                                    if (
                                        event.key ===
                                        "Enter"
                                    ) {
                                        handleSearch();
                                    }
                                }}
                                placeholder="Search categories..."
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                            />

                            <button
                                type="button"
                                onClick={
                                    handleSearch
                                }
                                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                            >
                                Search
                            </button>
                        </div>
                    </div>


                    <div>
                        <label
                            htmlFor="category-status"
                            className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                            Status
                        </label>

                        <select
                            id="category-status"
                            value={status}
                            onChange={(
                                event,
                            ) => {
                                setStatus(
                                    event
                                        .target
                                        .value as
                                        | "ALL"
                                        | CategoryStatus,
                                );

                                setPage(1);
                            }}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                        >
                            {STATUS_OPTIONS.map(
                                (
                                    option,
                                ) => (
                                    <option
                                        key={
                                            option
                                        }
                                        value={
                                            option
                                        }
                                    >
                                        {option ===
                                        "ALL"
                                            ? "All statuses"
                                            : option}
                                    </option>
                                ),
                            )}
                        </select>
                    </div>


                    <div>
                        <label
                            htmlFor="category-featured"
                            className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                            Featured
                        </label>

                        <select
                            id="category-featured"
                            value={
                                featured
                            }
                            onChange={(
                                event,
                            ) => {
                                setFeatured(
                                    event
                                        .target
                                        .value as
                                        | "ALL"
                                        | "true"
                                        | "false",
                                );

                                setPage(1);
                            }}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                        >
                            <option value="ALL">
                                All
                            </option>

                            <option value="true">
                                Featured
                            </option>

                            <option value="false">
                                Not featured
                            </option>
                        </select>
                    </div>
                </div>
            </div>


            {/* Error */}
            {error && (
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            void loadCategories()
                        }
                        className="font-semibold underline"
                    >
                        Retry
                    </button>
                </div>
            )}


            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Category
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Status
                                </th>

                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Featured
                                </th>

                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Order
                                </th>

                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={
                                            5
                                        }
                                        className="px-4 py-12 text-center text-sm text-gray-500"
                                    >
                                        Loading categories...
                                    </td>
                                </tr>
                            ) : categories.length ===
                              0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            5
                                        }
                                        className="px-4 py-12 text-center text-sm text-gray-500"
                                    >
                                        No categories found.
                                    </td>
                                </tr>
                            ) : (
                                categories.map(
                                    (
                                        category,
                                    ) => (
                                        <tr
                                            key={
                                                category._id
                                            }
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    {category
                                                        .image
                                                        ?.secureUrl ? (
                                                        <img
                                                            src={
                                                                category
                                                                    .image
                                                                    .secureUrl
                                                            }
                                                            alt={
                                                                category.name
                                                            }
                                                            className="h-12 w-12 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                                                            No image
                                                        </div>
                                                    )}

                                                    <div>
                                                        <p className="font-semibold text-gray-900">
                                                            {
                                                                category.name
                                                            }
                                                        </p>

                                                        <p className="text-xs text-gray-500">
                                                            /
                                                            {
                                                                category.slug
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                                                        category.status,
                                                    )}`}
                                                >
                                                    {
                                                        category.status
                                                    }
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 text-center text-sm">
                                                {category.isFeatured
                                                    ? "Yes"
                                                    : "No"}
                                            </td>

                                            <td className="px-4 py-4 text-center text-sm text-gray-700">
                                                {
                                                    category.sortOrder
                                                }
                                            </td>

                                            <td className="px-4 py-4 text-right">
                                                <Link
                                                    href={`/admin/categories/${category._id}`}
                                                    className="text-sm font-semibold text-gray-900 underline"
                                                >
                                                    Edit
                                                </Link>
                                            </td>
                                        </tr>
                                    ),
                                )
                            )}
                        </tbody>
                    </table>
                </div>


                {/* Pagination */}
                <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-500">
                        {total}{" "}
                        {total ===
                        1
                            ? "category"
                            : "categories"}
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={
                                page <=
                                1 ||
                                loading
                            }
                            onClick={() =>
                                setPage(
                                    (
                                        current,
                                    ) =>
                                        Math.max(
                                            1,
                                            current -
                                                1,
                                        ),
                                )
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Previous
                        </button>

                        <span className="px-2 text-sm text-gray-600">
                            Page{" "}
                            {page}{" "}
                            of{" "}
                            {totalPages}
                        </span>

                        <button
                            type="button"
                            disabled={
                                page >=
                                    totalPages ||
                                loading
                            }
                            onClick={() =>
                                setPage(
                                    (
                                        current,
                                    ) =>
                                        Math.min(
                                            totalPages,
                                            current +
                                                1,
                                        ),
                                )
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
