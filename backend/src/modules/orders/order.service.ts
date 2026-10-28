import { randomBytes } from "node:crypto";
import mongoose, { Types, type HydratedDocument } from "mongoose";

import { ApiError } from "../../utils/ApiError";

import CheckoutModel from "../checkout/checkout.model";
import { awardLoyaltyPointsForOrder } from "../loyalty/loyalty.service";
import OrderModel from "./order.model";

import type {
  Order,
  OrderListFilters,
  OrderStatus,
  UpdateOrderStatusInput,
} from "./order.types";

const toObjectId = (value: string): Types.ObjectId => {
  if (!/^[a-f\d]{24}$/i.test(value)) {
    throw ApiError.badRequest("Invalid MongoDB ObjectId.");
  }

  return new Types.ObjectId(value);
};

const normalizeUserId = (userId: string): Types.ObjectId => toObjectId(userId);

const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(5).toString("hex").toUpperCase();

  return `NPT-${timestamp}-${random}`;
};

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["READY_TO_SHIP", "CANCELLED"],
  READY_TO_SHIP: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["RETURN_REQUESTED", "RETURNED"],
  CANCELLED: [],
  RETURN_REQUESTED: ["RETURNED"],
  RETURNED: [],
};

export const createOrderFromCheckout = async (
  userIdInput: string,
  checkoutIdInput: string,
) => {
  const userId = normalizeUserId(userIdInput);
  const checkoutId = toObjectId(checkoutIdInput);

  const existingOrder = await OrderModel.findOne({
    checkoutId,
    userId,
  });

  if (existingOrder) return existingOrder;

  const session = await mongoose.startSession();
  let createdOrder: HydratedDocument<Order> | undefined;

  try {
    await session.withTransaction(async () => {
      const existing = await OrderModel.findOne({
        checkoutId,
        userId,
      }).session(session);

      if (existing) {
        createdOrder = existing;
        return;
      }

      const checkout = await CheckoutModel.findOne({
        _id: checkoutId,
        userId,
      }).session(session);

      if (!checkout) {
        throw ApiError.notFound("Checkout not found.");
      }

      if (checkout.status !== "PENDING") {
        throw ApiError.badRequest(
          "Only a pending checkout can be converted to an order.",
        );
      }

      if (checkout.expiresAt && checkout.expiresAt.getTime() <= Date.now()) {
        throw ApiError.badRequest("Checkout has expired.");
      }

      if (checkout.paymentStatus === "FAILED") {
        throw ApiError.badRequest(
          "Cannot create an order from a failed payment.",
        );
      }

      const orderDocuments = await OrderModel.create(
        [
          {
            orderNumber: generateOrderNumber(),
            userId,
            checkoutId: checkout._id,
            items: checkout.items.map((item) => ({
              productId: item.productId,
              ...(item.sellerId ? { sellerId: item.sellerId } : {}),
              ...(item.variantId ? { variantId: item.variantId } : {}),
              ...(item.sku ? { sku: item.sku } : {}),
              productName: item.productName,
              ...(item.variantName ? { variantName: item.variantName } : {}),
              quantity: item.quantity,
              fulfilledQuantity: 0,
              returnedQuantity: 0,
              unitPrice: item.unitPrice,
              discountAmount: 0,
              taxAmount: 0,
              lineTotal: item.lineSubtotal,
              currency: item.currency,
            })),
            shippingAddress: checkout.shippingAddress,
            ...(checkout.billingAddress
              ? {
                  billingAddress: checkout.billingAddress,
                }
              : {}),
            ...(checkout.shippingMethod
              ? { shippingMethod: checkout.shippingMethod }
              : {}),
            paymentMethod: checkout.paymentMethod,
            paymentStatus:
              checkout.paymentStatus === "PAID"
                ? "PAID"
                : checkout.paymentStatus === "AUTHORIZED"
                  ? "AUTHORIZED"
                  : "PENDING",
            fulfillmentStatus: "UNFULFILLED",
            status: "PENDING",
            totals: {
              currency: checkout.totals.currency,
              itemCount: checkout.totals.itemCount,
              subtotal: checkout.totals.subtotal,
              discountAmount: checkout.totals.discountAmount,
              shippingAmount: checkout.totals.shippingAmount,
              taxAmount: checkout.totals.taxAmount,
              totalAmount: checkout.totals.totalAmount,
              refundedAmount: 0,
            },
          },
        ],
        { session },
      );

      const order = orderDocuments[0];

      checkout.status = "COMPLETED";
      checkout.orderId = order._id;
      checkout.completedAt = new Date();

      await checkout.save({ session });

      createdOrder = order;
    });

    if (!createdOrder) {
      throw ApiError.internal("Order creation failed.");
    }

    return createdOrder;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      const duplicate = await OrderModel.findOne({
        checkoutId,
        userId,
      });

      if (duplicate) return duplicate;
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

export const getCustomerOrder = async (
  userIdInput: string,
  orderIdInput: string,
) => {
  const userId = normalizeUserId(userIdInput);
  const orderId = toObjectId(orderIdInput);

  const order = await OrderModel.findOne({
    _id: orderId,
    userId,
  });

  if (!order) {
    throw ApiError.notFound("Order not found.");
  }

  return order;
};

export const listCustomerOrders = async (
  userIdInput: string,
  filters: OrderListFilters = {},
) => {
  const userId = normalizeUserId(userIdInput);
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

  const query: Record<string, unknown> = { userId };

  if (filters.status) query.status = filters.status;
  if (filters.paymentStatus) {
    query.paymentStatus = filters.paymentStatus;
  }

  if (filters.search) {
    const escapedSearch = filters.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    query.orderNumber = {
      $regex: escapedSearch,
      $options: "i",
    };
  }

  const [items, total] = await Promise.all([
    OrderModel.find(query)
      .sort({ createdAt: filters.sort === "oldest" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    OrderModel.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const updateOrderStatus = async (
  orderIdInput: string,
  input: UpdateOrderStatusInput,
) => {
  const orderId = toObjectId(orderIdInput);
  const order = await OrderModel.findById(orderId);

  if (!order) {
    throw ApiError.notFound("Order not found.");
  }

  const nextStatus = input.status;

  if (order.status === "DELIVERED" && nextStatus === "DELIVERED") {
    await awardLoyaltyPointsForOrder(order._id.toString());
    return order;
  }

  if (!ORDER_TRANSITIONS[order.status].includes(nextStatus)) {
    throw ApiError.badRequest(
      `Order cannot transition from ${order.status} to ${nextStatus}.`,
    );
  }

  if (
    nextStatus === "CANCELLED" &&
    ["PAID", "PARTIALLY_REFUNDED"].includes(order.paymentStatus)
  ) {
    throw ApiError.badRequest(
      "Paid orders must follow the cancellation and refund workflow.",
    );
  }

  order.status = nextStatus;

  if (input.notes !== undefined) {
    order.notes = input.notes;
  }

  const now = new Date();

  if (nextStatus === "CONFIRMED") order.confirmedAt = now;
  if (nextStatus === "SHIPPED") {
    order.shippedAt = now;
    order.fulfillmentStatus = "FULFILLED";
    for (const item of order.items) {
      item.fulfilledQuantity = item.quantity;
    }
  }
  if (nextStatus === "DELIVERED") order.deliveredAt = now;

  await order.save();

  if (nextStatus === "DELIVERED") {
    await awardLoyaltyPointsForOrder(order._id.toString());
  }

  return order;
};
