import {
    Document,
    Model,
    Schema,
    Types,
    model,
} from "mongoose";

export const COD_STATUSES = {
    PENDING: "PENDING",
    ASSIGNED: "ASSIGNED",
    COLLECTED: "COLLECTED",
    COLLECTION_FAILED: "COLLECTION_FAILED",
    RETURNED: "RETURNED",
} as const;

export type CodStatus =
    typeof COD_STATUSES[keyof typeof COD_STATUSES];

export interface ICodRecord {
    _id: Types.ObjectId;
    paymentId: Types.ObjectId;
    transactionId: string;
    orderId: string;
    customerId: Types.ObjectId;
    amount: number;
    currency: string;
    status: CodStatus;
    riderId?: Types.ObjectId;
    collectedAt?: Date;
    collectionNote?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICodRecordDocument
    extends ICodRecord, Document {}

const codSchema = new Schema<ICodRecordDocument>(
    {
        paymentId: {
            type: Schema.Types.ObjectId,
            ref: "Payment",
            required: true,
            immutable: true,
        },
        transactionId: {
            type: String,
            required: true,
            immutable: true,
            trim: true,
        },
        orderId: {
            type: String,
            required: true,
            immutable: true,
            trim: true,
        },
        customerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            immutable: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0.01,
            immutable: true,
        },
        currency: {
            type: String,
            required: true,
            uppercase: true,
            match: /^[A-Z]{3}$/,
            immutable: true,
        },
        status: {
            type: String,
            required: true,
            enum: Object.values(COD_STATUSES),
            default: COD_STATUSES.PENDING,
            index: true,
        },
        riderId: {
            type: Schema.Types.ObjectId,
            ref: "Rider",
            default: undefined,
        },
        collectedAt: Date,
        collectionNote: {
            type: String,
            maxlength: 500,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        strict: "throw",
    },
);

codSchema.index(
    { paymentId: 1 },
    { unique: true, name: "uniq_cod_payment" },
);

codSchema.index(
    { orderId: 1 },
    { unique: true, name: "uniq_cod_order" },
);

codSchema.index({ customerId: 1, createdAt: -1 });
codSchema.index({ riderId: 1, status: 1 });

export const CodRecord: Model<ICodRecordDocument> =
    model<ICodRecordDocument>("CodRecord", codSchema);
