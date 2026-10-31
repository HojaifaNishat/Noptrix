"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { brandsAdminApi } from "@/services/api/brands-admin.api";

import type {
  Brand,
  BrandStatus,
  UpdateBrandInput,
} from "@/features/brands/brand.types";

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

function createSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function EditBrandPage() {
  const params = useParams<{ brandId: string }>();
  const router = useRouter();
  const brandId = params.brandId;

  const [brand, setBrand] = useState<Brand | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [removeLogo, setRemoveLogo] = useState(false);

  const [status, setStatus] = useState<BrandStatus>("ACTIVE");
  const [sortOrder, setSortOrder] = useState("0");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const loadBrand = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await brandsAdminApi.getById(brandId);

      setBrand(result);
      setName(result.name);
      setSlug(result.slug);
      setDescription(result.description ?? "");
      setWebsite(result.website ?? "");
      setLogoUrl(result.logo ?? "");
      setLogoPreview(result.logo ?? "");
      setStatus(result.status);
      setSortOrder(String(result.sortOrder));
      setSeoTitle(result.seo?.title ?? "");
      setSeoDescription(result.seo?.description ?? "");
      setLogoFile(null);
      setRemoveLogo(false);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    void Promise.resolve().then(loadBrand);
  }, [loadBrand]);

  useEffect(() => {
    return () => {
      if (logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const handleLogoChange = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Logo must be smaller than 10 MB.");
      return;
    }

    setError("");
    setLogoFile(file);
    setLogoUrl("");
    setLogoPreview(URL.createObjectURL(file));
    setRemoveLogo(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Brand name must contain at least 2 characters.");
      return;
    }

    const parsedSortOrder = Number(sortOrder);

    if (
      !Number.isInteger(parsedSortOrder) ||
      parsedSortOrder < 0 ||
      parsedSortOrder > 1_000_000
    ) {
      setError("Sort order must be an integer between 0 and 1,000,000.");
      return;
    }

    const seo = {
      ...(seoTitle.trim() ? { title: seoTitle.trim() } : {}),
      ...(seoDescription.trim() ? { description: seoDescription.trim() } : {}),
    };

    const input: UpdateBrandInput = {
      name: name.trim(),
      slug: slug.trim() || createSlug(name),
      description: description.trim(),
      website: website.trim(),
      status,
      sortOrder: parsedSortOrder,
      ...(Object.keys(seo).length ? { seo } : {}),
      ...(removeLogo ? { removeLogo: true } : {}),
      ...(logoFile ? { logoFile } : {}),
      ...(!logoFile && !removeLogo ? { logo: logoUrl.trim() } : {}),
    };

    setSaving(true);

    try {
      await brandsAdminApi.update(brandId, input);
      await loadBrand();
      setError("");
      window.alert("Brand updated successfully.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!brand) return;

    if (
      !window.confirm(`Delete "${brand.name}"? This action cannot be undone.`)
    ) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await brandsAdminApi.delete(brandId);
      router.push("/admin/brands");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading brand...</div>;
  }

  if (!brand) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-red-600">{error || "Brand not found."}</p>
        <Link href="/admin/brands" className="text-sm underline">
          Back to Brands
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <Link
          href="/admin/brands"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Back to Brands
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-gray-900">Edit Brand</h1>

        <p className="mt-1 text-sm text-gray-500">Update {brand.name}.</p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4 rounded-xl border bg-white p-6">
          <h2 className="font-semibold text-gray-900">Basic information</h2>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Brand name *
            </label>
            <input
              required
              minLength={2}
              maxLength={120}
              value={name}
              onChange={(event) => {
                const value = event.target.value;
                setName(value);
                setSlug(createSlug(value));
              }}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Slug</label>
            <input
              maxLength={160}
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>
            <textarea
              rows={4}
              maxLength={3000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Website URL
            </label>
            <input
              type="url"
              maxLength={2048}
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        </section>

        <section className="space-y-4 rounded-xl border bg-white p-6">
          <h2 className="font-semibold text-gray-900">Brand logo</h2>

          {logoPreview && !removeLogo && (
            <img
              src={logoPreview}
              alt="Brand logo"
              className="h-32 w-32 rounded-lg border bg-white object-contain p-2"
            />
          )}

          {removeLogo && (
            <p className="text-sm text-amber-700">
              Current logo will be removed when you save.
            </p>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Replace logo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                handleLogoChange(event.target.files?.[0] ?? null)
              }
              className="block w-full text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Image only. Maximum size: 10 MB.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Logo URL</label>
            <input
              type="url"
              maxLength={2048}
              value={logoUrl}
              disabled={Boolean(logoFile) || removeLogo}
              onChange={(event) => {
                setLogoUrl(event.target.value);
                setLogoPreview(event.target.value);
              }}
              placeholder="https://example.com/logo.png"
              className="w-full rounded-lg border px-3 py-2 disabled:bg-gray-100"
            />
          </div>

          {(logoUrl || logoFile || brand.logo) && !removeLogo && (
            <button
              type="button"
              onClick={() => {
                setLogoFile(null);
                setLogoUrl("");
                setLogoPreview("");
                setRemoveLogo(true);
              }}
              className="text-sm text-red-600 hover:underline"
            >
              Remove logo
            </button>
          )}

          {removeLogo && (
            <button
              type="button"
              onClick={() => {
                setRemoveLogo(false);
                setLogoUrl(brand.logo ?? "");
                setLogoPreview(brand.logo ?? "");
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Undo remove
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
                onChange={(event) =>
                  setStatus(event.target.value as BrandStatus)
                }
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Sort order
              </label>
              <input
                type="number"
                min={0}
                max={1000000}
                step={1}
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border bg-white p-6">
          <h2 className="font-semibold text-gray-900">SEO</h2>

          <div>
            <label className="mb-2 block text-sm font-medium">SEO title</label>
            <input
              maxLength={160}
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
              maxLength={320}
              value={seoDescription}
              onChange={(event) => setSeoDescription(event.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        </section>

        <div className="flex flex-wrap justify-between gap-3">
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="rounded-lg border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Brand"}
          </button>

          <div className="flex gap-3">
            <Link
              href="/admin/brands"
              className="rounded-lg border px-5 py-3 text-sm"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
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
