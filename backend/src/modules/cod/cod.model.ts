import {
    Schema,
    model,
    models,
    type Model,
} from "mongoose";

import {
    COD_STATUSES,
    type ICOD,
} from "./cod.types";

const codSchema = new Schema<ICOD>(
    {
        orderId: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            unique: true,
            index: true,
        },
        riderId: {
            type: Schema.Types.ObjectId,
            ref: "Rider",
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0.01,
        },
        currency: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
            minlength: 3,
            maxlength: 3,
            default: "BDT",
        },
        status: {
            type: String,
            enum: COD_STATUSES,
            required: true,
            default: "PENDING",
            index: true,
        },
        collectedAt: Date,
        remittedAt: Date,
        reversedAt: Date,
        notes: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
        versionKey: false,
        strict: "throw",
    },
);

codSchema.index({ riderId: 1, status: 1, createdAt: -1 });
codSchema.index({ status: 1, createdAt: -1 });

export const COD: Model<ICOD> =
    (models.COD as Model<ICOD>) ||
    model<ICOD>("COD", codSchema);

export default COD;
