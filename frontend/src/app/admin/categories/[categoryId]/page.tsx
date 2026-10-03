"use client";

import {
    ChangeEvent,
    FormEvent,
    useEffect,
    useState,
} from "react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
    categoriesAdminApi,
} from "@/services/api/categories-admin.api";

import {
    CATEGORY_STATUSES,
    type Category,
    type CategoryStatus,
    type UpdateCategoryInput,
} from "@/features/categories/category.types";

export default function EditCategoryPage() {
    const params = useParams();
    const router = useRouter();

    const categoryId =
        typeof params.categoryId === "string"
            ? params.categoryId
            : "";

    const [category, setCategory] =
        useState<Category | null>(null);

    const [name, setName] =
        useState("");

    const [slug, setSlug] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [status, setStatus] =
        useState<CategoryStatus>(
            CATEGORY_STATUSES.ACTIVE,
        );

    const [isFeatured, setIsFeatured] =
        useState(false);

    const [sortOrder, setSortOrder] =
        useState("0");

    const [seoTitle, setSeoTitle] =
        useState("");

    const [seoDescription, setSeoDescription] =
        useState("");

    const [seoKeywords, setSeoKeywords] =
        useState("");

    const [image, setImage] =
        useState<File | null>(null);

    const [imagePreview, setImagePreview] =
        useState<string | null>(null);

    const [removeImage, setRemoveImage] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [deleting, setDeleting] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [success, setSuccess] =
        useState<string | null>(null);

    /*
    |--------------------------------------------------------------------------
    | Load Category
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!categoryId) {
            setError(
                "Invalid category ID.",
            );

            setLoading(false);

            return;
        }

        let mounted = true;

        const loadCategory =
            async (): Promise<void> => {
                try {
                    setLoading(true);
                    setError(null);

                    const result =
                        await categoriesAdminApi.getById(
                            categoryId,
                        );

                    if (!mounted) {
                        return;
                    }

                    const data =
                        result;

                    setCategory(data);

                    setName(
                        data.name ?? "",
                    );

                    setSlug(
                        data.slug ?? "",
                    );

                    setDescription(
                        data.description ?? "",
                    );

                    setStatus(
                        data.status,
                    );

                    setIsFeatured(
                        data.isFeatured,
                    );

                    setSortOrder(
                        String(
                            data.sortOrder ?? 0,
                        ),
                    );

                    setSeoTitle(
                        data.seo?.title ?? "",
                    );

                    setSeoDescription(
                        data.seo?.description ?? "",
                    );

                    setSeoKeywords(
                        data.seo?.keywords?.join(
                            ", ",
                        ) ?? "",
                    );

                    if (data.image?.secureUrl) {
                        setImagePreview(
                            data.image.secureUrl,
                        );
                    }
                } catch (requestError) {
                    if (!mounted) {
                        return;
                    }

                    const axiosError =
                        requestError as {
                            response?: {
                                data?: {
                                    message?: string;
                                };
                            };
                            message?: string;
                        };

                    setError(
                        axiosError.response?.data?.message ??
                            axiosError.message ??
                            "Failed to load category.",
                    );
                } finally {
                    if (mounted) {
                        setLoading(false);
                    }
                }
            };

        void loadCategory();

        return () => {
            mounted = false;
        };
    }, [categoryId]);

    /*
    |--------------------------------------------------------------------------
    | Image Change
    |--------------------------------------------------------------------------
    */

    const handleImageChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const file =
            event.target.files?.[0] ??
            null;

        setImage(file);
        setRemoveImage(false);

        if (imagePreview?.startsWith("blob:")) {
            URL.revokeObjectURL(
                imagePreview,
            );
        }

        if (file) {
            setImagePreview(
                URL.createObjectURL(file),
            );
        } else {
            setImagePreview(
                category?.image?.secureUrl ??
                    null,
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Remove Existing Image
    |--------------------------------------------------------------------------
    */

    const handleRemoveImage = (): void => {
        setImage(null);

        if (imagePreview?.startsWith("blob:")) {
            URL.revokeObjectURL(
                imagePreview,
            );
        }

        setImagePreview(null);

        setRemoveImage(true);
    };

    /*
    |--------------------------------------------------------------------------
    | Slug
    |--------------------------------------------------------------------------
    */

    const handleSlugChange = (
        value: string,
    ): void => {
        setSlug(
            value
                .toLowerCase()
                .trim()
                .replace(
                    /[^a-z0-9-]+/g,
                    "-",
                )
                .replace(
                    /^-+|-+$/g,
                    "",
                ),
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Submit
    |--------------------------------------------------------------------------
    */

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        event.preventDefault();

        try {
            setSubmitting(true);
            setError(null);
            setSuccess(null);

            const keywordList =
                seoKeywords
                    .split(",")
                    .map(
                        (keyword) =>
                            keyword.trim(),
                    )
                    .filter(Boolean);

            const hasSeo =
                seoTitle.trim() ||
                seoDescription.trim() ||
                keywordList.length > 0;

            const input: UpdateCategoryInput =
                {
                    name:
                        name.trim(),

                    slug:
                        slug.trim(),

                    description:
                        description.trim(),

                    status,

                    isFeatured,

                    sortOrder:
                        Number(sortOrder),

                    seo: hasSeo
                        ? {
                              title:
                                  seoTitle.trim() ||
                                  undefined,

                              description:
                                  seoDescription.trim() ||
                                  undefined,

                              keywords:
                                  keywordList.length > 0
                                      ? keywordList
                                      : undefined,
                          }
                        : undefined,

                    image,

                    removeImage:
                        removeImage,
                };

            await categoriesAdminApi.update(
                categoryId,
                input,
            );

            setSuccess(
                "Category updated successfully.",
            );

            /*
            | Reload fresh database state
            */

            const refreshed =
                await categoriesAdminApi.getById(
                    categoryId,
                );

            const updated =
                refreshed;

            setCategory(updated);

            setName(
                updated.name,
            );

            setSlug(
                updated.slug,
            );

            setDescription(
                updated.description ?? "",
            );

            setStatus(
                updated.status,
            );

            setIsFeatured(
                updated.isFeatured,
            );

            setSortOrder(
                String(
                    updated.sortOrder,
                ),
            );

            setSeoTitle(
                updated.seo?.title ?? "",
            );

            setSeoDescription(
                updated.seo?.description ?? "",
            );

            setSeoKeywords(
                updated.seo?.keywords?.join(
                    ", ",
                ) ?? "",
            );

            setImage(null);
            setRemoveImage(false);

            if (imagePreview?.startsWith("blob:")) {
                URL.revokeObjectURL(
                    imagePreview,
                );
            }

            setImagePreview(
                updated.image?.secureUrl ??
                    null,
            );
        } catch (requestError) {
            const axiosError =
                requestError as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                    message?: string;
                };

            setError(
                axiosError.response?.data?.message ??
                    axiosError.message ??
                    "Failed to update category.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */

    const handleDelete = async (): Promise<void> => {
        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${name}"? This action cannot be undone.`,
            );

        if (!confirmed) {
            return;
        }

        try {
            setDeleting(true);
            setError(null);
            setSuccess(null);

            await categoriesAdminApi.delete(
                categoryId,
            );

            router.push(
                "/admin/categories",
            );
        } catch (requestError) {
            const axiosError =
                requestError as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                    message?: string;
                };

            setError(
                axiosError.response?.data?.message ??
                    axiosError.message ??
                    "Failed to delete category.",
            );

            setDeleting(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Loading
    |--------------------------------------------------------------------------
    */

    if (loading) {
        return (
            <main className="p-6">
                <div className="mx-auto max-w-5xl">
                    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                        <p className="text-sm text-gray-500">
                            Loading category...
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Error Without Category
    |--------------------------------------------------------------------------
    */

    if (!category) {
        return (
            <main className="p-6">
                <div className="mx-auto max-w-5xl">
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                        <h1 className="text-lg font-semibold text-red-800">
                            Category unavailable
                        </h1>

                        <p className="mt-2 text-sm text-red-700">
                            {error ??
                                "Category could not be loaded."}
                        </p>

                        <Link
                            href="/admin/categories"
                            className="mt-5 inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                        >
                            Back to Categories
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Page
    |--------------------------------------------------------------------------
    */

    return (
        <main className="p-6">
            <div className="mx-auto max-w-5xl">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-2">
                            <Link
                                href="/admin/categories"
                                className="text-sm text-gray-500 hover:text-gray-900"
                            >
                                ← Back to Categories
                            </Link>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900">
                            Edit Category
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Update category information,
                            image, SEO and visibility.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={
                            deleting ||
                            submitting
                        }
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {deleting
                            ? "Deleting..."
                            : "Delete Category"}
                    </button>
                </div>

                {error && (
                    <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {success}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    {/* Basic Information */}

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Basic Information
                        </h2>

                        <div className="mt-5 grid gap-5 md:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Name
                                </label>

                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(event) =>
                                        setName(
                                            event.target.value,
                                        )
                                    }
                                    required
                                    maxLength={120}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="slug"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Slug
                                </label>

                                <input
                                    id="slug"
                                    type="text"
                                    value={slug}
                                    onChange={(event) =>
                                        handleSlugChange(
                                            event.target.value,
                                        )
                                    }
                                    required
                                    maxLength={160}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                />

                                <p className="mt-1 text-xs text-gray-500">
                                    Lowercase letters,
                                    numbers and hyphens only.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5">
                            <label
                                htmlFor="description"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Description
                            </label>

                            <textarea
                                id="description"
                                value={description}
                                onChange={(event) =>
                                    setDescription(
                                        event.target.value,
                                    )
                                }
                                maxLength={2000}
                                rows={5}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                            />

                            <p className="mt-1 text-right text-xs text-gray-500">
                                {description.length}/2000
                            </p>
                        </div>
                    </section>

                    {/* Image */}

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Category Image
                        </h2>

                        <div className="mt-5 grid gap-6 md:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="image"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Replace Image
                                </label>

                                <input
                                    id="image"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                                    onChange={
                                        handleImageChange
                                    }
                                    className="block w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-700 file:mr-4 file:border-0 file:bg-gray-100 file:px-4 file:py-2.5 file:text-sm file:font-medium"
                                />

                                <p className="mt-2 text-xs text-gray-500">
                                    Max size: 10MB.
                                </p>

                                {image && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImage(
                                                null,
                                            );

                                            if (
                                                imagePreview?.startsWith(
                                                    "blob:",
                                                )
                                            ) {
                                                URL.revokeObjectURL(
                                                    imagePreview,
                                                );
                                            }

                                            setImagePreview(
                                                category.image?.secureUrl ??
                                                    null,
                                            );
                                        }}
                                        className="mt-3 text-sm text-gray-600 underline hover:text-gray-900"
                                    >
                                        Cancel replacement
                                    </button>
                                )}
                            </div>

                            <div>
                                <p className="mb-2 text-sm font-medium text-gray-700">
                                    Current Image
                                </p>

                                {imagePreview ? (
                                    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                                        <img
                                            src={
                                                imagePreview
                                            }
                                            alt={
                                                name
                                            }
                                            className="h-56 w-full object-cover"
                                        />

                                        <button
                                            type="button"
                                            onClick={
                                                handleRemoveImage
                                            }
                                            className="absolute right-3 top-3 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white shadow hover:bg-red-700"
                                        >
                                            Remove Image
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
                                        No category image
                                    </div>
                                )}

                                {removeImage && (
                                    <p className="mt-2 text-sm text-red-600">
                                        Image will be removed
                                        when you save.
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Status */}

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Visibility & Ordering
                        </h2>

                        <div className="mt-5 grid gap-5 md:grid-cols-3">
                            <div>
                                <label
                                    htmlFor="status"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Status
                                </label>

                                <select
                                    id="status"
                                    value={status}
                                    onChange={(event) =>
                                        setStatus(
                                            event.target.value as CategoryStatus,
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                >
                                    <option
                                        value={
                                            CATEGORY_STATUSES.ACTIVE
                                        }
                                    >
                                        Active
                                    </option>

                                    <option
                                        value={
                                            CATEGORY_STATUSES.INACTIVE
                                        }
                                    >
                                        Inactive
                                    </option>

                                    <option
                                        value={
                                            CATEGORY_STATUSES.ARCHIVED
                                        }
                                    >
                                        Archived
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="sortOrder"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Sort Order
                                </label>

                                <input
                                    id="sortOrder"
                                    type="number"
                                    min={0}
                                    max={1000000}
                                    step={1}
                                    value={sortOrder}
                                    onChange={(event) =>
                                        setSortOrder(
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                />
                            </div>

                            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={
                                        isFeatured
                                    }
                                    onChange={(event) =>
                                        setIsFeatured(
                                            event.target.checked,
                                        )
                                    }
                                    className="h-4 w-4 rounded border-gray-300"
                                />

                                <span>
                                    <span className="block text-sm font-medium text-gray-800">
                                        Featured Category
                                    </span>

                                    <span className="block text-xs text-gray-500">
                                        Show this category
                                        as featured.
                                    </span>
                                </span>
                            </label>
                        </div>
                    </section>

                    {/* SEO */}

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">
                            SEO
                        </h2>

                        <div className="mt-5 space-y-5">
                            <div>
                                <label
                                    htmlFor="seoTitle"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    SEO Title
                                </label>

                                <input
                                    id="seoTitle"
                                    type="text"
                                    value={seoTitle}
                                    onChange={(event) =>
                                        setSeoTitle(
                                            event.target.value,
                                        )
                                    }
                                    maxLength={70}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="seoDescription"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    SEO Description
                                </label>

                                <textarea
                                    id="seoDescription"
                                    value={
                                        seoDescription
                                    }
                                    onChange={(event) =>
                                        setSeoDescription(
                                            event.target.value,
                                        )
                                    }
                                    maxLength={320}
                                    rows={4}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="seoKeywords"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    SEO Keywords
                                </label>

                                <input
                                    id="seoKeywords"
                                    type="text"
                                    value={seoKeywords}
                                    onChange={(event) =>
                                        setSeoKeywords(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="electronics, gadgets, technology"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                />

                                <p className="mt-1 text-xs text-gray-500">
                                    Separate keywords with
                                    commas. Maximum 20 keywords.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Actions */}

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Link
                            href="/admin/categories"
                            className="rounded-lg border border-gray-300 px-5 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={
                                submitting ||
                                deleting
                            }
                            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting
                                ? "Saving..."
                                : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}