import { Types } from "mongoose";
import ReviewModel from "./review.model";
import { User } from "../users/user.model";
import ProductModel from "../products/product.model";
import OrderModel from "../orders/order.model";
import { ApiError } from "../../utils/ApiError";
import { REVIEW_STATUSES } from "./review.types";

function validObjectId(value: string): boolean {
  return Types.ObjectId.isValid(value);
}

async function requireActiveUser(userId: string) {
  if (!validObjectId(userId)) {
    throw ApiError.unauthorized("Invalid authenticated user");
  }

  const user = await User.findById(userId).select("_id status").lean();

  if (!user) throw ApiError.unauthorized("User not found");

  if (user.status !== "ACTIVE") {
    throw ApiError.forbidden("Your account is not active");
  }

  return user;
}

/**
 * Keep order verification conservative: the order must belong to the
 * authenticated customer and contain the requested product.
 * If your order schema uses different field names, adapt this helper.
 */
async function verifyPurchase(
  userId: string,
  orderId: string,
  productId: string,
): Promise<boolean> {
  const order = (await OrderModel.findOne({
    _id: orderId,
    userId,
  }).lean()) as Record<string, unknown> | null;

  if (!order) {
    throw ApiError.forbidden("Order not found for this customer");
  }

  const items: unknown[] = Array.isArray(order.items)
    ? order.items
    : Array.isArray(order.itemsSnapshot)
      ? order.itemsSnapshot
      : [];

  const hasProduct = items.some((rawItem) => {
    if (!rawItem || typeof rawItem !== "object") return false;
    const item = rawItem as Record<string, unknown>;
    const productSnapshot =
      item.productSnapshot && typeof item.productSnapshot === "object"
        ? (item.productSnapshot as Record<string, unknown>)
        : {};
    const candidate =
      item.productId ??
      item.product ??
      productSnapshot.productId ??
      productSnapshot._id;

    const candidateId =
      candidate && typeof candidate === "object"
        ? String(
            (candidate as Record<string, unknown>)._id ??
              (candidate as Record<string, unknown>).id ??
              candidate,
          )
        : String(candidate ?? "");

    return candidateId === productId;
  });

  if (!hasProduct) {
    throw ApiError.forbidden(
      "This product is not present in the supplied order",
    );
  }

  const orderStatus = String(order.status ?? "").toUpperCase();
  const paymentStatus = String(order.paymentStatus ?? "").toUpperCase();

  if (
    orderStatus !== "DELIVERED" ||
    !["PAID", "PARTIALLY_REFUNDED"].includes(paymentStatus)
  ) {
    throw ApiError.forbidden(
      "Reviews require a delivered order with a completed payment",
    );
  }

  return true;
}

export async function createReview(
  userId: string,
  input: {
    productId: string;
    orderId: string;
    rating: number;
    title?: string;
    comment: string;
  },
) {
  await requireActiveUser(userId);

  if (!validObjectId(input.productId) || !validObjectId(input.orderId)) {
    throw ApiError.badRequest("Invalid product or order ID");
  }

  const product = await ProductModel.findById(input.productId)
    .select("_id")
    .lean();

  if (!product) throw ApiError.notFound("Product not found");

  const verifiedPurchase = await verifyPurchase(
    userId,
    input.orderId,
    input.productId,
  );

  try {
    return await ReviewModel.create({
      ...input,
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(input.productId),
      orderId: new Types.ObjectId(input.orderId),
      verifiedPurchase,
      status: REVIEW_STATUSES.PENDING,
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw ApiError.conflict(
        "You have already reviewed this product for this order",
      );
    }
    throw error;
  }
}

export async function updateMyReview(
  userId: string,
  reviewId: string,
  input: {
    rating?: number;
    title?: string;
    comment?: string;
  },
) {
  await requireActiveUser(userId);

  if (!validObjectId(reviewId)) {
    throw ApiError.badRequest("Invalid review ID");
  }

  const review = await ReviewModel.findOne({
    _id: reviewId,
    userId,
  });

  if (!review) throw ApiError.notFound("Review not found");

  if (review.status === REVIEW_STATUSES.APPROVED) {
    throw ApiError.forbidden("Approved reviews cannot be edited");
  }

  if (input.rating !== undefined) review.rating = input.rating;
  if (input.title !== undefined) review.title = input.title;
  if (input.comment !== undefined) review.comment = input.comment;

  review.status = REVIEW_STATUSES.PENDING;
  await review.save();

  return review;
}

export async function deleteMyReview(userId: string, reviewId: string) {
  await requireActiveUser(userId);

  if (!validObjectId(reviewId)) {
    throw ApiError.badRequest("Invalid review ID");
  }

  const review = await ReviewModel.findOneAndDelete({
    _id: reviewId,
    userId,
  });

  if (!review) throw ApiError.notFound("Review not found");

  return { deleted: true, reviewId };
}

export async function moderateReview(
  reviewId: string,
  status: typeof REVIEW_STATUSES.APPROVED | typeof REVIEW_STATUSES.REJECTED,
) {
  if (!validObjectId(reviewId)) {
    throw ApiError.badRequest("Invalid review ID");
  }

  const review = await ReviewModel.findOneAndUpdate(
    {
      _id: reviewId,
      status: REVIEW_STATUSES.PENDING,
    },
    { $set: { status } },
    { new: true, runValidators: true },
  );

  if (review) return review;

  const existing = await ReviewModel.findById(reviewId).select("status").lean();
  if (!existing) throw ApiError.notFound("Review not found");

  throw ApiError.conflict("Only pending reviews can be moderated");
}

export async function getProductReviews(
  productId: string,
  options: {
    page: number;
    limit: number;
    rating?: number;
  },
) {
  if (!validObjectId(productId)) {
    throw ApiError.badRequest("Invalid product ID");
  }

  const product = await ProductModel.findById(productId).select("_id").lean();

  if (!product) throw ApiError.notFound("Product not found");

  const filter: Record<string, unknown> = {
    productId,
    status: REVIEW_STATUSES.APPROVED,
  };

  if (options.rating !== undefined) {
    filter.rating = options.rating;
  }

  const skip = (options.page - 1) * options.limit;

  const [items, total, stats] = await Promise.all([
    ReviewModel.find(filter)
      .populate("userId", "name avatarUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(options.limit)
      .lean(),
    ReviewModel.countDocuments(filter),
    ReviewModel.aggregate([
      {
        $match: {
          productId: new Types.ObjectId(productId),
          status: REVIEW_STATUSES.APPROVED,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          rating1: {
            $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] },
          },
          rating2: {
            $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] },
          },
          rating3: {
            $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] },
          },
          rating4: {
            $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] },
          },
          rating5: {
            $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const summary = stats[0] ?? {
    averageRating: 0,
    totalReviews: 0,
    rating1: 0,
    rating2: 0,
    rating3: 0,
    rating4: 0,
    rating5: 0,
  };

  return {
    items,
    summary: {
      averageRating: Number(summary.averageRating.toFixed(2)),
      totalReviews: summary.totalReviews,
      ratings: {
        1: summary.rating1,
        2: summary.rating2,
        3: summary.rating3,
        4: summary.rating4,
        5: summary.rating5,
      },
    },
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit),
    },
  };
}

export async function getMyReviews(
  userId: string,
  options: { page: number; limit: number },
) {
  await requireActiveUser(userId);

  const filter = { userId };
  const skip = (options.page - 1) * options.limit;

  const [items, total] = await Promise.all([
    ReviewModel.find(filter)
      .populate("productId", "name slug images")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(options.limit)
      .lean(),
    ReviewModel.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit),
    },
  };
}
