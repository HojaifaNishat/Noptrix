import {
    Document,
    Model,
    Schema,
    Types,
    model,
} from "mongoose";

import {
    PAYMENT_TRANSACTION_STATUSES,
    type PaymentTransactionStatus,
} from "../../services/payment.service";

export interface IPayment {
    _id: Types.ObjectId;
    transactionId: string;
    referenceId: string;
    orderId: string;
    customerId?: Types.ObjectId;
    amount: number;
    currency: string;
    method: "cod" | "online";
    provider: string;
    status: PaymentTransactionStatus;
    providerTransactionId?: string;
    idempotencyKey?: string;
    requestFingerprint?: string;
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

export interface IPaymentDocument
    extends IPayment, Document {}

const paymentSchema = new Schema<IPaymentDocument>(
    {
        transactionId: {
            type: String,
            required: true,
            immutable: true,
            trim: true,
        },
        referenceId: {
            type: String,
            required: true,
            immutable: true,
            trim: true,
        },
        orderId: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        customerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0.01,
            validate: {
                validator: (value: number) =>
                    Number.isFinite(value) &&
                    Math.round(value * 100) === value * 100,
                message: "Amount must have at most two decimal places.",
            },
        },
        currency: {
            type: String,
            required: true,
            uppercase: true,
            match: /^[A-Z]{3}$/,
        },
        method: {
            type: String,
            required: true,
            enum: ["cod", "online"],
        },
        provider: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        status: {
            type: String,
            required: true,
            enum: Object.values(PAYMENT_TRANSACTION_STATUSES),
            default: PAYMENT_TRANSACTION_STATUSES.CREATED,
            index: true,
        },
        providerTransactionId: {
            type: String,
            trim: true,
            sparse: true,
        },
        idempotencyKey: {
            type: String,
            select: false,
        },
        requestFingerprint: {
            type: String,
            select: false,
        },
        redirectUrl: {
            type: String,
            select: false,
        },
        checkoutUrl: {
            type: String,
            select: false,
        },
        failureCode: {
            type: String,
            maxlength: 100,
        },
        failureMessage: {
            type: String,
            maxlength: 500,
        },
        paidAt: Date,
        expiresAt: Date,
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        strict: "throw",
        minimize: true,
    },
);

paymentSchema.index(
    { transactionId: 1 },
    { unique: true },
);

paymentSchema.index(
    { referenceId: 1 },
    { unique: true },
);

paymentSchema.index(
    { provider: 1, providerTransactionId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            providerTransactionId: { $type: "string" },
        },
    },
);

paymentSchema.index(
    { orderId: 1, createdAt: -1 },
);

paymentSchema.index(
    { customerId: 1, idempotencyKey: 1 },
    {
        unique: true,
        partialFilterExpression: {
            idempotencyKey: { $type: "string" },
        },
        name: "uniq_payment_customer_idempotency",
    },
);

export const Payment: Model<IPaymentDocument> =
    model<IPaymentDocument>("Payment", paymentSchema);
