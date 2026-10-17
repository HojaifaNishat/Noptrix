import mongoose, { Types } from "mongoose";

import { ApiError } from "../../utils/ApiError";
import ProductModel from "./product.model";

import type {
  ProductInput,
  ProductListQuery,
  ProductStatus,
  ProductUpdateInput,
} from "./product.types";

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeSlug = (value: string): string =>
  value.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);

const normalizeSku = (value?: string): string | undefined =>
  value?.trim().toUpperCase() || undefined;

const normalizeBarcode = (value?: string): string | undefined =>
  value?.trim() || undefined;

function throwDuplicateKey(error: unknown): never {
  const mongoError = error as {
    code?: number;
    keyPattern?: Record<string, unknown>;
  };

  if (mongoError?.code === 11000) {
    const field = Object.keys(mongoError.keyPattern ?? {})[0];

    throw ApiError.conflict(
      `A product with this ${field || "unique field"} already exists.`,
      { code: "DUPLICATE_PRODUCT_FIELD" },
    );
  }

  throw error;
}

function validatePriceRelationship(
  price?: number,
  compareAtPrice?: number,
): void {
  if (
    price !== undefined &&
    compareAtPrice !== undefined &&
    compareAtPrice <= price
  ) {
    throw ApiError.badRequest(
      "compareAtPrice must be greater than price.",
    );
  }
}

function getModel(name: string) {
  try {
    return mongoose.model(name);
  } catch {
    throw ApiError.internal(
      `The ${name} model has not been registered.`,
    );
  }
}

async function assertReferencesExist(
  input: Partial<ProductInput>,
): Promise<void> {
  if (input.categoryId) {
    const category = await getModel("Category")
      .exists({ _id: input.categoryId });

    if (!category) {
      throw ApiError.notFound("Category does not exist.");
    }
  }

  if (input.subcategoryId) {
    const subcategory = await getModel("Subcategory")
      .findById(input.subcategoryId)
      .select("categoryId")
      .lean();

    if (!subcategory) {
      throw ApiError.notFound("Subcategory does not exist.");
    }

    const subcategoryCategoryId = (
      subcategory as unknown as {
        categoryId?: Types.ObjectId;
      }
    ).categoryId;

    if (
      input.categoryId &&
      String(subcategoryCategoryId) !== String(input.categoryId)
    ) {
      throw ApiError.badRequest(
        "Subcategory does not belong to the selected category.",
      );
    }
  }

  if (input.brandId) {
    const brand = await getModel("Brand")
      .exists({ _id: input.brandId });

    if (!brand) {
      throw ApiError.notFound("Brand does not exist.");
    }
  }

  if (input.collectionIds?.length) {
    const uniqueIds = [...new Set(input.collectionIds)];

    const count = await getModel("Collection")
      .countDocuments({ _id: { $in: uniqueIds } });

    if (count !== uniqueIds.length) {
      throw ApiError.badRequest(
        "One or more collections do not exist.",
      );
    }
  }
}

function validateProductRules(
  input: Partial<ProductInput>,
): void {
  if (
    input.type === "DIGITAL" &&
    input.requiresShipping === true
  ) {
    throw ApiError.badRequest(
      "Digital products cannot require shipping.",
    );
  }
}

export async function createProduct(
  input: ProductInput,
  actorId?: string,
) {
  const name = input.name.trim();
  const slug = normalizeSlug(input.slug || name);

  if (!slug) {
    throw ApiError.badRequest("A valid product slug is required.");
  }

  validatePriceRelationship(input.price, input.compareAtPrice);
  validateProductRules(input);
  await assertReferencesExist(input);

  const payload: Record<string, unknown> = {
    ...input,
    name,
    slug,
    sku: normalizeSku(input.sku),
    barcode: normalizeBarcode(input.barcode),
    tags: [...new Set((input.tags ?? []).map((tag) => tag.trim()))],
    collectionIds: input.collectionIds ?? [],
  };

  if (actorId && Types.ObjectId.isValid(actorId)) {
    payload.createdBy = new Types.ObjectId(actorId);
    payload.updatedBy = new Types.ObjectId(actorId);
  }

  try {
    return await ProductModel.create(payload);
  } catch (error) {
    throwDuplicateKey(error);
  }
}

export async function getProductById(
  id: string,
  options: {
    includeArchived?: boolean;
    includeCostPrice?: boolean;
  } = {},
) {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid product ID.");
  }

  const query = ProductModel.findById(id);

  if (!options.includeArchived) {
    query.where({ status: { $ne: "ARCHIVED" } });
  }

  if (options.includeCostPrice) {
    query.select("+costPrice");
  }

  const product = await query;

  if (!product) {
    throw ApiError.notFound("Product not found.");
  }

  return product;
}

export async function getProductBySlug(
  slug: string,
  options: { includeArchived?: boolean } = {},
) {
  const query = ProductModel.findOne({
    slug: normalizeSlug(slug),
    ...(options.includeArchived ? {} : { status: "ACTIVE" }),
  });

  const product = await query;

  if (!product) {
    throw ApiError.notFound("Product not found.");
  }

  return product;
}

