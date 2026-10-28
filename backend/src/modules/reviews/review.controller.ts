import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { getAuthenticatedUserId } from "../../middlewares/userAuth.middleware";
import {
  createReview,
  deleteMyReview,
  getMyReviews,
  getProductReviews,
  moderateReview,
  updateMyReview,
} from "./review.service";
import {
  createReviewSchema,
  moderateReviewSchema,
  reviewListQuerySchema,
  updateReviewSchema,
} from "./review.validator";

export const createReviewController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const input = createReviewSchema.parse(req.body);
    const review = await createReview(getAuthenticatedUserId(req), input);
    res
      .status(201)
      .json(
        ApiResponse.created(
          review,
          "Review submitted for moderation",
        ).serialize(),
      );
  },
);

export const updateMyReviewController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const input = updateReviewSchema.parse(req.body);
    const review = await updateMyReview(
      getAuthenticatedUserId(req),
      String(req.params.reviewId),
      input,
    );
    res.status(200).json(ApiResponse.ok(review, "Review updated").serialize());
  },
);

export const deleteMyReviewController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await deleteMyReview(
      getAuthenticatedUserId(req),
      String(req.params.reviewId),
    );
    res.status(200).json(ApiResponse.ok(result, "Review deleted").serialize());
  },
);

export const getProductReviewsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const query = reviewListQuerySchema.parse(req.query);
    if (!req.params.productId) {
      res
        .status(400)
        .json(ApiResponse.ok(null, "Product ID is required").serialize());
      return;
    }

    const result = await getProductReviews(String(req.params.productId), {
      page: query.page,
      limit: query.limit,
      rating: query.rating,
    });

    res.status(200).json(
      ApiResponse.ok(result.items, "Product reviews", {
        ...result.pagination,
        summary: result.summary,
      }).serialize(),
    );
  },
);

export const getMyReviewsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const query = reviewListQuerySchema.parse(req.query);
    const result = await getMyReviews(getAuthenticatedUserId(req), {
      page: query.page,
      limit: query.limit,
    });
    res
      .status(200)
      .json(
        ApiResponse.ok(
          result.items,
          "Your reviews",
          result.pagination,
        ).serialize(),
      );
  },
);

export const moderateReviewController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const input = moderateReviewSchema.parse(req.body);
    const review = await moderateReview(
      String(req.params.reviewId),
      input.status,
    );

    res
      .status(200)
      .json(ApiResponse.ok(review, "Review moderation completed").serialize());
  },
);
