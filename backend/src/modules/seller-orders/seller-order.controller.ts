import type { Request, Response, NextFunction } from "express";

import { getAuthenticatedSellerId } from "../../middlewares/sellerAuth.middleware";

import { getSellerOrder, listSellerOrders } from "./seller-order.service";
import {
  ORDER_PAYMENT_STATUSES,
  ORDER_STATUSES,
  type OrderPaymentStatus,
  type OrderStatus,
} from "../orders/order.types";

const isOrderStatus = (value: string): value is OrderStatus =>
  ORDER_STATUSES.some((status) => status === value);

const isOrderPaymentStatus = (value: string): value is OrderPaymentStatus =>
  ORDER_PAYMENT_STATUSES.some((status) => status === value);

export const listSellerOrdersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sellerId = getAuthenticatedSellerId(req);

    const result = await listSellerOrders(sellerId, {
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20),
      status:
        typeof req.query.status === "string" && isOrderStatus(req.query.status)
          ? req.query.status
          : undefined,
      paymentStatus:
        typeof req.query.paymentStatus === "string" &&
        isOrderPaymentStatus(req.query.paymentStatus)
          ? req.query.paymentStatus
          : undefined,
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,
      sort: req.query.sort === "oldest" ? "oldest" : "newest",
    });

    res.status(200).json({
      success: true,
      message: "Seller orders retrieved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getSellerOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sellerId = getAuthenticatedSellerId(req);
    const orderId = req.params.orderId;

    if (typeof orderId !== "string" || !orderId) {
      res.status(400).json({
        success: false,
        message: "A valid order ID is required.",
      });
      return;
    }

    const order = await getSellerOrder(
      sellerId,
      String(Array.isArray(orderId) ? orderId[0] : orderId),
    );

    res.status(200).json({
      success: true,
      message: "Seller order retrieved successfully.",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
