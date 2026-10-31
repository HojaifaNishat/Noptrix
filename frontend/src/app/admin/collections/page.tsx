"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Save,
  Package,
  Star,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
} from "lucide-react";

import { collectionsAdminApi } from "@/services/api/collections-admin.api";

import type {
  Collection,
  CollectionInput,
  CollectionStatus,
  ProductOption,
} from "@/features/collections/collection.types";

const initialForm: CollectionInput = {
  name: "",
  slug: "",
  description: "",
  image: "",
  products: [],
  status: "ACTIVE",
  isFeatured: false,
  sortOrder: 0,
  seoTitle: "",
  seoDescription: "",
};

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    }).response;

    return response?.data?.message ?? "Something went wrong.";
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | CollectionStatus>("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CollectionInput>(initialForm);

  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productSaving, setProductSaving] = useState(false);

  const loadCollections = useCallback(async () => {
    setLoading(true);

    try {
      const result = await collectionsAdminApi.list({
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        isFeatured:
          featuredFilter === ""
            ? undefined
            : featuredFilter === "true",
        sortBy: "sortOrder",
        sortOrder: "asc",
      });

      setCollections(result.items ?? []);
      setTotal(result.pagination?.total ?? 0);
      setTotalPages(Math.max(1, result.pagination?.totalPages ?? 1));
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, featuredFilter]);

  const loadProducts = useCallback(async () => {
    try {
      const result = await collectionsAdminApi.getProducts();
      setProducts(result);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  }, []);

  useEffect(() => {
    void loadCollections();
  }, [loadCollections]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    return products.filter((product) =>
      product.name.toLowerCase().includes(query),
    );
  }, [products, productSearch]);

  function openCreateForm() {
    setEditingId(null);
    setForm(initialForm);
    setFormOpen(true);
  }

  function openEditForm(collection: Collection) {
    setEditingId(collection._id);

    setForm({
      name: collection.name,
      slug: collection.slug,
      description: collection.description ?? "",
      image: collection.image ?? "",
      products: collection.products.map((product) => product._id),
      status: collection.status,
      isFeatured: collection.isFeatured,
      sortOrder: collection.sortOrder,
      seoTitle: collection.seoTitle ?? "",
      seoDescription: collection.seoDescription ?? "",
    });

    setFormOpen(true);
  }

  function updateForm<K extends keyof CollectionInput>(
    key: K,
    value: CollectionInput[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Collection name is required.");
      return;
    }

    setSaving(true);

    try {
      const payload: CollectionInput = {
        ...form,
        name: form.name.trim(),
        slug: form.slug?.trim() || undefined,
        description: form.description?.trim() || undefined,
        image: form.image?.trim() || undefined,
        seoTitle: form.seoTitle?.trim() || undefined,
        seoDescription: form.seoDescription?.trim() || undefined,
        sortOrder: Number(form.sortOrder ?? 0),
      };

      if (editingId) {
        await collectionsAdminApi.update(editingId, payload);
        alert("Collection updated successfully.");
      } else {
        await collectionsAdminApi.create(payload);
        alert("Collection created successfully.");
      }

      setFormOpen(false);
      setForm(initialForm);
      setEditingId(null);
      await loadCollections();
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(collection: Collection) {
    if (
      !window.confirm(
        `Delete collection "${collection.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await collectionsAdminApi.delete(collection._id);

      if (selectedCollection?._id === collection._id) {
        setSelectedCollection(null);
      }

      alert("Collection deleted successfully.");
      await loadCollections();
    } catch (error) {
      alert(getErrorMessage(error));
    }
  }

  function openProductManager(collection: Collection) {
    setSelectedCollection(collection);
    setSelectedProductIds([]);
    setProductSearch("");
  }

  function toggleProductSelection(productId: string) {
    setSelectedProductIds((previous) =>
      previous.includes(productId)
        ? previous.filter((id) => id !== productId)
        : [...previous, productId],
    );
  }

  async function handleAddProducts() {
    if (!selectedCollection || selectedProductIds.length === 0) return;

    setProductSaving(true);

    try {
      const updated = await collectionsAdminApi.addProducts(
        selectedCollection._id,
        selectedProductIds,
      );

      setSelectedCollection(updated);
      setSelectedProductIds([]);
      await loadCollections();
      alert("Products added successfully.");
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setProductSaving(false);
    }
  }

  async function handleRemoveProduct(productId: string) {
    if (!selectedCollection) return;

    if (!window.confirm("Remove this product from the collection?")) return;

    setProductSaving(true);

    try {
      const updated = await collectionsAdminApi.removeProducts(
        selectedCollection._id,
        [productId],
      );

      setSelectedCollection(updated);
      await loadCollections();
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setProductSaving(false);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Collections
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage storefront collections and their products.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Collection
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Total Collections</p>
          <p className="mt-1 text-2xl font-bold">{total}</p>
        </div>

        <div className="rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Loaded Collections</p>
          <p className="mt-1 text-2xl font-bold">{collections.length}</p>
        </div>

        <div className="rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Featured on This Page</p>
          <p className="mt-1 text-2xl font-bold">
            {collections.filter((item) => item.isFeatured).length}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900 md:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search name, slug or description..."
            className="w-full rounded-lg border py-2.5 pl-10 pr-3 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as "" | CollectionStatus);
            setPage(1);
          }}
          className="rounded-lg border px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <select
          value={featuredFilter}
          onChange={(event) => {
            setFeaturedFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
        >
          <option value="">All Collections</option>
          <option value="true">Featured</option>
          <option value="false">Not Featured</option>
        </select>

        <button
          onClick={() => void loadCollections()}
          className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white dark:border-gray-700 dark:bg-gray-900">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-gray-500">
            <Loader2 className="animate-spin" size={20} />
            Loading collections...
          </div>
        ) : collections.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="mx-auto mb-3" size={36} />
            <p className="font-medium">No collections found</p>
            <p className="mt-1 text-sm">
              Create a collection or change your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800">
                <tr>
                  <th className="px-5 py-4">Collection</th>
                  <th className="px-5 py-4">Products</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Featured</th>
                  <th className="px-5 py-4">Sort Order</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y dark:divide-gray-800">
                {collections.map((collection) => (
                  <tr key={collection._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {collection.image ? (
                          <img
                            src={collection.image}
                            alt={collection.name}
                            className="h-12 w-12 rounded-lg border object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                            <ImageIcon size={20} className="text-gray-400" />
                          </div>
                        )}

                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {collection.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            /{collection.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => openProductManager(collection)}
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                      >
                        <Package size={15} />
                        {collection.products?.length ?? 0} Products
                      </button>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          collection.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {collection.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {collection.isFeatured ? (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <Star size={15} fill="currentColor" />
                          Featured
                        </span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>

                    <td className="px-5 py-4">{collection.sortOrder}</td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          title="Manage products"
                          onClick={() => openProductManager(collection)}
                          className="rounded-lg border p-2 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                        >
                          <Package size={16} />
                        </button>

                        <button
                          title="Edit collection"
                          onClick={() => openEditForm(collection)}
                          className="rounded-lg border p-2 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          title="Delete collection"
                          onClick={() => void handleDelete(collection)}
                          className="rounded-lg border p-2 text-red-600 hover:bg-red-50 dark:border-gray-700 dark:hover:bg-red-950"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col items-center justify-between gap-3 border-t p-4 dark:border-gray-800 sm:flex-row">
          <p className="text-sm text-gray-500">
            Total: {total} collections · Page {page} of {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded-lg border p-2 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              disabled={page >= totalPages || loading}
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
              className="rounded-lg border p-2 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {editingId ? "Edit Collection" : "Create Collection"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Configure collection details, products and SEO.
                </p>
              </div>

              <button
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm font-medium">Name *</span>
                  <input
                    required
                    minLength={2}
                    maxLength={120}
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    className="w-full rounded-lg border px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                    placeholder="Summer Collection"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium">Slug</span>
                  <input
                    maxLength={160}
                    value={form.slug ?? ""}
                    onChange={(event) => updateForm("slug", event.target.value)}
                    className="w-full rounded-lg border px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                    placeholder="summer-collection"
                  />
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  rows={3}
                  maxLength={5000}
                  value={form.description ?? ""}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  className="w-full rounded-lg border px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Image URL</span>
                <input
                  type="url"
                  value={form.image ?? ""}
                  onChange={(event) => updateForm("image", event.target.value)}
                  className="w-full rounded-lg border px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="https://example.com/image.jpg"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-1.5">
                  <span className="text-sm font-medium">Status</span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateForm(
                        "status",
                        event.target.value as CollectionStatus,
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium">Sort Order</span>
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    value={form.sortOrder ?? 0}
                    onChange={(event) =>
                      updateForm("sortOrder", Number(event.target.value))
                    }
                    className="w-full rounded-lg border px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                  />
                </label>

                <label className="flex items-center gap-2 self-end pb-3">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isFeatured)}
                    onChange={(event) =>
                      updateForm("isFeatured", event.target.checked)
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">Featured</span>
                </label>
              </div>

              <div className="space-y-3 rounded-xl border p-4 dark:border-gray-700">
                <h3 className="font-semibold">SEO Settings</h3>

                <label className="block space-y-1.5">
                  <span className="text-sm">SEO Title</span>
                  <input
                    maxLength={160}
                    value={form.seoTitle ?? ""}
                    onChange={(event) =>
                      updateForm("seoTitle", event.target.value)
                    }
                    className="w-full rounded-lg border px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm">SEO Description</span>
                  <textarea
                    rows={2}
                    maxLength={320}
                    value={form.seoDescription ?? ""}
                    onChange={(event) =>
                      updateForm("seoDescription", event.target.value)
                    }
                    className="w-full rounded-lg border px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                  />
                </label>
              </div>

              {!editingId && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Initial Products</h3>
                  <p className="text-xs text-gray-500">
                    Select products to include when creating this collection.
                  </p>

                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3 dark:border-gray-700">
                    {products.map((product) => (
                      <label
                        key={product._id}
                        className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <input
                          type="checkbox"
                          checked={(form.products ?? []).includes(product._id)}
                          onChange={() => {
                            const current = form.products ?? [];
                            updateForm(
                              "products",
                              current.includes(product._id)
                                ? current.filter((id) => id !== product._id)
                                : [...current, product._id],
                            );
                          }}
                        />
                        <span className="text-sm">{product.name}</span>
                      </label>
                    ))}

                    {products.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No products available.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t pt-5 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg border px-4 py-2.5 dark:border-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={17} />
                  ) : (
                    <Save size={17} />
                  )}
                  {editingId ? "Save Changes" : "Create Collection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCollection && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Manage Products</h2>
                <p className="text-sm text-gray-500">
                  {selectedCollection.name}
                </p>
              </div>

              <button
                onClick={() => setSelectedCollection(null)}
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-5 space-y-3">
              <h3 className="font-semibold">
                Assigned Products ({selectedCollection.products.length})
              </h3>

              {selectedCollection.products.length === 0 ? (
                <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-800">
                  No products assigned to this collection.
                </p>
              ) : (
                <div className="max-h-52 space-y-2 overflow-y-auto">
                  {selectedCollection.products.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center justify-between rounded-lg border p-3 dark:border-gray-700"
                    >
                      <span className="text-sm font-medium">
                        {product.name}
                      </span>

                      <button
                        disabled={productSaving}
                        onClick={() => void handleRemoveProduct(product._id)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        title="Remove product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 border-t pt-5 dark:border-gray-800">
              <h3 className="font-semibold">Add Products</h3>

              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Search products..."
                  className="w-full rounded-lg border py-2.5 pl-10 pr-3 dark:border-gray-700 dark:bg-gray-800"
                />
              </div>

              <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border p-2 dark:border-gray-700">
                {filteredProducts
                  .filter(
                    (product) =>
                      !selectedCollection.products.some(
                        (assigned) => assigned._id === product._id,
                      ),
                  )
                  .map((product) => (
                    <label
                      key={product._id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(product._id)}
                        onChange={() => toggleProductSelection(product._id)}
                      />
                      <span className="text-sm">{product.name}</span>
                    </label>
                  ))}

                {filteredProducts.length === 0 && (
                  <p className="p-3 text-sm text-gray-500">
                    No matching products found.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-gray-500">
                  {selectedProductIds.length} selected
                </p>

                <button
                  disabled={
                    productSaving || selectedProductIds.length === 0
                  }
                  onClick={() => void handleAddProducts()}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {productSaving && (
                    <Loader2 className="animate-spin" size={16} />
                  )}
                  <Plus size={16} />
                  Add Selected Products
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
