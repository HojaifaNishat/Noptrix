import { Payment } from "../payments/payment.model";
import { Types } from "mongoose";
import ReceiptModel from "./receipt.model";
import OrderModel from "../orders/order.model";
import { User } from "../users/user.model";
import { ApiError } from "../../utils/ApiError";
import type { ReceiptListQuery } from "./receipt.types";

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === "object" ? (value as AnyRecord) : {};
}

function firstNumber(source: AnyRecord, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function makeReceiptNumber(): string {
  const date = new Date();
  const stamp = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("");
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `RCP-${stamp}-${random}`;
}

function getOrderOwnerId(order: AnyRecord): string | null {
  const value = order.userId ?? order.customerId;
  if (!value) return null;

  if (typeof value === "string") return value;
  if (value instanceof Types.ObjectId) return value.toString();

  const record = asRecord(value);
  if (record._id) return String(record._id);
  return String(value);
}

function getOrderNumber(order: AnyRecord): string {
  return String(
    order.orderNumber ?? order.orderNo ?? order.orderCode ?? order._id,
  );
}

function getCurrency(order: AnyRecord): string {
  const pricing = asRecord(order.pricing);
  const totals = asRecord(order.totals);
  return String(
    order.currency ??
      pricing.currency ??
      totals.currency ??
      process.env.DEFAULT_CURRENCY ??
      "BDT",
  ).toUpperCase();
}

function getItems(order: AnyRecord) {
  const source = Array.isArray(order.items)
    ? order.items
    : Array.isArray(order.orderItems)
      ? order.orderItems
      : [];

  return source.map((raw: unknown) => {
    const item = asRecord(raw);
    const quantity = Math.max(
      1,
      Math.floor(firstNumber(item, ["quantity", "qty"], 1)),
    );

    const unitPrice = money(
      firstNumber(
        item,
        ["unitPrice", "price", "sellingPrice", "finalPrice"],
        0,
      ),
    );

    const total = money(
      firstNumber(
        item,
        ["total", "lineTotal", "subtotal", "totalPrice"],
        unitPrice * quantity,
      ),
    );

    const product = asRecord(item.product);
    const variant = asRecord(item.variant);

    return {
      name: String(
        item.name ??
          item.productName ??
          product.name ??
          variant.name ??
          "Product",
      ),
      ...(item.sku || variant.sku
        ? { sku: String(item.sku ?? variant.sku) }
        : {}),
      quantity,
      unitPrice,
      total,
    };
  });
}

async function loadOwnedOrder(orderId: string, userId: string) {
  if (!Types.ObjectId.isValid(orderId) || !Types.ObjectId.isValid(userId)) {
    throw ApiError.badRequest("Invalid order or user ID");
  }

  const order = await OrderModel.findById(orderId).lean();
  if (!order) throw ApiError.notFound("Order not found");

  const ownerId = getOrderOwnerId(asRecord(order));
  if (!ownerId || ownerId !== userId) {
    throw ApiError.notFound("Order not found");
  }

  return asRecord(order);
}

function buildSnapshot(order: AnyRecord, user: AnyRecord) {
  const totals = asRecord(order.totals);
  const pricing = asRecord(order.pricing);
  const address = asRecord(order.shippingAddress);
  const userName = user.name ?? user.fullName ?? address.fullName;

  const items = getItems(order);

  const subtotal = money(
    firstNumber(
      order,
      ["subtotal", "itemsSubtotal"],
      firstNumber(
        totals,
        ["subtotal"],
        firstNumber(
          pricing,
          ["subtotal"],
          items.reduce(
            (sum: number, item: { total: number }) => sum + item.total,
            0,
          ),
        ),
      ),
    ),
  );

  const discount = money(
    firstNumber(
      order,
      ["discountAmount", "discount"],
      firstNumber(totals, ["discount"], firstNumber(pricing, ["discount"], 0)),
    ),
  );

  const tax = money(
    firstNumber(
      order,
      ["taxAmount", "tax"],
      firstNumber(totals, ["tax"], firstNumber(pricing, ["tax"], 0)),
    ),
  );

  const shipping = money(
    firstNumber(
      order,
      ["shippingAmount", "shippingFee", "deliveryFee"],
      firstNumber(totals, ["shipping"], firstNumber(pricing, ["shipping"], 0)),
    ),
  );

  const total = money(
    firstNumber(
      order,
      ["totalAmount", "grandTotal", "total"],
      firstNumber(
        totals,
        ["total", "grandTotal"],
        firstNumber(
          pricing,
          ["total", "grandTotal"],
          subtotal - discount + tax + shipping,
        ),
      ),
    ),
  );

  return {
    orderNumber: getOrderNumber(order),
    customerName: String(userName ?? "Customer"),
    ...(user.email || address.email
      ? { customerEmail: String(user.email ?? address.email) }
      : {}),
    currency: getCurrency(order),
    subtotal,
    discount,
    tax,
    shipping,
    total,
    items,
  };
}

async function findSuccessfulPayment(orderId: string) {
  return Payment.findOne({
    orderId,
    status: "success",
  })
    .sort({ createdAt: -1 })
    .lean();
}

export async function createReceiptForOrder(orderId: string, userId: string) {
  const order = await loadOwnedOrder(orderId, userId);

  const existing = await ReceiptModel.findOne({
    orderId: new Types.ObjectId(orderId),
  }).lean();

  if (existing) {
    return { receipt: existing, created: false };
  }

  const paymentStatus = String(order.paymentStatus ?? "").toUpperCase();

  if (!["PAID", "PARTIALLY_REFUNDED", "REFUNDED"].includes(paymentStatus)) {
    throw ApiError.badRequest(
      "A receipt can only be issued for an order with a completed payment",
    );
  }

  const user = await User.findById(userId).lean();
  if (!user) throw ApiError.notFound("Customer account not found");

  const payment = await findSuccessfulPayment(orderId);

  // A persisted PAID order may be a COD order or an order whose payment
  // record uses a provider-specific status. Do not trust any client status.
  const snapshot = buildSnapshot(order, asRecord(user));

  const receiptNumber = makeReceiptNumber();

  try {
    const receipt = await ReceiptModel.create({
      receiptNumber,
      orderId: new Types.ObjectId(orderId),
      userId: new Types.ObjectId(userId),
      paymentId: payment ? new Types.ObjectId(String(payment._id)) : null,
      status: "ISSUED",
      snapshot,
      issuedAt: new Date(),
    });

    return { receipt: receipt.toObject(), created: true };
  } catch (error: unknown) {
    const mongoError = asRecord(error);

    if (mongoError.code === 11000) {
      const duplicate = await ReceiptModel.findOne({
        orderId: new Types.ObjectId(orderId),
      }).lean();

      if (duplicate) return { receipt: duplicate, created: false };

      throw ApiError.conflict(
        "Receipt number collision. Please retry the request",
      );
    }

    throw error;
  }
}

export async function listMyReceipts(
  userId: string,
  filters: ReceiptListQuery,
) {
  if (!Types.ObjectId.isValid(userId)) {
    throw ApiError.badRequest("Invalid user ID");
  }

  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

  const query: AnyRecord = {
    userId: new Types.ObjectId(userId),
  };

  if (filters.status) query.status = filters.status;

  const [items, total] = await Promise.all([
    ReceiptModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ReceiptModel.countDocuments(query),
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

export async function getMyReceipt(receiptId: string, userId: string) {
  if (!Types.ObjectId.isValid(receiptId)) {
    throw ApiError.badRequest("Invalid receipt ID");
  }

  const receipt = await ReceiptModel.findOne({
    _id: receiptId,
    userId,
  }).lean();

  if (!receipt) throw ApiError.notFound("Receipt not found");
  return receipt;
}

export async function getMyReceiptForOrder(orderId: string, userId: string) {
  await loadOwnedOrder(orderId, userId);

  const receipt = await ReceiptModel.findOne({
    orderId,
    userId,
  }).lean();

  if (!receipt) throw ApiError.notFound("Receipt not found for this order");
  return receipt;
}
