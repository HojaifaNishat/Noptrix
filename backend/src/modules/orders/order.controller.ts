import type { Request, Response } from "express";

import { getAuthenticatedUserId } from "../../middlewares/userAuth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";

import {
  createOrderFromCheckout,
  getCustomerOrder,
  listCustomerOrders,
  updateOrderStatus,
} from "./order.service";

const getUserId = (req: Request): string => getAuthenticatedUserId(req);

const getParam = (req: Request, key: string): string => {
  const value = req.params[key];

  if (typeof value !== "string" || !value.trim()) {
    throw ApiError.badRequest(`Invalid ${key}.`);
  }

  return value;
};

export const createOrderController = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await createOrderFromCheckout(
      getUserId(req),
      req.body.checkoutId,
    );

    res.status(201).json({
      success: true,
      message: "Order created successfully.",
      data: order,
    });
  },
);

export const getCustomerOrderController = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await getCustomerOrder(
      getUserId(req),
      getParam(req, "orderId"),
    );

    res.status(200).json({
      success: true,
      message: "Order retrieved successfully.",
      data: order,
    });
  },
);

export const listCustomerOrdersController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await listCustomerOrders(getUserId(req), req.query as never);

    res.status(200).json({
      success: true,
      message: "Orders retrieved successfully.",
      data: result.items,
      pagination: result.pagination,
    });
  },
);

export const updateOrderStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await updateOrderStatus(getParam(req, "orderId"), req.body);

    res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      data: order,
    });
  },
);
