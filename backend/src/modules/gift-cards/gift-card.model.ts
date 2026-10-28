import { model, models, Schema, Types } from "mongoose";
import type { GiftCardStatus } from "./gift-card.types";

export interface GiftCardDocument {
  _id: Types.ObjectId;
  code: string;
  initialBalance: number;
  balance: number;
  currency: string;
  status: GiftCardStatus;
  expiresAt?: Date | null;
  recipientEmail?: string;
  recipientName?: string;
  note?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const giftCardSchema = new Schema<GiftCardDocument>(
  {
    code: { type: String, required: true, unique: true, trim: true },
    initialBalance: { type: Number, required: true, min: 0.01 },
    balance: { type: Number, required: true, min: 0, default: 0 },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "DEPLETED"],
      default: "ACTIVE",
    },
    expiresAt: { type: Date, default: null },
    recipientEmail: { type: String, trim: true, lowercase: true },
    recipientName: { type: String, trim: true, maxlength: 120 },
    note: { type: String, trim: true, maxlength: 500 },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true, versionKey: false },
);

giftCardSchema.index({ status: 1, expiresAt: 1 });
giftCardSchema.index({ createdAt: -1 });

const GiftCardModel =
  models.GiftCard || model<GiftCardDocument>("GiftCard", giftCardSchema);

export default GiftCardModel;