export async function listProducts(
  query: ProductListQuery,
  options: { publicOnly?: boolean } = {},
) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  // A flexible MongoDB filter avoids relying on an unavailable
  // Mongoose FilterQuery export in this project.
  const filter: Record<string, any> = {};

  if (options.publicOnly) {
    filter.status = "ACTIVE";
  } else if (query.status) {
    filter.status = query.status;
  } else {
    filter.status = { $ne: "ARCHIVED" };
  }

  if (query.type) filter.type = query.type;
  if (query.categoryId) filter.categoryId = query.categoryId;
  if (query.subcategoryId) filter.subcategoryId = query.subcategoryId;
  if (query.brandId) filter.brandId = query.brandId;

  if (query.featured !== undefined) {
    filter.featured = query.featured;
  }

  if (
    query.minPrice !== undefined ||
    query.maxPrice !== undefined
  ) {
    filter.price = {
      ...(query.minPrice !== undefined && { $gte: query.minPrice }),
      ...(query.maxPrice !== undefined && { $lte: query.maxPrice }),
    };
  }

  if (query.inStock === true) {
    filter.$or = [
      { trackInventory: false },
      { stockQuantity: { $gt: 0 } },
      { inventoryPolicy: "CONTINUE" },
    ];
  } else if (query.inStock === false) {
    filter.trackInventory = true;
    filter.stockQuantity = { $lte: 0 };
    filter.inventoryPolicy = "DENY";
  }

  if (query.search?.trim()) {
    const safeSearch = escapeRegex(query.search.trim());

    filter.$and = [
      {
        $or: [
          { name: { $regex: safeSearch, $options: "i" } },
          { sku: { $regex: safeSearch, $options: "i" } },
          { barcode: { $regex: safeSearch, $options: "i" } },
          { shortDescription: { $regex: safeSearch, $options: "i" } },
        ],
      },
    ];
  }

  const allowedSortFields = [
    "createdAt",
    "updatedAt",
    "name",
    "price",
    "sortOrder",
  ];

  const sortBy = allowedSortFields.includes(query.sortBy ?? "")
    ? query.sortBy!
    : "createdAt";

  const sortDirection = query.sortOrder === "asc" ? 1 : -1;
  const sort: Record<string, 1 | -1> = {
    [sortBy]: sortDirection,
    _id: -1,
  };

  const [items, total] = await Promise.all([
    ProductModel.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("categoryId", "name slug")
      .populate("subcategoryId", "name slug")
      .populate("brandId", "name slug")
      .lean(),

    ProductModel.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export async function updateProduct(
  id: string,
  input: ProductUpdateInput,
  actorId?: string,
) {
  const product = await getProductById(id, {
    includeArchived: true,
  });

  if (product.status === "ARCHIVED") {
    throw ApiError.conflict("Archived products cannot be edited.");
  }

  const nextPrice = input.price ?? product.price;
  const nextCompareAt =
    input.compareAtPrice !== undefined
      ? input.compareAtPrice
      : product.compareAtPrice;

  validatePriceRelationship(nextPrice, nextCompareAt);

  validateProductRules({
    type: input.type ?? product.type,
    requiresShipping:
      input.requiresShipping ?? product.requiresShipping,
  });

  const nextCategoryId =
    input.categoryId ?? String(product.categoryId);

  const nextSubcategoryId =
    input.subcategoryId !== undefined
      ? input.subcategoryId
      : product.subcategoryId
        ? String(product.subcategoryId)
        : undefined;

  const nextBrandId =
    input.brandId !== undefined
      ? input.brandId
      : product.brandId
        ? String(product.brandId)
        : undefined;

  await assertReferencesExist({
    categoryId: nextCategoryId,
    subcategoryId: nextSubcategoryId,
    brandId: nextBrandId,
    collectionIds: input.collectionIds,
  });

  const updates: Record<string, unknown> = { ...input };

  if (input.name && input.slug === undefined) {
    updates.slug = normalizeSlug(input.name);
  } else if (input.slug !== undefined) {
    updates.slug = normalizeSlug(input.slug);
  }

  if (updates.slug === "") {
    throw ApiError.badRequest("A valid product slug is required.");
  }

  if (input.sku !== undefined) {
    updates.sku = normalizeSku(input.sku);
  }

  if (input.barcode !== undefined) {
    updates.barcode = normalizeBarcode(input.barcode);
  }

  if (input.tags !== undefined) {
    updates.tags = [...new Set(input.tags.map((tag) => tag.trim()))];
  }

  if (input.collectionIds !== undefined) {
    updates.collectionIds = input.collectionIds;
  }

  if (actorId && Types.ObjectId.isValid(actorId)) {
    updates.updatedBy = new Types.ObjectId(actorId);
  }

  try {
    Object.assign(product, updates);
    await product.save();
    return product;
  } catch (error) {
    throwDuplicateKey(error);
  }
}

export async function updateProductStatus(
  id: string,
  status: ProductStatus,
  actorId?: string,
) {
  const product = await getProductById(id, {
    includeArchived: true,
  });

  if (product.status === "ARCHIVED" && status !== "ARCHIVED") {
    throw ApiError.conflict(
      "Archived products cannot be reactivated through status update.",
    );
  }

  product.status = status;

  if (actorId && Types.ObjectId.isValid(actorId)) {
    product.updatedBy = new Types.ObjectId(actorId);
  }

  if (status === "ARCHIVED") {
    product.archivedAt = new Date();
  } else {
    product.archivedAt = undefined;
  }

  await product.save();
  return product;
}

export async function archiveProduct(
  id: string,
  actorId?: string,
) {
  return updateProductStatus(id, "ARCHIVED", actorId);
}
