"use client";

import {
    useCallback,
    useEffect,
    useState,
    type FormEvent,
} from "react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { subcategoriesAdminApi } from "@/services/api/subcategories-admin.api";
import { categoriesAdminApi } from "@/services/api/categories-admin.api";

import type { Category } from "@/features/categories/category.types";

import type {
    Subcategory,
    SubcategoryStatus,
    UpdateSubcategoryInput,
} from "@/features/subcategories/subcategory.types";

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Something went wrong.";
}

function createSlug(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function getCategoryId(item: Subcategory): string {
    return typeof item.categoryId === "object"
        ? item.categoryId._id
        : item.categoryId;
}

export default function EditSubcategoryPage() {
    const params = useParams<{ subcategoryId: string }>();
    const router = useRouter();

    const subcategoryId = params.subcategoryId;

    const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);

    const [categoryId, setCategoryId] = useState("");
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<SubcategoryStatus>("ACTIVE");
    const [isFeatured, setIsFeatured] = useState(false);
    const [sortOrder, setSortOrder] = useState("0");

    const [seoTitle, setSeoTitle] = useState("");
    const [seoDescription, setSeoDescription] = useState("");
    const [seoKeywords, setSeoKeywords] = useState("");

    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState("");
    const [removeImage, setRemoveImage] = useState(false);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [item, categoryResult] = await Promise.all([
                subcategoriesAdminApi.getById(subcategoryId),
                categoriesAdminApi.getAll({
                    page: 1,
                    limit: 100,
                    sortBy: "name",
                    sortOrder: "asc",
                }),
            ]);

            setSubcategory(item);
            setCategories(categoryResult.items);

            setCategoryId(getCategoryId(item));
            setName(item.name);
            setSlug(item.slug);
            setDescription(item.description ?? "");
            setStatus(item.status);
            setIsFeatured(item.isFeatured);
            setSortOrder(String(item.sortOrder));

            setSeoTitle(item.seo?.title ?? "");
            setSeoDescription(item.seo?.description ?? "");
            setSeoKeywords(item.seo?.keywords?.join(", ") ?? "");

            setImagePreview(item.image?.secureUrl ?? "");
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [subcategoryId]);

    useEffect(() => {
        void Promise.resolve().then(loadData);
    }, [loadData]);

    useEffect(() => {
        return () => {
            if (imagePreview.startsWith("blob:")) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleImageChange = (file: File | null) => {
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select a valid image.");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError("Image must be smaller than 10 MB.");
            return;
        }

        setError("");
        setImage(file);
        setRemoveImage(false);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        setImage(null);
        setImagePreview("");
        setRemoveImage(true);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        if (!categoryId || !name.trim()) {
            setError("Category and subcategory name are required.");
            return;
        }

        const parsedSortOrder = Number(sortOrder);

        if (!Number.isInteger(parsedSortOrder) || parsedSortOrder < 0) {
            setError("Sort order must be a non-negative integer.");
            return;
        }

        const seo = {
            ...(seoTitle.trim() ? { title: seoTitle.trim() } : {}),
            ...(seoDescription.trim() ? { description: seoDescription.trim() } : {}),
            ...(seoKeywords.trim()
                ? {
                    keywords: seoKeywords
                        .split(",")
                        .map((keyword) => keyword.trim())
                        .filter(Boolean),
                }
                : {}),
        };

        const input: UpdateSubcategoryInput = {
            categoryId,
            name: name.trim(),
            slug: slug.trim() || createSlug(name),
            description: description.trim(),
            status,
            isFeatured,
            sortOrder: parsedSortOrder,
            seo,
            image,
            ...(removeImage ? { removeImage: true } : {}),
        };

        setSaving(true);

        try {
            const updated = await subcategoriesAdminApi.update(
                subcategoryId,
                input,
            );

            setSubcategory(updated);
            router.push("/admin/subcategories");
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!subcategory) return;

        if (!window.confirm(
            `Delete "${subcategory.name}"? This action cannot be undone.`,
        )) {
            return;
        }

        setDeleting(true);
        setError("");

        try {
            await subcategoriesAdminApi.delete(subcategoryId);
            router.push("/admin/subcategories");
        } catch (err) {
            setError(getErrorMessage(err));
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 text-sm text-gray-500">
                Loading subcategory...
            </div>
        );
    }

    if (!subcategory) {
        return (
            <div className="space-y-4 p-6">
                <p className="text-red-600">
                    {error || "Subcategory not found."}
                </p>

                <button
                    type="button"
                    onClick={() => void loadData()}
                    className="rounded-lg border px-4 py-2 text-sm"
                >
                    Retry
                </button>

                <Link
                    href="/admin/subcategories"
                    className="ml-3 text-sm text-blue-600"
                >
                    Back to Subcategories
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <Link
                        href="/admin/subcategories"
                        className="text-sm text-gray-500 hover:text-gray-900"
                    >
                        ← Back to Subcategories
                    </Link>

                    <h1 className="mt-3 text-2xl font-bold text-gray-900">
                        Edit Subcategory
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Update {subcategory.name}.
                    </p>
                </div>

                <button
                    type="button"
                    disabled={deleting}
                    onClick={() => void handleDelete()}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                    {deleting ? "Deleting..." : "Delete Subcategory"}
                </button>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <section className="space-y-4 rounded-xl border bg-white p-6">
                    <h2 className="font-semibold text-gray-900">Basic information</h2>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Parent category *
                        </label>

                        <select
                            required
                            value={categoryId}
                            onChange={(event) => setCategoryId(event.target.value)}
                            className="w-full rounded-lg border px-3 py-2"
                        >
                            <option value="">Select category</option>

                            {categories.map((category) => (
                                <option key={category._id} value={category._id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Subcategory name *
                        </label>
                        <input
                            required
                            value={name}
                            onChange={(event) => {
                                setName(event.target.value);

                                if (!slugManuallyEdited) {
                                    setSlug(createSlug(event.target.value));
                                }
                            }}
                            className="w-full rounded-lg border px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">Slug</label>
                        <input
                            value={slug}
                            onChange={(event) => {
                                setSlug(event.target.value);
                                setSlugManuallyEdited(true);
                            }}
                            className="w-full rounded-lg border px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Description
                        </label>
                        <textarea
                            rows={4}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            className="w-full rounded-lg border px-3 py-2"
                        />
                    </div>
                </section>

                <section className="space-y-4 rounded-xl border bg-white p-6">
                    <h2 className="font-semibold text-gray-900">Subcategory image</h2>

                    {imagePreview && (
                        <img
                            src={imagePreview}
                            alt={name}
                            className="h-40 w-40 rounded-lg border object-cover"
                        />
                    )}

                    <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleImageChange(
                            event.target.files?.[0] ?? null,
                        )}
                        className="block w-full text-sm"
                    />

                    {imagePreview && (
                        <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="text-sm text-red-600 hover:underline"
                        >
                            Remove image
                        </button>
                    )}

                    {removeImage && (
                        <p className="text-xs text-amber-700">
                            Current image will be removed when you save.
                        </p>
                    )}
                </section>

                <section className="space-y-4 rounded-xl border bg-white p-6">
                    <h2 className="font-semibold text-gray-900">Display settings</h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium">Status</label>
                            <select
                                value={status}
                                onChange={(event) => setStatus(
                                    event.target.value as SubcategoryStatus,
                                )}
                                className="w-full rounded-lg border px-3 py-2"
                            >
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="INACTIVE">INACTIVE</option>
                                <option value="ARCHIVED">ARCHIVED</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Sort order
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={sortOrder}
                                onChange={(event) => setSortOrder(event.target.value)}
                                className="w-full rounded-lg border px-3 py-2"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-3 text-sm">
                        <input
                            type="checkbox"
                            checked={isFeatured}
                            onChange={(event) => setIsFeatured(event.target.checked)}
                            className="h-4 w-4"
                        />
                        Mark as featured
                    </label>
                </section>

                <section className="space-y-4 rounded-xl border bg-white p-6">
                    <h2 className="font-semibold text-gray-900">SEO settings</h2>

                    <div>
                        <label className="mb-2 block text-sm font-medium">SEO title</label>
                        <input
                            value={seoTitle}
                            onChange={(event) => setSeoTitle(event.target.value)}
                            className="w-full rounded-lg border px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            SEO description
                        </label>
                        <textarea
                            rows={3}
                            value={seoDescription}
                            onChange={(event) => setSeoDescription(event.target.value)}
                            className="w-full rounded-lg border px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            SEO keywords
                        </label>
                        <input
                            value={seoKeywords}
                            onChange={(event) => setSeoKeywords(event.target.value)}
                            placeholder="phone, mobile, smartphone"
                            className="w-full rounded-lg border px-3 py-2"
                        />
                    </div>
                </section>

                <div className="flex flex-wrap justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => void handleDelete()}
                        disabled={deleting || saving}
                        className="rounded-lg border border-red-200 px-5 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                        Delete
                    </button>

                    <div className="flex gap-3">
                        <Link
                            href="/admin/subcategories"
                            className="rounded-lg border px-5 py-3 text-sm font-medium hover:bg-gray-50"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={saving || deleting}
                            className="rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
