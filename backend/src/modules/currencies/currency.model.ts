import { InferSchemaType, Schema, model, models } from "mongoose";

/**
 * Currency registry.
 *
 * This model stores supported currencies and display metadata.
 * It does not perform exchange-rate conversion.
 *
 * The platform's default currency is configured separately
 * in settings/currency and must be synchronized deliberately.
 */

export const CURRENCY_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export type CurrencyStatus = (typeof CURRENCY_STATUSES)[number];

const currencySchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      match: /^[A-Z]{3}$/,
      immutable: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    symbol: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 12,
    },

    decimalPlaces: {
      type: Number,
      required: true,
      min: 0,
      max: 4,
      default: 2,
    },

    status: {
      type: String,
      required: true,
      enum: CURRENCY_STATUSES,
      default: "ACTIVE",
    },

    isDefault: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
    minimize: false,
  },
);

currencySchema.index(
  { code: 1 },
  {
    unique: true,
    name: "uniq_currency_code",
  },
);

currencySchema.index(
  { status: 1, code: 1 },
  {
    name: "currency_status_code",
  },
);

/**
 * Partial unique index:
 * at most one currency document can be marked default.
 *
 * This does not guarantee that a default exists; the seed
 * and service layer must ensure that separately.
 */
currencySchema.index(
  { isDefault: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDefault: true,
    },
    name: "uniq_default_currency",
  },
);

export type CurrencyDocument = InferSchemaType<typeof currencySchema>;

export const Currency = models.Currency ?? model("Currency", currencySchema);
