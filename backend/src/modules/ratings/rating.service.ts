import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import ProductModel from "../products/product.model";
import RatingModel from "./rating.model";
import type { RatingListQuery } from "./rating.types";

function objectId(id: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest(`Invalid ${label}.`);
  }
  return new Types.ObjectId(id);
}

async function ensureProduct(productId: string): Promise<Types.ObjectId> {
  const id = objectId(productId, "product ID");
  const exists = await ProductModel.exists({ _id: id });
  if (!exists) throw ApiError.notFound("Product not found.");
  return id;
}

export async function createRating(
  userId: string,
  input: {
    productId: string;
    value: number;
  },
) {
  const userObjectId = objectId(userId, "user ID");
  const productObjectId = await ensureProduct(input.productId);

  try {
    return await RatingModel.create({
      userId: userObjectId,
      productId: productObjectId,
      value: input.value,
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw ApiError.conflict(
        "You have already rated this product. Update your existing rating instead.",
      );
    }
    throw error;
  }
}

export async function updateRating(
  userId: string,
  ratingId: string,
  value: number,
) {
  const rating = await RatingModel.findOneAndUpdate(
    {
      _id: objectId(ratingId, "rating ID"),
      userId: objectId(userId, "user ID"),
    },
    { $set: { value } },
    { new: true, runValidators: true },
  );

  if (!rating) {
    throw ApiError.notFound("Rating not found or you do not own it.");
  }
  return rating;
}

export async function deleteRating(userId: string, ratingId: string) {
  const rating = await RatingModel.findOneAndDelete({
    _id: objectId(ratingId, "rating ID"),
    userId: objectId(userId, "user ID"),
  });

  if (!rating) {
    throw ApiError.notFound("Rating not found or you do not own it.");
  }
  return { deleted: true, ratingId: rating._id };
}

export async function getProductRatingSummary(productId: string) {
  const id = await ensureProduct(productId);

  const [result] = await RatingModel.aggregate([
    { $match: { productId: id } },
    {
      $group: {
        _id: "$productId",
        totalRatings: { $sum: 1 },
        averageRating: { $avg: "$value" },
        oneStar: { $sum: { $cond: [{ $eq: ["$value", 1] }, 1, 0] } },
        twoStar: { $sum: { $cond: [{ $eq: ["$value", 2] }, 1, 0] } },
        threeStar: { $sum: { $cond: [{ $eq: ["$value", 3] }, 1, 0] } },
        fourStar: { $sum: { $cond: [{ $eq: ["$value", 4] }, 1, 0] } },
        fiveStar: { $sum: { $cond: [{ $eq: ["$value", 5] }, 1, 0] } },
      },
    },
  ]);

  return {
    productId,
    totalRatings: result?.totalRatings ?? 0,
    averageRating: result ? Math.round(result.averageRating * 100) / 100 : 0,
    distribution: {
      1: result?.oneStar ?? 0,
      2: result?.twoStar ?? 0,
      3: result?.threeStar ?? 0,
      4: result?.fourStar ?? 0,
      5: result?.fiveStar ?? 0,
    },
  };
}

export async function listProductRatings(
  productId: string,
  query: RatingListQuery,
) {
  const id = await ensureProduct(productId);
  const filter: Record<string, unknown> = { productId: id };

  if (query.value !== undefined) filter.value = query.value;

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    RatingModel.find(filter)
      .select("productId value createdAt updatedAt")
      .populate({ path: "userId", select: "name avatarUrl" })
      .sort({ createdAt: query.sortOrder === "asc" ? 1 : -1, _id: 1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),
    RatingModel.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
      hasNextPage: skip + items.length < total,
      hasPreviousPage: query.page > 1,
    },
  };
}

export async function getMyProductRating(userId: string, productId: string) {
  const productObjectId = await ensureProduct(productId);

  return RatingModel.findOne({
    userId: objectId(userId, "user ID"),
    productId: productObjectId,
  }).lean();
}
