import { Types } from "mongoose";

import { ApiError } from "../../utils/ApiError";
import OrderModel from "../orders/order.model";

import type { SellerOrderFilters } from "./seller-order.types";

const toObjectId = (
  value: string,
  fieldName: string,
): Types.ObjectId => {
  if (!/^[a-f\d]{24}$/i.test(value)) {
    throw ApiError.badRequest(`Invalid ${fieldName}.`);
  }

  return new Types.ObjectId(value);
};

const getPagination = (filters: SellerOrderFilters) => {
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const limit = Math.min(
    100,
    Math.max(1, Math.floor(filters.limit ?? 20)),
  );

  return { page, limit, skip: (page - 1) * limit };
};

const sellerOrderQuery = (
  sellerId: Types.ObjectId,
  filters: SellerOrderFilters,
) => {
  const query: Record<string, any> = {
    "items.sellerId": sellerId,
  };

  if (filters.status) query.status = filters.status;

  if (filters.paymentStatus) {
    query.paymentStatus = filters.paymentStatus;
  }

  if (filters.search?.trim()) {
    const escaped = filters.search.trim().replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

    query.orderNumber = {
      $regex: escaped,
      $options: "i",
    };
  }

  return query;
};

/**
 * List orders containing this seller's products.
 * Only this seller's items are returned.
 */
export const listSellerOrders = async (
  sellerIdInput: string,
  filters: SellerOrderFilters = {},
) => {
  const sellerId = toObjectId(sellerIdInput, "seller ID");
  const { page, limit, skip } = getPagination(filters);
  const query = sellerOrderQuery(sellerId, filters);

  const [orders, total] = await Promise.all([
    OrderModel.find(query)
      .sort({ createdAt: filters.sort === "oldest" ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    OrderModel.countDocuments(query),
  ]);

  const items = orders.map((order: any) => ({
    ...order,
    items: order.items.filter(
      (item: any) => String(item.sellerId) === String(sellerId),
    ),
  }));

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
};

/**
 * Get one order, restricted to this seller's items.
 */
export const getSellerOrder = async (
  sellerIdInput: string,
  orderIdInput: string,
) => {
  const sellerId = toObjectId(sellerIdInput, "seller ID");
  const orderId = toObjectId(orderIdInput, "order ID");

  const order: any = await OrderModel.findOne({
    _id: orderId,
    "items.sellerId": sellerId,
  }).lean();

  if (!order) {
    throw ApiError.notFound("Seller order not found.");
  }

  return {
    ...order,
    items: order.items.filter(
      (item: any) => String(item.sellerId) === String(sellerId),
    ),
  };
};