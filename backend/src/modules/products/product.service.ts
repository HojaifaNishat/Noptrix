import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { Product, PRODUCT_STATUSES } from "./product.model";
import type { ProductStatus } from "./product.model";

const slugify = (value: string): string => value.normalize("NFKD").toLowerCase().trim()
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const duplicateError = () => ApiError.conflict("Product slug, SKU or barcode already exists.", {
  code: "PRODUCT_DUPLICATE",
});

function handleDuplicate(error: unknown): never {
  if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
    throw duplicateError();
  }
  throw error;
}

function validObjectId(value: unknown, field: string): Types.ObjectId | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) {
    throw ApiError.badRequest(`Invalid ${field}.`);
  }
  return new Types.ObjectId(value);
}

export async function createProduct(input: Record<string, unknown>) {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const sku = typeof input.sku === "string" ? input.sku.trim().toUpperCase() : "";
  const price = Number(input.price);
  const compareAtPrice = input.compareAtPrice === undefined ? undefined : Number(input.compareAtPrice);
  if (name.length < 2) throw ApiError.badRequest("Product name must contain at least 2 characters.");
  if (!sku) throw ApiError.badRequest("Product SKU is required.");
  if (!Number.isFinite(price) || price <= 0) throw ApiError.badRequest("Price must be greater than zero.");
  if (compareAtPrice !== undefined && (!Number.isFinite(compareAtPrice) || compareAtPrice < price)) {
    throw ApiError.badRequest("compareAtPrice must be greater than or equal to price.");
  }
  const slug = typeof input.slug === "string" ? slugify(input.slug) : slugify(name);
  if (!slug) throw ApiError.badRequest("A valid product slug is required.");

  const categoryId = validObjectId(input.categoryId, "category ID");
  const subcategoryId = validObjectId(input.subcategoryId, "subcategory ID");
  const brandId = validObjectId(input.brandId, "brand ID");
  const defaultImageId = validObjectId(input.defaultImageId, "default image ID");
  const createdBy = validObjectId(input.createdBy, "creator ID");
  const collectionIds = Array.isArray(input.collectionIds)
    ? input.collectionIds.map(id => validObjectId(id, "collection ID")!)
    : [];

  try {
    return await Product.create({
      ...input,
      name, slug, sku, price, compareAtPrice,
      ...(categoryId ? { categoryId } : {}),
      ...(subcategoryId ? { subcategoryId } : {}),
      ...(brandId ? { brandId } : {}),
      ...(defaultImageId ? { defaultImageId } : {}),
      ...(createdBy ? { createdBy } : {}),
      collectionIds,
    });
  } catch (error) {
    return handleDuplicate(error);
  }
}

export async function listProducts(query: Record<string, unknown>, publicOnly = false) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  if (!Number.isInteger(page) || page < 1) throw ApiError.badRequest("Page must be a positive integer.");
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw ApiError.badRequest("Limit must be between 1 and 100.");

  const filter: Record<string, unknown> = {};
  if (publicOnly) filter.status = PRODUCT_STATUSES.ACTIVE;
  else if (query.status) filter.status = query.status;

  for (const field of ["categoryId", "subcategoryId", "brandId"] as const) {
    const id = validObjectId(query[field], field);
    if (id) filter[field] = id;
  }

  if (typeof query.type === "string") filter.type = query.type;
  if (typeof query.isFeatured === "boolean") filter.isFeatured = query.isFeatured;
  if (typeof query.hasVariants === "boolean") filter.hasVariants = query.hasVariants;

  if (typeof query.search === "string" && query.search.trim()) {
    const term = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: term, $options: "i" } },
      { description: { $regex: term, $options: "i" } },
      { sku: { $regex: term, $options: "i" } },
    ];
  }

  const allowedSort = ["name", "price", "createdAt", "updatedAt"];
  const sortBy = allowedSort.includes(String(query.sortBy)) ? String(query.sortBy) : "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;
  const [items, total] = await Promise.all([
    Product.find(filter).sort({ [sortBy]: sortOrder, _id: sortOrder })
      .skip((page - 1) * limit).limit(limit).lean().exec(),
    Product.countDocuments(filter).exec(),
  ]);
  const totalPages = Math.ceil(total / limit);
  return {
    items,
    pagination: {
      page, limit, total, totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getProductById(id: string, publicOnly = false) {
  if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest("Invalid product ID.");
  const filter: Record<string, unknown> = { _id: new Types.ObjectId(id) };
  if (publicOnly) filter.status = PRODUCT_STATUSES.ACTIVE;
  const product = await Product.findOne(filter).exec();
  if (!product) throw ApiError.notFound("Product not found.");
  return product;
}

export async function getProductBySlug(slug: string) {
  const normalizedSlug = slugify(slug);
  const product = await Product.findOne({
    slug: normalizedSlug,
    status: PRODUCT_STATUSES.ACTIVE,
  }).exec();
  if (!product) throw ApiError.notFound("Product not found.");
  return product;
}

export async function updateProduct(id: string, input: Record<string, unknown>) {
  const current = await getProductById(id);
  const nextPrice = input.price === undefined ? current.price : Number(input.price);
  const nextCompare = input.compareAtPrice === undefined
    ? current.compareAtPrice
    : input.compareAtPrice === null ? undefined : Number(input.compareAtPrice);

  if (!Number.isFinite(nextPrice) || nextPrice <= 0) throw ApiError.badRequest("Price must be greater than zero.");
  if (nextCompare !== undefined && (!Number.isFinite(nextCompare) || nextCompare < nextPrice)) {
    throw ApiError.badRequest("compareAtPrice must be greater than or equal to price.");
  }

  const update: Record<string, unknown> = { ...input };
  if (typeof update.name === "string" && update.slug === undefined) update.slug = slugify(update.name);
  if (typeof update.slug === "string") update.slug = slugify(update.slug);
  if (typeof update.sku === "string") update.sku = update.sku.trim().toUpperCase();

  for (const field of ["categoryId", "subcategoryId", "brandId", "defaultImageId", "updatedBy"] as const) {
    if (field in update) {
      const idValue = update[field];
      if (idValue === null && ["categoryId", "subcategoryId", "brandId", "defaultImageId"].includes(field)) {
        delete update[field];
        current.set(field, undefined);
      } else {
        update[field] = validObjectId(idValue, field);
      }
    }
  }

  if (Array.isArray(update.collectionIds)) {
    update.collectionIds = update.collectionIds.map(id => validObjectId(id, "collection ID")!);
  }

  try {
    Object.assign(current, update);
    await current.save();
    return current;
  } catch (error) {
    return handleDuplicate(error);
  }
}

export async function updateProductStatus(id: string, status: ProductStatus) {
  return updateProduct(id, { status });
}

export async function deleteProduct(id: string) {
  const product = await getProductById(id);
  product.status = PRODUCT_STATUSES.ARCHIVED;
  await product.save();
}
