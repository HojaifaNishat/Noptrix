import { z } from "zod";

import {
    PAYMENT_METHODS,
    PAYMENT_SORT_OPTIONS,
} from "./payment.types";

import { PAYMENT_TRANSACTION_STATUSES } from "../../services/payment.service";

const objectIdSchema = z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId.");

const idempotencyKeySchema = z
    .string()
    .trim()
    .min(8, "Idempotency-Key must contain at least 8 characters.")
    .max(200, "Idempotency-Key cannot exceed 200 characters.")
    .regex(
        /^[a-zA-Z0-9._:-]+$/,
        "Idempotency-Key contains unsupported characters.",
    );

export const initiatePaymentSchema = z
    .object({
        orderId: objectIdSchema,
        method: z.enum(PAYMENT_METHODS),
    })
    .strict();

export const paymentTransactionParamsSchema = z
    .object({
        transactionId: z
            .string()
            .trim()
            .min(1)
            .max(200)
            .regex(
                /^[a-zA-Z0-9_-]+$/,
                "Invalid payment transaction ID.",
            ),
    })
    .strict();

export const paymentIdParamsSchema = z
    .object({
        paymentId: objectIdSchema,
    })
    .strict();

export const paymentQuerySchema = z
    .object({
        page: z.coerce
            .number()
            .int()
            .min(1)
            .max(1_000_000)
            .default(1),

        limit: z.coerce
            .number()
            .int()
            .min(1)
            .max(100)
            .default(20),

        sort: z
            .enum(PAYMENT_SORT_OPTIONS)
            .default("newest"),

        status: z
            .enum(
                Object.values(PAYMENT_TRANSACTION_STATUSES) as [
                    string,
                    ...string[],
                ],
            )
            .optional(),

        orderId: objectIdSchema.optional(),
    })
    .strict();

export const idempotencyHeaderSchema = z
    .object({
        "idempotency-key": idempotencyKeySchema,
    })
    .passthrough();

export type InitiatePaymentBody = z.infer<
    typeof initiatePaymentSchema
>;

export type PaymentTransactionParams = z.infer<
    typeof paymentTransactionParamsSchema
>;

export type PaymentIdParams = z.infer<
    typeof paymentIdParamsSchema
>;

export type PaymentQuery = z.infer<
    typeof paymentQuerySchema
>;

export type IdempotencyHeader = z.infer<
    typeof idempotencyHeaderSchema
>;
