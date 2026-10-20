import { z } from "zod";
import { TRANSACTION_TYPES } from "./transaction.model";
import type { TransactionType } from "./transaction.model";
import { PAYMENT_TRANSACTION_STATUSES } from "../../services/payment.service";

const objectIdSchema = z.string().regex(
    /^[a-f\d]{24}$/i,
    "Must be a valid MongoDB ObjectId.",
);

const dateSchema = z.string().datetime({ offset: true });

export const transactionIdParamsSchema = z.object({
    transactionId: z.string().trim().min(1).max(200),
}).strict();

export const transactionListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum([
        TRANSACTION_TYPES.PAYMENT_CREATED,
        TRANSACTION_TYPES.PAYMENT_PENDING,
        TRANSACTION_TYPES.PAYMENT_PROCESSING,
        TRANSACTION_TYPES.PAYMENT_SUCCEEDED,
        TRANSACTION_TYPES.PAYMENT_FAILED,
        TRANSACTION_TYPES.PAYMENT_CANCELLED,
        TRANSACTION_TYPES.PAYMENT_EXPIRED,
        TRANSACTION_TYPES.REFUND_REQUESTED,
        TRANSACTION_TYPES.REFUND_SUCCEEDED,
        TRANSACTION_TYPES.REFUND_FAILED,
        TRANSACTION_TYPES.WEBHOOK_RECEIVED,
    ]).optional(),
    status: z.enum(
        Object.values(PAYMENT_TRANSACTION_STATUSES) as [
            string,
            ...string[],
        ],
    ).optional(),
    orderId: objectIdSchema.optional(),
    paymentId: objectIdSchema.optional(),
    provider: z.string().trim().min(1).max(80).optional(),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
}).strict().refine(
    (value) => !value.from || !value.to ||
        new Date(value.from) <= new Date(value.to),
    {
        message: "'from' must be earlier than or equal to 'to'.",
        path: ["from"],
    },
);

export type TransactionListQueryInput =
    z.infer<typeof transactionListQuerySchema>;
