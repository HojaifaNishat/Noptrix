import {
  Schema,
  model,
  models,
  type Model,
  type HydratedDocument,
} from "mongoose";

export interface LoyaltyTier {
  key: string;
  name: string;
  minLifetimePoints: number;
  earningMultiplier: number;
  benefits: string[];
  sortOrder: number;
  active: boolean;
}

export interface LoyaltyProgram {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  pointsPerCurrencyUnit: number;
  minimumOrderAmount: number;
  eligiblePaymentStatuses: string[];
  eligibleOrderStatuses: string[];
  pointsExpiryDays: number | null;
  tiers: LoyaltyTier[];
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const tierSchema = new Schema<LoyaltyTier>(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: /^[A-Z0-9_-]+$/,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    minLifetimePoints: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },
    earningMultiplier: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    benefits: {
      type: [String],
      default: [],
      validate: (values: string[]) =>
        values.length <= 20 && values.every((value) => value.length <= 200),
    },
    sortOrder: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false, strict: "throw" },
);

const loyaltyProgramSchema = new Schema<LoyaltyProgram>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      default: "DEFAULT",
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      default: "NOPTRIX Rewards",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "Earn points on eligible purchases.",
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    pointsPerCurrencyUnit: {
      type: Number,
      default: 1,
      min: 0,
      max: 1000,
      validate: Number.isFinite,
    },
    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
      validate: Number.isFinite,
    },
    eligiblePaymentStatuses: {
      type: [String],
      default: ["PAID"],
      enum: ["PAID"],
    },
    eligibleOrderStatuses: {
      type: [String],
      default: ["DELIVERED"],
      enum: ["DELIVERED"],
    },
    pointsExpiryDays: {
      type: Number,
      default: null,
      min: 1,
      validate: {
        validator: (value: number | null) =>
          value === null || Number.isSafeInteger(value),
        message: "Expiry days must be a positive integer or null.",
      },
    },
    tiers: {
      type: [tierSchema],
      default: [
        {
          key: "BRONZE",
          name: "Bronze",
          minLifetimePoints: 0,
          earningMultiplier: 1,
          benefits: [],
          sortOrder: 0,
          active: true,
        },
        {
          key: "SILVER",
          name: "Silver",
          minLifetimePoints: 500,
          earningMultiplier: 1.1,
          benefits: [],
          sortOrder: 1,
          active: true,
        },
        {
          key: "GOLD",
          name: "Gold",
          minLifetimePoints: 2000,
          earningMultiplier: 1.25,
          benefits: [],
          sortOrder: 2,
          active: true,
        },
      ],
      validate: {
        validator: (tiers: LoyaltyTier[]) => {
          if (tiers.length < 1 || tiers.length > 20) return false;

          const keys = tiers.map((tier) => tier.key.toUpperCase());
          if (new Set(keys).size !== keys.length) return false;

          const thresholds = tiers
            .filter((tier) => tier.active)
            .map((tier) => tier.minLifetimePoints);

          return new Set(thresholds).size === thresholds.length;
        },
        message: "Loyalty tiers must have unique keys and thresholds.",
      },
    },
    updatedBy: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
  },
);

export type LoyaltyProgramDocument = HydratedDocument<LoyaltyProgram>;

export const LoyaltyProgramModel: Model<LoyaltyProgram> =
  (models.LoyaltyProgram as Model<LoyaltyProgram> | undefined) ??
  model<LoyaltyProgram>("LoyaltyProgram", loyaltyProgramSchema);

export default LoyaltyProgramModel;
