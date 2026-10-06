"use client";

import {
    FormEvent,
    useState,
} from "react";

import Link from "next/link";

import {
    categoriesAdminApi,
} from "@/services/api/categories-admin.api";

import ImageUploader from "@/components/common/ImageUploader";

import {
    CATEGORY_STATUSES,
    type CategoryStatus,
    type CreateCategoryInput,
} from "@/features/categories/category.types";


/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function NewCategoryPage() {
    const [
        name,
        setName,
    ] = useState("");

    const [
        slug,
        setSlug,
    ] = useState("");

    const [
        description,
        setDescription,
    ] = useState("");

    const [
        status,
        setStatus,
    ] = useState<CategoryStatus>(
        CATEGORY_STATUSES.ACTIVE,
    );

    const [
        isFeatured,
        setIsFeatured,
    ] = useState(false);

    const [
        sortOrder,
        setSortOrder,
    ] = useState("0");

    const [
        seoTitle,
        setSeoTitle,
    ] = useState("");

    const [
        seoDescription,
        setSeoDescription,
    ] = useState("");

    const [
        seoKeywords,
        setSeoKeywords,
    ] = useState("");

    const [
        image,
        setImage,
    ] = useState<File | null>(
        null,
    );

    const [
        imagePreview,
        setImagePreview,
    ] = useState<string | null>(
        null,
    );

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(
        null,
    );





    /*
    |--------------------------------------------------------------------------
    | Slug
    |--------------------------------------------------------------------------
    */

    const handleNameChange =
        (
            value: string,
        ) => {
            setName(value);

            if (!slug) {
                setSlug(
                    value
                        .toLowerCase()
                        .trim()
                        .replace(
                            /[^a-z0-9]+/g,
                            "-",
                        )
                        .replace(
                            /^-+|-+$/g,
                            "",
                        ),
                );
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Submit
    |--------------------------------------------------------------------------
    */

    const handleSubmit =
        async (
            event: FormEvent<HTMLFormElement>,
        ) => {
            event.preventDefault();

            try {
                setSubmitting(true);
                setError(null);

                const keywordList =
                    seoKeywords
                        .split(",")
                        .map(
                            (keyword) =>
                                keyword.trim(),
                        )
                        .filter(
                            Boolean,
                        );

                const input: CreateCategoryInput =
                    {
                        name:
                            name.trim(),

                        slug:
                            slug.trim() ||
                            undefined,

                        description:
                            description.trim() ||
                            undefined,

                        status,

                        isFeatured,

                        sortOrder:
                            Number(
                                sortOrder,
                            ),

                        seo:
                            seoTitle.trim() ||
                            seoDescription.trim() ||
                            keywordList.length >
                                0
                                ? {
                                      title:
                                          seoTitle.trim() ||
                                          undefined,

                                      description:
                                          seoDescription.trim() ||
                                          undefined,

                                      keywords:
                                          keywordList.length >
                                          0
                                              ? keywordList
                                              : undefined,
                                  }
                                : undefined,

                        image,
                    };

                await categoriesAdminApi.create(
                    input,
                );

                window.location.href =
                    "/admin/categories";
            } catch (
                requestError
            ) {
                if (
                    typeof requestError ===
                        "object" &&
                    requestError !== null &&
                    "response" in
                        requestError
                ) {
                    const response = (
                        requestError as {
                            response?: {
                                data?: {
                                    message?: string;
                                };
                            };
                        }
                    ).response;

                    setError(
                        response?.data
                            ?.message ??
                            "Failed to create category.",
                    );
                } else {
                    setError(
                        requestError instanceof
                            Error
                            ? requestError.message
                            : "Failed to create category.",
                    );
                }
            } finally {
                setSubmitting(false);
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <div className="mx-auto max-w-5xl space-y-6 p-6 text-black">
            {/* Header */}
            <div>
                <Link
                    href="/admin/categories"
                    className="text-sm text-gray-500 hover:text-gray-900"
                >
                    ← Back to Categories
                </Link>

                <h1 className="mt-3 text-2xl font-bold text-gray-900">
                    Add Category
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Create a new product category.
                </p>
            </div>


            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}


            <form
                onSubmit={
                    handleSubmit
                }
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
                                htmlFor="category-name"
                                className="mb-1.5 block text-sm font-medium text-black"
                            >
                                Name *
                            </label>

                            <input
                                id="category-name"
                                required
                                minLength={
                                    2
                                }
                                maxLength={
                                    120
                                }
                                value={
                                    name
                                }
                                onChange={(
                                    event,
                                ) =>
                                    handleNameChange(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black outline-none focus:border-black"
                                placeholder="Electronics"
                            />
                        </div>


                        <div>
                            <label
                                htmlFor="category-slug"
                                className="mb-1.5 block text-sm font-medium text-black"
                            >
                                Slug
                            </label>

                            <input
                                id="category-slug"
                                value={
                                    slug
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setSlug(
                                        event
                                            .target
                                            .value
                                            .toLowerCase(),
                                    )
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black outline-none focus:border-black"
                                placeholder="electronics"
                            />
                        </div>


                        <div className="md:col-span-2">
                            <label
                                htmlFor="category-description"
                                className="mb-1.5 block text-sm font-medium text-black"
                            >
                                Description
                            </label>

                            <textarea
                                id="category-description"
                                rows={
                                    4
                                }
                                maxLength={
                                    2000
                                }
                                value={
                                    description
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setDescription(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black outline-none focus:border-black"
                                placeholder="Describe this category..."
                            />
                        </div>
                    </div>
                </section>


                {/* Image */}
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <ImageUploader
                        value={image}
                        previewUrl={imagePreview}
                        onChange={(
                            file,
                        ) => {
                            setImage(file);

                            if (!file) {
                                setImagePreview(
                                    null,
                                );
                            }
                        }}
                        label="Category Image"
                        description="Upload a category image. The image will be stored securely through Cloudinary."
                        maxSizeMB={10}
                        disabled={
                            submitting
                        }
                    />
                </section>


                {/* Publishing */}
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Publishing
                    </h2>

                    <div className="mt-5 grid gap-5 md:grid-cols-3">
                        <div>
                            <label
                                htmlFor="category-status"
                                className="mb-1.5 block text-sm font-medium text-black"
                            >
                                Status
                            </label>

                            <select
                                id="category-status"
                                value={
                                    status
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setStatus(
                                        event
                                            .target
                                            .value as CategoryStatus,
                                    )
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black outline-none focus:border-black"
                            >
                                <option value="ACTIVE">
                                    Active
                                </option>

                                <option value="INACTIVE">
                                    Inactive
                                </option>

                                <option value="ARCHIVED">
                                    Archived
                                </option>
                            </select>
                        </div>


                        <div>
                            <label
                                htmlFor="category-sort-order"
                                className="mb-1.5 block text-sm font-medium text-black"
                            >
                                Sort Order
                            </label>

                            <input
                                id="category-sort-order"
                                type="number"
                                min="0"
                                max="1000000"
                                step="1"
                                value={
                                    sortOrder
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setSortOrder(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black outline-none focus:border-black"
                            />
                        </div>


                        <label className="flex items-center gap-3 self-end pb-2">
                            <input
                                type="checkbox"
                                checked={
                                    isFeatured
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setIsFeatured(
                                        event
                                            .target
                                            .checked,
                                    )
                                }
                                className="h-4 w-4"
                            />

                            <span className="text-sm font-medium text-black">
                                Featured category
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
                                htmlFor="seo-title"
                                className="mb-1.5 block text-sm font-medium text-black"
                            >
                                SEO Title
                            </label>

                            <input
                                id="seo-title"
                                maxLength={
                                    70
                                }
                                value={
                                    seoTitle
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setSeoTitle(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black outline-none focus:border-black"
                            />
                        </div>


                        <div>
                            <label
                                htmlFor="seo-description"
                                className="mb-1.5 block text-sm font-medium text-black"
                            >
                                SEO Description
                            </label>

                            <textarea
                                id="seo-description"
                                rows={
                                    3
                                }
                                maxLength={
                                    320
                                }
                                value={
                                    seoDescription
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setSeoDescription(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black outline-none focus:border-black"
                            />
                        </div>


                        <div>
                            <label
                                htmlFor="seo-keywords"
                                className="mb-1.5 block text-sm font-medium text-black"
                            >
                                Keywords
                            </label>

                            <input
                                id="seo-keywords"
                                value={
                                    seoKeywords
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setSeoKeywords(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black outline-none focus:border-black"
                                placeholder="phone, smartphone, mobile"
                            />

                            <p className="mt-1.5 text-xs text-gray-500">
                                Separate keywords with commas.
                            </p>
                        </div>
                    </div>
                </section>


                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Link
                        href="/admin/categories"
                        className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={
                            submitting
                        }
                        className="rounded-lg bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting
                            ? "Creating..."
                            : "Create Category"}
                    </button>
                </div>
            </form>
        </div>
    );
}
