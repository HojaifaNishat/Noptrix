import { createHash, randomUUID } from "node:crypto";
import { Types } from "mongoose";

import { ApiError } from "../../utils/ApiError";
import { Payment } from "./payment.model";
import type { IPaymentDocument } from "./payment.model";

export interface ReservePaymentInput {
    readonly customerId: string;
    readonly orderId: string;
    readonly amount: number;
    readonly currency: string;
    readonly method: "cod" | "online";
    readonly provider: string;
    readonly idempotencyKey: string;
    readonly metadata?: Record<string, string | number | boolean | null>;
}

export interface ReservePaymentResult {
    readonly payment: IPaymentDocument;
    readonly reused: boolean;
}

const MAX_AMOUNT = 9_999_999_999;

function requiredString(
    value: string,
    field: string,
    maxLength = 200,
): string {
    if (typeof value !== "string") {
        throw ApiError.badRequest(`${field} is invalid.`);
    }

    const normalized = value.trim();

    if (!normalized || normalized.length > maxLength) {
        throw ApiError.badRequest(`${field} is invalid.`);
    }

    return normalized;
}

function normalizeAmount(amount: number): number {
    if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > MAX_AMOUNT
    ) {
        throw ApiError.badRequest("Payment amount is invalid.");
    }

    if (Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-7) {
        throw ApiError.badRequest(
            "Payment amount must have at most two decimal places.",
        );
    }

    return Math.round(amount * 100) / 100;
}

function fingerprint(input: {
    customerId: string;
    orderId: string;
    amount: number;
    currency: string;
    method: "cod" | "online";
    provider: string;
}): string {
    const canonical = JSON.stringify({
        customerId: input.customerId,
        orderId: input.orderId,
        amount: input.amount.toFixed(2),
        currency: input.currency,
        method: input.method,
        provider: input.provider,
    });

    return createHash("sha256").update(canonical).digest("hex");
}

function isDuplicateKeyError(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: unknown }).code === 11000
    );
}

async function findExisting(
    customerId: Types.ObjectId,
    idempotencyKey: string,
): Promise<IPaymentDocument | null> {
    return Payment.findOne({ customerId, idempotencyKey })
        .select("+idempotencyKey +requestFingerprint")
        .exec();
}

/**
 * Reserves a payment record without contacting any payment gateway.
 *
 * IMPORTANT:
 * Call only after trusted server-side order ownership, status,
 * amount and currency validation. Never trust a client-supplied amount.
 */
export async function reservePayment(
    input: ReservePaymentInput,
): Promise<ReservePaymentResult> {
    if (!Types.ObjectId.isValid(input.customerId)) {
        throw ApiError.badRequest("Customer ID is invalid.");
    }

    if (!Types.ObjectId.isValid(input.orderId)) {
        throw ApiError.badRequest("Order ID is invalid.");
    }

    if (input.method !== "cod" && input.method !== "online") {
        throw ApiError.badRequest("Payment method is invalid.");
    }

    const customerId = new Types.ObjectId(input.customerId);
    const orderId = input.orderId.trim();
    const amount = normalizeAmount(input.amount);
    const currency = requiredString(input.currency, "Currency", 3)
        .toUpperCase();
    const provider = requiredString(input.provider, "Provider", 50)
        .toLowerCase();
    const idempotencyKey = requiredString(
        input.idempotencyKey,
        "Idempotency key",
        200,
    );

    if (!/^[A-Z]{3}$/.test(currency)) {
        throw ApiError.badRequest("Currency must be a valid 3-letter code.");
    }

    const requestFingerprint = fingerprint({
        customerId: customerId.toString(),
        orderId,
        amount,
        currency,
        method: input.method,
        provider,
    });

    const existing = await findExisting(customerId, idempotencyKey);

    if (existing) {
        if (existing.requestFingerprint !== requestFingerprint) {
            throw ApiError.conflict(
                "Idempotency key was already used with different payment details.",
            );
        }

        return { payment: existing, reused: true };
    }

    try {
        await Payment.create({
            transactionId: `ptx_${randomUUID()}`,
            referenceId: `pref_${randomUUID()}`,
            orderId,
            customerId,
            amount,
            currency,
            method: input.method,
            provider,
            status: "created",
            idempotencyKey,
            requestFingerprint,
            metadata: input.metadata,
        });

        const payment = await findExisting(customerId, idempotencyKey);

        if (!payment) {
            throw ApiError.internal(
                "Payment reservation could not be reloaded.",
            );
        }

        return { payment, reused: false };
    } catch (error) {
        if (!isDuplicateKeyError(error)) {
            throw error;
        }

        // The compound unique index is the concurrency guard.
        const winner = await findExisting(customerId, idempotencyKey);

        if (!winner) {
            // The duplicate may have come from a different unique index.
            throw error;
        }

        if (winner.requestFingerprint !== requestFingerprint) {
            throw ApiError.conflict(
                "Idempotency key was already used with different payment details.",
            );
        }

        return { payment: winner, reused: true };
    }
}
