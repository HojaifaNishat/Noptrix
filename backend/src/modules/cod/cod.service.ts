import { Types } from "mongoose";

import { ApiError } from "../../utils/ApiError";
import { isCodEnabled } from "../../config/payment";
import { Payment } from "../payments/payment.model";
import { CodRecord, COD_STATUSES } from "./cod.model";
import type { ICodRecordDocument } from "./cod.model";

/**
 * Internal order-flow integration only.
 *
 * Call this after the order service has verified customer ownership,
 * order status, server-calculated total and currency.
 *
 * Do not expose this function as a public request accepting client totals.
 */
export async function createCodRecordForValidatedPayment(input: {
    readonly paymentId: string;
    readonly customerId: string;
}): Promise<ICodRecordDocument> {
    if (!isCodEnabled()) {
        throw ApiError.badRequest("Cash on Delivery is currently disabled.");
    }

    if (
        !Types.ObjectId.isValid(input.paymentId) ||
        !Types.ObjectId.isValid(input.customerId)
    ) {
        throw ApiError.badRequest("Payment or customer ID is invalid.");
    }

    const payment = await Payment.findOne({
        _id: new Types.ObjectId(input.paymentId),
        customerId: new Types.ObjectId(input.customerId),
        method: "cod",
    }).exec();

    if (!payment) {
        throw ApiError.notFound("COD payment was not found.");
    }

    const existing = await CodRecord.findOne({
        paymentId: payment._id,
    }).exec();

    if (existing) {
        return existing;
    }

    try {
        return await CodRecord.create({
            paymentId: payment._id,
            transactionId: payment.transactionId,
            orderId: payment.orderId,
            customerId: payment.customerId,
            amount: payment.amount,
            currency: payment.currency,
            status: COD_STATUSES.PENDING,
        });
    } catch (error) {
        // A concurrent request may have created this COD record.
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            (error as { code?: unknown }).code === 11000
        ) {
            const winner = await CodRecord.findOne({
                paymentId: payment._id,
            }).exec();

            if (winner) return winner;
        }

        throw error;
    }
}

export async function listMyCodRecords(
    customerId: string,
    page = 1,
    limit = 20,
) {
    if (!Types.ObjectId.isValid(customerId)) {
        throw ApiError.badRequest("Customer ID is invalid.");
    }

    const safePage = Number.isFinite(page)
        ? Math.max(1, Math.floor(page))
        : 1;
    const safeLimit = Number.isFinite(limit)
        ? Math.min(100, Math.max(1, Math.floor(limit)))
        : 20;

    const filter = {
        customerId: new Types.ObjectId(customerId),
    };

    const [items, total] = await Promise.all([
        CodRecord.find(filter)
            .select("-collectionNote")
            .sort({ createdAt: -1, _id: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .lean()
            .exec(),
        CodRecord.countDocuments(filter).exec(),
    ]);

    return {
        items,
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: Math.ceil(total / safeLimit),
        },
    };
}

export async function getMyCodRecord(
    customerId: string,
    recordId: string,
) {
    if (
        !Types.ObjectId.isValid(customerId) ||
        !Types.ObjectId.isValid(recordId)
    ) {
        throw ApiError.badRequest("Customer or COD record ID is invalid.");
    }

    const record = await CodRecord.findOne({
        _id: new Types.ObjectId(recordId),
        customerId: new Types.ObjectId(customerId),
    })
        .select("-collectionNote")
        .lean()
        .exec();

    if (!record) {
        throw ApiError.notFound("COD record was not found.");
    }

    return record;
}
