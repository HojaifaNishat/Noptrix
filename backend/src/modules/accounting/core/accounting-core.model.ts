import { Schema, model, models, type Model, type Types } from "mongoose";

export const ACCOUNT_TYPES = [
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "REVENUE",
  "EXPENSE",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const CASH_FLOW_CATEGORIES = [
  "OPERATING",
  "INVESTING",
  "FINANCING",
] as const;

export type CashFlowCategory = (typeof CASH_FLOW_CATEGORIES)[number];

export interface IChartAccount {
  code: string;
  name: string;
  type: AccountType;
  parentId?: Types.ObjectId;
  description?: string;
  isCashAccount: boolean;
  cashFlowCategory?: CashFlowCategory;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const chartAccountSchema = new Schema<IChartAccount>(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 30,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    type: {
      type: String,
      enum: ACCOUNT_TYPES,
      required: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "ChartAccount",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    isCashAccount: {
      type: Boolean,
      default: false,
      index: true,
    },
    cashFlowCategory: {
      type: String,
      enum: CASH_FLOW_CATEGORIES,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
  },
);

chartAccountSchema.index({ code: 1 }, { unique: true });
chartAccountSchema.index({ parentId: 1, type: 1 });

export const ChartAccount =
  (models.ChartAccount as Model<IChartAccount>) ||
  model<IChartAccount>("ChartAccount", chartAccountSchema);

export const JOURNAL_STATUSES = ["DRAFT", "POSTED", "REVERSED"] as const;

export type JournalStatus = (typeof JOURNAL_STATUSES)[number];

export interface IJournalLine {
  accountId: Types.ObjectId;
  description?: string;
  debit: number;
  credit: number;
}

export interface IJournalEntry {
  entryNumber: string;
  entryDate: Date;
  description: string;
  referenceType?: string;
  referenceId?: string;
  currency: string;
  lines: IJournalLine[];
  totalDebit: number;
  totalCredit: number;
  status: JournalStatus;
  createdBy?: string;
  postedBy?: string;
  postedAt?: Date;
  reversalOf?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const journalLineSchema = new Schema<IJournalLine>(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "ChartAccount",
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    debit: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: (value: number) =>
          Number.isFinite(value) &&
          Math.abs(value * 100 - Math.round(value * 100)) < 1e-7,
        message: "Debit must have at most two decimal places.",
      },
    },
    credit: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: (value: number) =>
          Number.isFinite(value) &&
          Math.abs(value * 100 - Math.round(value * 100)) < 1e-7,
        message: "Credit must have at most two decimal places.",
      },
    },
  },
  { _id: false, strict: "throw" },
);

const journalEntrySchema = new Schema<IJournalEntry>(
  {
    entryNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    entryDate: {
      type: Date,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    referenceType: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    referenceId: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      match: /^[A-Z]{3}$/,
    },
    lines: {
      type: [journalLineSchema],
      required: true,
      validate: {
        validator: (lines: IJournalLine[]) => lines.length >= 2,
        message: "A journal entry requires at least two lines.",
      },
    },
    totalDebit: { type: Number, required: true, min: 0 },
    totalCredit: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: JOURNAL_STATUSES,
      default: "DRAFT",
      required: true,
      index: true,
    },
    createdBy: String,
    postedBy: String,
    postedAt: Date,
    reversalOf: {
      type: Schema.Types.ObjectId,
      ref: "JournalEntry",
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
  },
);

journalEntrySchema.index({ entryDate: 1, status: 1 });
journalEntrySchema.index({ referenceType: 1, referenceId: 1 });
journalEntrySchema.index({ reversalOf: 1 }, { sparse: true, unique: true });

export const JournalEntry =
  (models.JournalEntry as Model<IJournalEntry>) ||
  model<IJournalEntry>("JournalEntry", journalEntrySchema);
