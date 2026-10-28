import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { Payment } from "../payments/payment.model";
import { Transaction } from "./transaction.model";
import type { TransactionListQuery } from "./transaction.types";

function requireObjectId(value: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw ApiError.badRequest(`Invalid ${label}.`);
  }

  return new Types.ObjectId(value);
}

function normalizePagination(page = 1, limit = 20) {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;

  const safeLimit = Number.isFinite(limit)
    ? Math.min(100, Math.max(1, Math.floor(limit)))
    : 20;

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}

function buildTransactionFilter(query: TransactionListQuery) {
  const filter: Record<string, unknown> = {};

  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.orderId) filter.orderId = query.orderId;
  if (query.paymentId) filter.paymentId = query.paymentId;
  if (query.provider) filter.provider = query.provider.toLowerCase();

  if (query.from || query.to) {
    const createdAt: Record<string, Date> = {};
    if (query.from) createdAt.$gte = query.from;
    if (query.to) createdAt.$lte = query.to;
    filter.createdAt = createdAt;
  }

  return filter;
}

function publicTransactionProjection() {
  return [
    "paymentId",
    "transactionId",
    "orderId",
    "type",
    "previousStatus",
    "status",
    "amount",
    "currency",
    "provider",
    "createdAt",
  ].join(" ");
}

export async function listCustomerTransactions(
  customerId: string,
  page = 1,
  limit = 20,
) {
  const customerObjectId = requireObjectId(customerId, "customer ID");
  const pagination = normalizePagination(page, limit);

  const payments = await Payment.find({ customerId: customerObjectId })
    .select("_id")
    .lean()
    .exec();

  const paymentIds = payments.map((payment) => payment._id);

  const filter = { paymentId: { $in: paymentIds } };

  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .select(publicTransactionProjection())
      .sort({ createdAt: -1, _id: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean()
      .exec(),
    Transaction.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      pages: Math.ceil(total / pagination.limit),
    },
  };
}

export async function getCustomerTransaction(
  customerId: string,
  transactionId: string,
) {
  const customerObjectId = requireObjectId(customerId, "customer ID");

  const payment = await Payment.findOne({
    customerId: customerObjectId,
    transactionId,
  })
    .select("_id")
    .lean()
    .exec();

  if (!payment) {
    throw ApiError.notFound("Transaction not found.");
  }

  const transaction = await Transaction.findOne({
    paymentId: payment._id,
    transactionId,
  })
    .select(publicTransactionProjection())
    .sort({ createdAt: -1, _id: -1 })
    .lean()
    .exec();

  if (!transaction) {
    throw ApiError.notFound("Transaction not found.");
  }

  return transaction;
}

/**
 * Administrative read-only search.
 * Access control must be enforced by the route middleware.
 */
export async function listAllTransactions(query: TransactionListQuery) {
  const pagination = normalizePagination(query.page, query.limit);
  const filter = buildTransactionFilter(query);

  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .select(publicTransactionProjection())
      .sort({ createdAt: -1, _id: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean()
      .exec(),
    Transaction.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      pages: Math.ceil(total / pagination.limit),
    },
  };
}
