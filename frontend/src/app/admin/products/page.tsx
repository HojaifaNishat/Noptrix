"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

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
  ChevronLeft,
  ChevronRight,
  Loader2,
  Archive,
  Filter,
} from "lucide-react";

import { productsAdminApi } from "@/services/api/products-admin.api";

import type {
  Product,
  ProductFilters,
  ProductInput,
  ProductOption,
  ProductStatus,
  ProductType,
  InventoryPolicy,
} from "@/features/products/product.types";

type FormState = {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  type: ProductType;
  status: ProductStatus;
  sku: string;
  barcode: string;
  sellerId: string;
  categoryId: string;
  subcategoryId: string;
  brandId: string;
  collectionIds: string[];
  price: string;
  compareAtPrice: string;
  costPrice: string;
  currency: string;
  trackInventory: boolean;
  stockQuantity: string;
  lowStockThreshold: string;
  inventoryPolicy: InventoryPolicy;
  requiresShipping: boolean;
  weight: string;
  weightUnit: "g" | "kg";
  length: string;
  width: string;
  height: string;
  dimensionUnit: "cm" | "m";
  tagsText: string;
  attributesText: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  canonicalUrl: string;
  featured: boolean;
  sortOrder: string;
};

const initialForm: FormState = {
  name: "",
  slug: "",
  description: "",
  shortDescription: "",
  type: "SIMPLE",
  status: "DRAFT",
  sku: "",
  barcode: "",
  sellerId: "",
  categoryId: "",
  subcategoryId: "",
  brandId: "",
  collectionIds: [],
  price: "0",
  compareAtPrice: "",
  costPrice: "",
  currency: "BDT",
  trackInventory: true,
  stockQuantity: "0",
  lowStockThreshold: "5",
  inventoryPolicy: "DENY",
  requiresShipping: true,
  weight: "",
  weightUnit: "kg",
  length: "",
  width: "",
  height: "",
  dimensionUnit: "cm",
  tagsText: "",
  attributesText: "{}",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  canonicalUrl: "",
  featured: false,
  sortOrder: "0",
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white";

const labelClass =
  "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

function errorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: { data?: { message?: string } };
      }
    ).response;

    return response?.data?.message ?? "Something went wrong.";
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}

function getReferenceId(
  value: string | { _id: string } | undefined,
): string {
  if (!value) return "";
  return typeof value === "string" ? value : value._id;
}

