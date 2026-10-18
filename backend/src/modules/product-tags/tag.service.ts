import mongoose from "mongoose";
import { Types } from "mongoose";

import { ApiError } from "../../utils/ApiError";
import ProductModel from "../products/product.model";
import { ProductTag } from "./tag.model";
import { ProductTagAssignment } from "./product-tag-assignment.model";

const slugify = (value: string): string =>
  value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function throwIfDuplicate(error: unknown): never {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  ) {
    throw ApiError.conflict("A product tag with this slug already exists.", {
      code: "PRODUCT_TAG_DUPLICATE",
    });
  }

  throw error;
}

function normalizeSlug(name: string, suppliedSlug?: string): string {
  return slugify(suppliedSlug ?? name);
}

export interface ListProductTagsOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export async function listProductTags(
  options: ListProductTagsOptions = {},
) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (options.search?.trim()) {
    const escaped = options.search.trim().replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { slug: { $regex: escaped, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    ProductTag.find(filter)
      .sort({ name: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    ProductTag.countDocuments(filter).exec(),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
}

export async function createProductTag(
  input: {
    name: string;
    slug?: string;
    description?: string;
  },
) {
  const name = input.name.trim();
  const slug = normalizeSlug(name, input.slug);

  if (!slug || slug.length < 2 || slug.length > 120) {
    throw ApiError.badRequest("A valid tag slug could not be generated.");
  }

  try {
    return await ProductTag.create({
      name,
      slug,
      description: input.description,
    });
  } catch (error) {
    return throwIfDuplicate(error);
  }
}

export async function updateProductTag(
  id: string,
  input: {
    name?: string;
    slug?: string;
    description?: string | null;
  },
) {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid product tag ID.");
  }

  const tag = await ProductTag.findById(id).exec();

  if (!tag) {
    throw ApiError.notFound("Product tag not found.");
  }

  if (input.name !== undefined) {
    tag.name = input.name.trim();
  }

  if (input.slug !== undefined || input.name !== undefined) {
    const slug = normalizeSlug(
      tag.name,
      input.slug,
    );

    if (!slug || slug.length < 2 || slug.length > 120) {
      throw ApiError.badRequest("A valid tag slug could not be generated.");
    }

    tag.slug = slug;
  }

  if (input.description !== undefined) {
    if (input.description === null) {
      tag.set("description", undefined);
    } else {
      tag.description = input.description;
    }
  }

  try {
    await tag.save();
    return tag;
  } catch (error) {
    return throwIfDuplicate(error);
  }
}

export async function deleteProductTag(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid product tag ID.");
  }

  const tag = await ProductTag.findById(id).exec();

  if (!tag) {
    throw ApiError.notFound("Product tag not found.");
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await ProductTagAssignment.deleteMany(
        { tagId: tag._id },
        { session },
      ).exec();

      await tag.deleteOne({ session });
    });
  } finally {
    await session.endSession();
  }
}

export async function assignProductTag(
  productId: string,
  tagId: string,
) {
  if (
    !Types.ObjectId.isValid(productId) ||
    !Types.ObjectId.isValid(tagId)
  ) {
    throw ApiError.badRequest("Invalid product or tag ID.");
  }

  const productObjectId = new Types.ObjectId(productId);
  const tagObjectId = new Types.ObjectId(tagId);

  const [product, tag] = await Promise.all([
    ProductModel.exists({ _id: productObjectId }).exec(),
    ProductTag.exists({ _id: tagObjectId }).exec(),
  ]);

  if (!product) {
    throw ApiError.notFound("Product not found.");
  }

  if (!tag) {
    throw ApiError.notFound("Product tag not found.");
  }

  try {
    return await ProductTagAssignment.create({
      productId: productObjectId,
      tagId: tagObjectId,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw ApiError.conflict("This tag is already assigned to the product.", {
        code: "PRODUCT_TAG_ALREADY_ASSIGNED",
      });
    }

    throw error;
  }
}

export async function listTagsForProduct(productId: string) {
  if (!Types.ObjectId.isValid(productId)) {
    throw ApiError.badRequest("Invalid product ID.");
  }

  const productObjectId = new Types.ObjectId(productId);

  const productExists = await ProductModel.exists({
    _id: productObjectId,
  }).exec();

  if (!productExists) {
    throw ApiError.notFound("Product not found.");
  }

  return ProductTagAssignment.find({
    productId: productObjectId,
  })
    .sort({ createdAt: 1, _id: 1 })
    .populate({
      path: "tagId",
      select: "name slug description createdAt updatedAt",
    })
    .lean()
    .exec();
}

export async function unassignProductTag(
  productId: string,
  tagId: string,
) {
  if (
    !Types.ObjectId.isValid(productId) ||
    !Types.ObjectId.isValid(tagId)
  ) {
    throw ApiError.badRequest("Invalid product or tag ID.");
  }

  const result = await ProductTagAssignment.deleteOne({
    productId: new Types.ObjectId(productId),
    tagId: new Types.ObjectId(tagId),
  }).exec();

  if (result.deletedCount === 0) {
    throw ApiError.notFound("Product tag assignment not found.");
  }
}
