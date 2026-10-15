import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { Payment } from "./payment.model";

const toObjectId = (value: string): Types.ObjectId => {
    if (!Types.ObjectId.isValid(value)) {
        throw ApiError.badRequest("Invalid customer ID.");
    }
    return new Types.ObjectId(value);
};

export const listCustomerPayments = async (
    customerId: string,
    page = 1,
    limit = 20,
) => {
    const ownerId = toObjectId(customerId);
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));

    const [items, total] = await Promise.all([
        Payment.find({ customerId: ownerId })
            .select("-idempotencyKey -requestFingerprint -redirectUrl -checkoutUrl")
            .sort({ createdAt: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .lean()
            .exec(),
        Payment.countDocuments({ customerId: ownerId }),
    ]);

    return {
        items,
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            pages: Math.ceil(total / safeLimit),
        },
    };
};

export const getCustomerPayment = async (
    customerId: string,
    transactionId: string,
) => {
    const payment = await Payment.findOne({
        customerId: toObjectId(customerId),
        transactionId: transactionId.trim(),
    })
        .select("-idempotencyKey -requestFingerprint -redirectUrl -checkoutUrl")
        .lean()
        .exec();

    if (!payment) {
        throw ApiError.notFound("Payment not found.");
    }

    return payment;
};
