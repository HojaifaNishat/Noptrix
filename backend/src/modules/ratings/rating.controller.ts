import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { getAuthenticatedUserId } from "../../middlewares/userAuth.middleware";
import {
  createRating,
  deleteRating,
  getMyProductRating,
  getProductRatingSummary,
  listProductRatings,
  updateRating,
} from "./rating.service";

function param(req: Request, key: string): string {
  const value = req.params[key];
  if (typeof value !== "string") {
    throw new Error(`Invalid route parameter: ${key}`);
  }
  return value;
}

function userId(req: Request): string {
  return getAuthenticatedUserId(req);
}

export const createRatingController = asyncHandler(
  async (req: Request, res: Response) => {
    const rating = await createRating(userId(req), req.body);
    res
      .status(201)
      .json(
        ApiResponse.created(rating, "Rating created successfully.").serialize(),
      );
  },
);

export const updateRatingController = asyncHandler(
  async (req: Request, res: Response) => {
    const rating = await updateRating(
      userId(req),
      param(req, "ratingId"),
      req.body.value,
    );
    res
      .status(200)
      .json(ApiResponse.ok(rating, "Rating updated successfully.").serialize());
  },
);

export const deleteRatingController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await deleteRating(userId(req), param(req, "ratingId"));
    res
      .status(200)
      .json(ApiResponse.ok(result, "Rating deleted successfully.").serialize());
  },
);

export const getProductRatingSummaryController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getProductRatingSummary(param(req, "productId"));
    res
      .status(200)
      .json(ApiResponse.ok(result, "Rating summary retrieved.").serialize());
  },
);

export const listProductRatingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await listProductRatings(
      param(req, "productId"),
      req.query as never,
    );
    res
      .status(200)
      .json(
        ApiResponse.ok(
          result.items,
          "Ratings retrieved.",
          result.pagination,
        ).serialize(),
      );
  },
);

export const getMyProductRatingController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getMyProductRating(
      userId(req),
      param(req, "productId"),
    );
    res
      .status(200)
      .json(
        ApiResponse.ok(result, "Your product rating retrieved.").serialize(),
      );
  },
);
