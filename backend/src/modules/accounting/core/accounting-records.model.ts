import { Schema, model, models, type Model, type Types } from "mongoose";

export const ACCOUNTING_RECORD_TYPES = [
  "EXPENSE",
  "INCOME",
  "ASSET",
  "LIABILITY",
] as const;

export interface IAccountingRecord {
  type: (typeof ACCOUNTING_RECORD_TYPES)[number];
  name: string;
  description?: string;
  amount: number;
  currency: string;
  occurredAt: Date;
  category?: string;
  accountId?: Types.ObjectId;
  reference?: string;
  status: "DRAFT" | "APPROVED" | "REJECTED";
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IAccountingRecord>(
  {
    type: {
      type: String,
      enum: ACCOUNTING_RECORD_TYPES,
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    amount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: (value?: number) =>
          value === undefined ||
          (Number.isFinite(value) &&
            Math.abs(value * 100 - Math.round(value * 100)) < 1e-7),
        message: "Amount must have at most two decimal places.",
      },
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      match: /^[A-Z]{3}$/,
    },
    occurredAt: { type: Date, required: true, index: true },
    category: { type: String, trim: true, maxlength: 100 },
    accountId: { type: Schema.Types.ObjectId, ref: "ChartAccount" },
    reference: { type: String, trim: true, maxlength: 150 },
    status: {
      type: String,
      enum: ["DRAFT", "APPROVED", "REJECTED"],
      default: "DRAFT",
      index: true,
    },
    createdBy: String,
    approvedBy: String,
    approvedAt: Date,
    rejectedBy: String,
    rejectedAt: Date,
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

schema.index({ type: 1, occurredAt: -1 });
schema.index({ status: 1, createdAt: -1 });

export const AccountingRecord =
  (models.AccountingRecord as Model<IAccountingRecord>) ||
  model<IAccountingRecord>("AccountingRecord", schema);
