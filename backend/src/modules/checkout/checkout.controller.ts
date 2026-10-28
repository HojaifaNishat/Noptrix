import type { Request, Response } from "express";

import { getAuthenticatedUserId } from "../../middlewares/userAuth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";

import {
  cancelCheckout,
  createCheckout,
  getCheckout,
  getCheckoutByToken,
  listCheckouts,
} from "./checkout.service";

const getUserId = (req: Request): string => getAuthenticatedUserId(req);

const getParam = (req: Request, key: string): string => {
  const value = req.params[key];

  if (typeof value !== "string" || !value.trim()) {
    throw ApiError.badRequest(`Invalid ${key}.`);
  }

  return value;
};

export const createCheckoutController = asyncHandler(
  async (req: Request, res: Response) => {
    const checkout = await createCheckout(getUserId(req), req.body);

    res.status(201).json({
      success: true,
      message: "Checkout created successfully.",
      data: checkout,
    });
  },
);

export const getCheckoutController = asyncHandler(
  async (req: Request, res: Response) => {
    const checkout = await getCheckout(
      getUserId(req),
      getParam(req, "checkoutId"),
    );

    res.status(200).json({
      success: true,
      message: "Checkout retrieved successfully.",
      data: checkout,
    });
  },
);

export const getCheckoutByTokenController = asyncHandler(
  async (req: Request, res: Response) => {
    const checkout = await getCheckoutByToken(
      getUserId(req),
      getParam(req, "checkoutToken"),
    );

    res.status(200).json({
      success: true,
      message: "Checkout retrieved successfully.",
      data: checkout,
    });
  },
);

export const listCheckoutsController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await listCheckouts(getUserId(req), req.query as never);

    res.status(200).json({
      success: true,
      message: "Checkouts retrieved successfully.",
      data: result.items,
      pagination: result.pagination,
    });
  },
);

export const cancelCheckoutController = asyncHandler(
  async (req: Request, res: Response) => {
    const checkout = await cancelCheckout(
      getUserId(req),
      getParam(req, "checkoutId"),
    );

    res.status(200).json({
      success: true,
      message: "Checkout cancelled successfully.",
      data: checkout,
    });
  },
);
