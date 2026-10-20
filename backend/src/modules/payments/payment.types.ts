import type { Types } from "mongoose";
import type { PaymentTransactionStatus } from "../../services/payment.service";

export const PAYMENT_METHODS = ["cod", "online"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_SORT_OPTIONS = ["newest", "oldest"] as const;
export type PaymentSort = (typeof PAYMENT_SORT_OPTIONS)[number];

export interface PaymentRecord {
    _id: Types.ObjectId;
    transactionId: string;
    referenceId: string;
    orderId: string;
    customerId?: Types.ObjectId;
    amount: number;
    currency: string;
    method: PaymentMethod;
    provider: string;
    status: PaymentTransactionStatus;
    providerTransactionId?: string;
    redirectUrl?: string;
    checkoutUrl?: string;
    failureCode?: string;
    failureMessage?: string;
    paidAt?: Date;
    expiresAt?: Date;
    metadata?: Record<string, string | number | boolean | null>;
    createdAt: Date;
    updatedAt: Date;
}

export interface InitiatePaymentInput {
    orderId: string;
    method: PaymentMethod;
    idempotencyKey: string;
}

export interface PaymentListQuery {
    page: number;
    limit: number;
    sort: PaymentSort;
}

export interface PaymentListFilters extends PaymentListQuery {
    status?: PaymentTransactionStatus;
    orderId?: string;
}

export interface PaymentResponse {
    transactionId: string;
    referenceId?: string;
    orderId: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
    provider: string;
    status: PaymentTransactionStatus;
    redirectUrl?: string;
    checkoutUrl?: string;
    paidAt?: Date;
    expiresAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