function createForm(product?: Product): FormState {
  if (!product) return { ...initialForm };

  return {
    name: product.name ?? "",
    slug: product.slug ?? "",
    description: product.description ?? "",
    shortDescription: product.shortDescription ?? "",
    type: product.type ?? "SIMPLE",
    status: product.status ?? "DRAFT",
    sku: product.sku ?? "",
    barcode: product.barcode ?? "",
    sellerId: product.sellerId ?? "",
    categoryId: getReferenceId(product.categoryId),
    subcategoryId: getReferenceId(product.subcategoryId),
    brandId: getReferenceId(product.brandId),
    collectionIds: (product.collectionIds ?? []).map(getReferenceId),
    price: String(product.price ?? 0),
    compareAtPrice:
      product.compareAtPrice === undefined
        ? ""
        : String(product.compareAtPrice),
    costPrice:
      product.costPrice === undefined ? "" : String(product.costPrice),
    currency: product.currency ?? "BDT",
    trackInventory: product.trackInventory ?? true,
    stockQuantity: String(product.stockQuantity ?? 0),
    lowStockThreshold: String(product.lowStockThreshold ?? 5),
    inventoryPolicy: product.inventoryPolicy ?? "DENY",
    requiresShipping: product.requiresShipping ?? true,
    weight: product.shipping?.weight === undefined
      ? ""
      : String(product.shipping.weight),
    weightUnit: product.shipping?.weightUnit ?? "kg",
    length: product.shipping?.length === undefined
      ? ""
      : String(product.shipping.length),
    width: product.shipping?.width === undefined
      ? ""
      : String(product.shipping.width),
    height: product.shipping?.height === undefined
      ? ""
      : String(product.shipping.height),
    dimensionUnit: product.shipping?.dimensionUnit ?? "cm",
    tagsText: (product.tags ?? []).join(", "),
    attributesText: JSON.stringify(product.attributes ?? {}, null, 2),
    seoTitle: product.seo?.title ?? "",
    seoDescription: product.seo?.description ?? "",
    seoKeywords: (product.seo?.keywords ?? []).join(", "),
    canonicalUrl: product.seo?.canonicalUrl ?? "",
    featured: product.featured ?? false,
    sortOrder: String(product.sortOrder ?? 0),
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductOption[]>([]);
  const [subcategories, setSubcategories] = useState<ProductOption[]>([]);
  const [brands, setBrands] = useState<ProductOption[]>([]);
  const [collections, setCollections] = useState<ProductOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | ProductStatus>("");
  const [type, setType] = useState<"" | ProductType>("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [sortBy, setSortBy] = useState<ProductFilters["sortBy"]>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...initialForm });

  const loadProducts = useCallback(async () => {
    setLoading(true);

    try {
      const result = await productsAdminApi.list({
        page,
        limit: 20,
        search: search.trim() || undefined,
        status: status || undefined,
        type: type || undefined,
        categoryId: categoryFilter || undefined,
        brandId: brandFilter || undefined,
        featured:
          featuredFilter === "" ? undefined : featuredFilter === "true",
        inStock:
          stockFilter === "" ? undefined : stockFilter === "true",
        sortBy,
        sortOrder,
      });

      setProducts(result.items ?? []);
      setTotal(result.pagination?.total ?? 0);
      setTotalPages(Math.max(1, result.pagination?.totalPages ?? 1));
    } catch (error) {
      alert(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    status,
    type,
    categoryFilter,
    brandFilter,
    featuredFilter,
    stockFilter,
    sortBy,
    sortOrder,
  ]);

  const loadOptions = useCallback(async () => {
    const results = await Promise.allSettled([
      productsAdminApi.getCategories(),
      productsAdminApi.getSubcategories(),
      productsAdminApi.getBrands(),
      productsAdminApi.getCollections(),
    ]);

    if (results[0].status === "fulfilled") {
      setCategories(results[0].value);
    }
    if (results[1].status === "fulfilled") {
      setSubcategories(results[1].value);
    }
    if (results[2].status === "fulfilled") {
      setBrands(results[2].value);
    }
    if (results[3].status === "fulfilled") {
      setCollections(results[3].value);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  const availableSubcategories = useMemo(() => {
    if (!form.categoryId) return subcategories;

    return subcategories.filter((item) => {
      const parentId = getReferenceId(item.categoryId);
      return !parentId || parentId === form.categoryId;
    });
  }, [subcategories, form.categoryId]);

  function updateForm<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...initialForm });
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditingId(product._id);
    setForm(createForm(product));
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Product name is required.");
      return;
    }

    if (!form.categoryId) {
      alert("Please select a category.");
      return;
    }

    if (form.type === "DIGITAL" && form.requiresShipping) {
      alert("Digital products cannot require shipping.");
      return;
    }

    const price = Number(form.price);
    const compareAtPrice =
      form.compareAtPrice.trim() === ""
        ? undefined
        : Number(form.compareAtPrice);

    const costPrice =
      form.costPrice.trim() === "" ? undefined : Number(form.costPrice);

    if (!Number.isFinite(price) || price < 0) {
      alert("Please enter a valid product price.");
      return;
    }

    if (
      compareAtPrice !== undefined &&
      (!Number.isFinite(compareAtPrice) || compareAtPrice <= price)
    ) {
      alert("Compare-at price must be greater than the selling price.");
      return;
    }

    if (costPrice !== undefined && (!Number.isFinite(costPrice) || costPrice < 0)) {
      alert("Please enter a valid cost price.");
      return;
    }

    let attributes: Record<string, unknown>;

    try {
      const parsed: unknown = JSON.parse(form.attributesText || "{}");

      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        throw new Error("Attributes must be a JSON object.");
      }

      attributes = parsed as Record<string, unknown>;
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Invalid attributes JSON.",
      );
      return;
    }

    const numberOrUndefined = (value: string) =>
      value.trim() === "" ? undefined : Number(value);

    const payload: ProductInput = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim() || undefined,
      shortDescription: form.shortDescription.trim() || undefined,
      type: form.type,
      status: form.status,
      sku: form.sku.trim() || undefined,
      barcode: form.barcode.trim() || undefined,
      sellerId: form.sellerId.trim() || undefined,
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId || undefined,
      brandId: form.brandId || undefined,
      collectionIds: form.collectionIds,
      price,
      compareAtPrice,
      costPrice,
      currency: form.currency.trim().toUpperCase(),
      trackInventory: form.trackInventory,
      stockQuantity: numberOrUndefined(form.stockQuantity),
      lowStockThreshold: numberOrUndefined(form.lowStockThreshold),
      inventoryPolicy: form.inventoryPolicy,
      requiresShipping: form.requiresShipping,
      shipping: {
        required: form.requiresShipping,
        weight: numberOrUndefined(form.weight),
        weightUnit: form.weightUnit,
        length: numberOrUndefined(form.length),
        width: numberOrUndefined(form.width),
        height: numberOrUndefined(form.height),
        dimensionUnit: form.dimensionUnit,
      },
      tags: form.tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      attributes,
      seo: {
        title: form.seoTitle.trim() || undefined,
        description: form.seoDescription.trim() || undefined,
        keywords: form.seoKeywords
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean),
        canonicalUrl: form.canonicalUrl.trim() || undefined,
      },
      featured: form.featured,
      sortOrder: Number(form.sortOrder || 0),
    };

    setSaving(true);

    try {
      if (editingId) {
        await productsAdminApi.update(editingId, payload);
        alert("Product updated successfully.");
      } else {
        await productsAdminApi.create(payload);
        alert("Product created successfully.");
      }

      setModalOpen(false);
      setEditingId(null);
      setForm({ ...initialForm });
      await loadProducts();
    } catch (error) {
      alert(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(
    product: Product,
    nextStatus: ProductStatus,
  ) {
    if (product.status === "ARCHIVED") {
      alert("Archived products cannot be reactivated.");
      return;
    }

    if (!window.confirm(`Change "${product.name}" to ${nextStatus}?`)) {
      return;
    }

    try {
      await productsAdminApi.updateStatus(product._id, nextStatus);
      await loadProducts();
    } catch (error) {
      alert(errorMessage(error));
    }
  }

  async function handleArchive(product: Product) {
    if (
      !window.confirm(
        `Archive "${product.name}"? Archived products cannot be edited or reactivated through the status endpoint.`,
      )
    ) {
      return;
    }

    try {
      await productsAdminApi.archive(product._id);
      await loadProducts();
    } catch (error) {
      alert(errorMessage(error));
    }
  }

  const selectedCategoryName = (product: Product) =>
    typeof product.categoryId === "string"
      ? product.categoryId
      : product.categoryId?.name ?? "—";

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Products
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage product catalog, pricing, inventory and SEO.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Product
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="mt-1 text-2xl font-bold">{total}</p>
        </div>

        <div className="rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Loaded Products</p>
          <p className="mt-1 text-2xl font-bold">{products.length}</p>
        </div>

        <div className="rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Featured on Page</p>
          <p className="mt-1 text-2xl font-bold">
            {products.filter((product) => product.featured).length}
          </p>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="relative">
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
            placeholder="Search product name, SKU, barcode..."
            className="w-full rounded-lg border py-2.5 pl-10 pr-3 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as "" | ProductStatus);
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            value={type}
            onChange={(event) => {
              setType(event.target.value as "" | ProductType);
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All Types</option>
            <option value="SIMPLE">Simple</option>
            <option value="VARIABLE">Variable</option>
            <option value="DIGITAL">Digital</option>
            <option value="SERVICE">Service</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All Categories</option>
            {categories.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={brandFilter}
            onChange={(event) => {
              setBrandFilter(event.target.value);
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All Brands</option>
            {brands.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={featuredFilter}
            onChange={(event) => {
              setFeaturedFilter(event.target.value);
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">Featured: All</option>
            <option value="true">Featured</option>
            <option value="false">Not Featured</option>
          </select>

          <select
            value={stockFilter}
            onChange={(event) => {
              setStockFilter(event.target.value);
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">Stock: All</option>
            <option value="true">In Stock</option>
            <option value="false">Out of Stock</option>
          </select>

          <select
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value as ProductFilters["sortBy"]);
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="createdAt">Created Date</option>
            <option value="updatedAt">Updated Date</option>
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="sortOrder">Sort Order</option>
          </select>

          <select
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(event.target.value as "asc" | "desc");
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => void loadProducts()}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white dark:border-gray-700 dark:bg-gray-900">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-gray-500">
            <Loader2 className="animate-spin" size={20} />
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="mx-auto mb-3" size={36} />
            <p className="font-medium">No products found</p>
            <p className="mt-1 text-sm">
              Try changing your filters or create a product.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800">
                <tr>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">SKU</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Price</th>
                  <th className="px-5 py-4">Stock</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y dark:divide-gray-800">
                {products.map((product) => (
                  <tr
                    key={product._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                          <Package size={18} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.slug}
                          </p>
                          {product.featured && (
                            <span className="mt-1 inline-flex items-center gap-1 text-xs text-amber-600">
                              <Star size={12} fill="currentColor" />
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">{product.sku || "—"}</td>
                    <td className="px-5 py-4">
                      {selectedCategoryName(product)}
                    </td>
                    <td className="px-5 py-4">{product.type}</td>
                    <td className="px-5 py-4">
                      {product.price} {product.currency ?? "BDT"}
                    </td>
                    <td className="px-5 py-4">
                      {product.trackInventory === false
                        ? "Not tracked"
                        : product.stockQuantity ?? 0}
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={product.status}
                        disabled={product.status === "ARCHIVED"}
                        onChange={(event) =>
                          void handleStatusChange(
                            product,
                            event.target.value as ProductStatus,
                          )
                        }
                        className="rounded-lg border px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800 disabled:opacity-50"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        {product.status === "ARCHIVED" && (
                          <option value="ARCHIVED">Archived</option>
                        )}
                      </select>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          title="Edit product"
                          disabled={product.status === "ARCHIVED"}
                          onClick={() => openEdit(product)}
                          className="rounded-lg border p-2 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          title="Archive product"
                          disabled={product.status === "ARCHIVED"}
                          onClick={() => void handleArchive(product)}
                          className="rounded-lg border p-2 text-red-600 hover:bg-red-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-red-950"
                        >
                          <Archive size={16} />
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
            {total} products · Page {page} of {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded-lg border p-2 disabled:opacity-40 dark:border-gray-700"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              disabled={page >= totalPages || loading}
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
              className="rounded-lg border p-2 disabled:opacity-40 dark:border-gray-700"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3">
          <div className="my-6 w-full max-w-5xl rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900 md:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {editingId ? "Edit Product" : "Create Product"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Configure product information and settings.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
              <section className="space-y-4">
                <h3 className="border-b pb-2 font-semibold dark:border-gray-700">
                  Basic Information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Product Name *">
                    <input
                      required
                      minLength={2}
                      maxLength={180}
                      value={form.name}
                      onChange={(event) =>
                        updateForm("name", event.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Slug">
                    <input
                      maxLength={200}
                      value={form.slug}
                      onChange={(event) =>
                        updateForm("slug", event.target.value)
                      }
                      className={inputClass}
                      placeholder="product-slug"
                    />
                  </Field>

                  <Field label="Product Type">
                    <select
                      value={form.type}
                      onChange={(event) =>
                        updateForm("type", event.target.value as ProductType)
                      }
                      className={inputClass}
                    >
                      <option value="SIMPLE">Simple</option>
                      <option value="VARIABLE">Variable</option>
                      <option value="DIGITAL">Digital</option>
                      <option value="SERVICE">Service</option>
                    </select>
                  </Field>

                  <Field label="Status">
                    <select
                      value={form.status}
                      onChange={(event) =>
                        updateForm(
                          "status",
                          event.target.value as ProductStatus,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </Field>
                </div>

                <Field label="Short Description">
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={form.shortDescription}
                    onChange={(event) =>
                      updateForm("shortDescription", event.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Full Description">
                  <textarea
                    rows={5}
                    maxLength={30000}
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    className={inputClass}
                  />
                </Field>
              </section>

              <section className="space-y-4">
                <h3 className="border-b pb-2 font-semibold dark:border-gray-700">
                  Product Classification
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Category *">
                    <select
                      required
                      value={form.categoryId}
                      onChange={(event) => {
                        updateForm("categoryId", event.target.value);
                        updateForm("subcategoryId", "");
                      }}
                      className={inputClass}
                    >
                      <option value="">Select category</option>
                      {categories.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Subcategory">
                    <select
                      value={form.subcategoryId}
                      onChange={(event) =>
                        updateForm("subcategoryId", event.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="">Select subcategory</option>
                      {availableSubcategories.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Brand">
                    <select
                      value={form.brandId}
                      onChange={(event) =>
                        updateForm("brandId", event.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="">Select brand</option>
                      {brands.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Seller ID (optional)">
                    <input
                      value={form.sellerId}
                      onChange={(event) =>
                        updateForm("sellerId", event.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field label="Collections">
                  <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border p-3 dark:border-gray-700">
                    {collections.map((item) => (
                      <label
                        key={item._id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={form.collectionIds.includes(item._id)}
                          onChange={() => {
                            const current = form.collectionIds;
                            updateForm(
                              "collectionIds",
                              current.includes(item._id)
                                ? current.filter((id) => id !== item._id)
                                : [...current, item._id],
                            );
                          }}
                        />
                        {item.name}
                      </label>
                    ))}
                    {collections.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No collections available.
                      </p>
                    )}
                  </div>
                </Field>
              </section>

              <section className="space-y-4">
                <h3 className="border-b pb-2 font-semibold dark:border-gray-700">
                  Pricing
                </h3>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Field label="Price *">
                    <input
                      required
                      type="number"
                      min={0}
                      step="any"
                      value={form.price}
                      onChange={(event) =>
                        updateForm("price", event.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Compare-at Price">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={form.compareAtPrice}
                      onChange={(event) =>
                        updateForm("compareAtPrice", event.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Cost Price">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={form.costPrice}
                      onChange={(event) =>
                        updateForm("costPrice", event.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Currency">
                    <input
                      maxLength={3}
                      minLength={3}
                      value={form.currency}
                      onChange={(event) =>
                        updateForm("currency", event.target.value.toUpperCase())
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="border-b pb-2 font-semibold dark:border-gray-700">
                  Product Identifiers
                </h3>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="SKU">
                    <input
                      maxLength={100}
                      value={form.sku}
                      onChange={(event) =>
                        updateForm("sku", event.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Barcode">
                    <input
                      maxLength={100}
                      value={form.barcode}
                      onChange={(event) =>
                        updateForm("barcode", event.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Sort Order">
                    <input
                      type="number"
                      min={-100000}
                      max={100000}
                      value={form.sortOrder}
                      onChange={(event) =>
                        updateForm("sortOrder", event.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="border-b pb-2 font-semibold dark:border-gray-700">
                  Inventory
                </h3>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.trackInventory}
                    onChange={(event) =>
                      updateForm("trackInventory", event.target.checked)
                    }
                  />
                  Track inventory
                </label>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Stock Quantity">
                    <input
                      type="number"
                      min={0}
                      disabled={!form.trackInventory}
                      value={form.stockQuantity}
                      onChange={(event) =>
                        updateForm("stockQuantity", event.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Low Stock Threshold">
                    <input
                      type="number"
                      min={0}
                      disabled={!form.trackInventory}
                      value={form.lowStockThreshold}
                      onChange={(event) =>
                        updateForm("lowStockThreshold", event.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Inventory Policy">
                    <select
                      value={form.inventoryPolicy}
                      disabled={!form.trackInventory}
                      onChange={(event) =>
                        updateForm(
                          "inventoryPolicy",
                          event.target.value as InventoryPolicy,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="DENY">Deny when out of stock</option>
                      <option value="CONTINUE">Continue selling</option>
                    </select>
                  </Field>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="border-b pb-2 font-semibold dark:border-gray-700">
                  Shipping
                </h3>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.requiresShipping}
                    onChange={(event) =>
                      updateForm("requiresShipping", event.target.checked)
                    }
                  />
                  This product requires shipping
                </label>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Weight">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      disabled={!form.requiresShipping}
                      value={form.weight}
                      onChange={(event) =>
                        updateForm("weight", event.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Weight Unit">
                    <select
                      disabled={!form.requiresShipping}
                      value={form.weightUnit}
                      onChange={(event) =>
                        updateForm("weightUnit", event.target.value as "g" | "kg")
                      }
                      className={inputClass}
                    >
                      <option value="g">Gram</option>
                      <option value="kg">Kilogram</option>
                    </select>
                  </Field>

                  <Field label="Dimension Unit">
                    <select
                      disabled={!form.requiresShipping}
                      value={form.dimensionUnit}
                      onChange={(event) =>
                        updateForm(
                          "dimensionUnit",
                          event.target.value as "cm" | "m",
                        )
                      }
                      className={inputClass}
                    >
                      <option value="cm">Centimeter</option>
                      <option value="m">Meter</option>
                    </select>
                  </Field>

                  {(["length", "width", "height"] as const).map((key) => (
                    <Field key={key} label={key[0].toUpperCase() + key.slice(1)}>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        disabled={!form.requiresShipping}
                        value={form[key]}
                        onChange={(event) =>
                          updateForm(key, event.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                  ))}
                </div>

                {form.type === "DIGITAL" && (
                  <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                    Digital products cannot require shipping. Disable shipping
                    before saving.
                  </p>
                )}
              </section>

              <section className="space-y-4">
                <h3 className="border-b pb-2 font-semibold dark:border-gray-700">
                  Tags and Attributes
                </h3>

                <Field label="Tags (comma separated)">
                  <input
                    value={form.tagsText}
                    onChange={(event) =>
                      updateForm("tagsText", event.target.value)
                    }
                    className={inputClass}
                    placeholder="summer, trending, new"
                  />
                </Field>

                <Field label="Attributes (JSON object)">
                  <textarea
                    rows={5}
                    value={form.attributesText}
                    onChange={(event) =>
                      updateForm("attributesText", event.target.value)
                    }
                    className={`${inputClass} font-mono`}
                    placeholder='{"color":"Black","size":"Large"}'
                  />
                </Field>
              </section>

              <section className="space-y-4">
                <h3 className="border-b pb-2 font-semibold dark:border-gray-700">
                  SEO
                </h3>

                <Field label="SEO Title">
                  <input
                    maxLength={70}
                    value={form.seoTitle}
                    onChange={(event) =>
                      updateForm("seoTitle", event.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="SEO Description">
                  <textarea
                    rows={2}
                    maxLength={320}
                    value={form.seoDescription}
                    onChange={(event) =>
                      updateForm("seoDescription", event.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="SEO Keywords (comma separated)">
                  <input
                    value={form.seoKeywords}
                    onChange={(event) =>
                      updateForm("seoKeywords", event.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Canonical URL">
                  <input
                    type="url"
                    value={form.canonicalUrl}
                    onChange={(event) =>
                      updateForm("canonicalUrl", event.target.value)
                    }
                    className={inputClass}
                  />
                </Field>
              </section>

              <section className="flex flex-wrap gap-6 border-t pt-5 dark:border-gray-700">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) =>
                      updateForm("featured", event.target.checked)
                    }
                  />
                  <Star size={16} className="text-amber-500" />
                  Featured Product
                </label>
              </section>

              <div className="flex justify-end gap-3 border-t pt-5 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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
                  {editingId ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
