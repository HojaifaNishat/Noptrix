import {
    Document,
    Model,
    Schema,
    Types,
    model,
    models,
} from "mongoose";

export const TRANSACTION_TYPES = {
    PAYMENT_CREATED: "PAYMENT_CREATED",
    PAYMENT_PENDING: "PAYMENT_PENDING",
    PAYMENT_PROCESSING: "PAYMENT_PROCESSING",
    PAYMENT_SUCCEEDED: "PAYMENT_SUCCEEDED",
    PAYMENT_FAILED: "PAYMENT_FAILED",
    PAYMENT_CANCELLED: "PAYMENT_CANCELLED",
    PAYMENT_EXPIRED: "PAYMENT_EXPIRED",
    REFUND_REQUESTED: "REFUND_REQUESTED",
    REFUND_SUCCEEDED: "REFUND_SUCCEEDED",
    REFUND_FAILED: "REFUND_FAILED",
    WEBHOOK_RECEIVED: "WEBHOOK_RECEIVED",
} as const;

export type TransactionType =
    typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES];

export interface ITransaction {
    _id: Types.ObjectId;
    paymentId: Types.ObjectId;
    transactionId: string;
    orderId: string;
    type: TransactionType;
    previousStatus?: string;
    status: string;
    amount: number;
    currency: string;
    provider?: string;
    providerEventId?: string;
    idempotencyKey?: string;
    actorId?: Types.ObjectId;
    correlationId?: string;
    details?: Record<string, unknown>;
    createdAt: Date;
}

export interface ITransactionDocument extends ITransaction, Document {}

const transactionSchema = new Schema<ITransactionDocument>(
    {
        paymentId: {
            type: Schema.Types.ObjectId,
            ref: "Payment",
            required: true,
            immutable: true,
            index: true,
        },
        transactionId: {
            type: String,
            required: true,
            immutable: true,
            trim: true,
            index: true,
        },
        orderId: {
            type: String,
            required: true,
            immutable: true,
            trim: true,
            index: true,
        },
        type: {
            type: String,
            required: true,
            enum: Object.values(TRANSACTION_TYPES),
            immutable: true,
        },
        previousStatus: {
            type: String,
            immutable: true,
        },
        status: {
            type: String,
            required: true,
            immutable: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
            immutable: true,
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
            immutable: true,
        },
        provider: {
            type: String,
            lowercase: true,
            trim: true,
            immutable: true,
        },
        providerEventId: {
            type: String,
            trim: true,
            immutable: true,
        },
        idempotencyKey: {
            type: String,
            immutable: true,
            select: false,
        },
        actorId: {
            type: Schema.Types.ObjectId,
            immutable: true,
        },
        correlationId: {
            type: String,
            trim: true,
            immutable: true,
        },
        details: {
            type: Schema.Types.Mixed,
            immutable: true,
            select: false,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        versionKey: false,
        strict: "throw",
        minimize: true,
    },
);

transactionSchema.index({ paymentId: 1, createdAt: -1 });
transactionSchema.index({ orderId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });

transactionSchema.index(
    { provider: 1, providerEventId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            providerEventId: { $type: "string" },
        },
    },
);

export const Transaction: Model<ITransactionDocument> =
    (models.Transaction as Model<ITransactionDocument> | undefined) ??
    model<ITransactionDocument>("Transaction", transactionSchema);
