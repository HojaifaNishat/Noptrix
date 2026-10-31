"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { subcategoriesAdminApi } from "@/services/api/subcategories-admin.api";
import { categoriesAdminApi } from "@/services/api/categories-admin.api";

import type { Category } from "@/features/categories/category.types";
import type {
    CreateSubcategoryInput,
    SubcategoryStatus,
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

export default function NewSubcategoryPage() {
    const router = useRouter();

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
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    const [loadingCategories, setLoadingCategories] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;

        categoriesAdminApi.getAll({
            page: 1,
            limit: 100,
            status: "ACTIVE",
            sortBy: "name",
            sortOrder: "asc",
        }).then((result) => {
            if (!mounted) return;

            setCategories(result.items);

            if (result.items.length > 0) {
                setCategoryId(result.items[0]._id);
            }
        }).catch((err: unknown) => {
            if (mounted) setError(getErrorMessage(err));
        }).finally(() => {
            if (mounted) setLoadingCategories(false);
        });

        return () => {
            mounted = false;
        };
    }, []);

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
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        if (!categoryId) {
            setError("Please select a category.");
            return;
        }

        if (!name.trim()) {
            setError("Subcategory name is required.");
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

        const input: CreateSubcategoryInput = {
            categoryId,
            name: name.trim(),
            slug: slug.trim() || createSlug(name),
            description: description.trim() || undefined,
            status,
            isFeatured,
            sortOrder: parsedSortOrder,
            ...(Object.keys(seo).length > 0 ? { seo } : {}),
            image,
        };

        setSaving(true);

        try {
            const created = await subcategoriesAdminApi.create(input);
            router.push(`/admin/subcategories/${created._id}`);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-4xl space-y-6 p-6">
            <div>
                <Link
                    href="/admin/subcategories"
                    className="text-sm text-gray-500 hover:text-gray-900"
                >
                    ← Back to Subcategories
                </Link>

                <h1 className="mt-3 text-2xl font-bold text-gray-900">
                    Create Subcategory
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Add a new subcategory under an existing category.
                </p>
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
                            disabled={loadingCategories}
                            onChange={(event) => setCategoryId(event.target.value)}
                            className="w-full rounded-lg border px-3 py-2"
                        >
                            <option value="">
                                {loadingCategories ? "Loading categories..." : "Select category"}
                            </option>

                            {categories.map((category) => (
                                <option key={category._id} value={category._id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>

                        {!loadingCategories && categories.length === 0 && (
                            <p className="mt-2 text-sm text-amber-700">
                                No active categories found. Create a category first.
                            </p>
                        )}
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
                            placeholder="e.g. Smartphones"
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
                            placeholder="smartphones"
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
                            placeholder="Describe this subcategory..."
                            className="w-full rounded-lg border px-3 py-2"
                        />
                    </div>
                </section>

                <section className="space-y-4 rounded-xl border bg-white p-6">
                    <h2 className="font-semibold text-gray-900">Subcategory image</h2>

                    {imagePreview && (
                        <img
                            src={imagePreview}
                            alt="Subcategory preview"
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

                    <p className="text-xs text-gray-500">
                        Supported image formats. Maximum size: 10 MB.
                    </p>

                    {image && (
                        <button
                            type="button"
                            onClick={() => {
                                setImage(null);
                                setImagePreview("");
                            }}
                            className="text-sm text-red-600 hover:underline"
                        >
                            Remove selected image
                        </button>
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
                        <p className="mt-1 text-xs text-gray-500">
                            Separate keywords with commas.
                        </p>
                    </div>
                </section>

                <div className="flex flex-wrap justify-end gap-3">
                    <Link
                        href="/admin/subcategories"
                        className="rounded-lg border px-5 py-3 text-sm font-medium hover:bg-gray-50"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={saving || loadingCategories || categories.length === 0}
                        className="rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                        {saving ? "Creating..." : "Create Subcategory"}
                    </button>
                </div>
            </form>
        </div>
    );
}
