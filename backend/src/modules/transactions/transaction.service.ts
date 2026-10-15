import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { Payment } from "../payments/payment.model";
import { Transaction } from "./transaction.model";

export const listCustomerTransactions = async (
    customerId: string,
    page = 1,
    limit = 20,
) => {
    if (!Types.ObjectId.isValid(customerId)) {
        throw ApiError.badRequest("Invalid customer ID.");
    }

    const ownerId = new Types.ObjectId(customerId);
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));

    const ownedPayments = await Payment.find({ customerId: ownerId })
        .select("_id")
        .lean()
        .exec();

    const paymentIds = ownedPayments.map((payment) => payment._id);

    const [items, total] = await Promise.all([
        Transaction.find({ paymentId: { $in: paymentIds } })
            .sort({ createdAt: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .select("-details")
            .lean()
            .exec(),
        Transaction.countDocuments({ paymentId: { $in: paymentIds } }),
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
