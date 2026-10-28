import {
  model,
  models,
  Schema,
  Types,
  type HydratedDocument,
  type Model,
} from "mongoose";
import {
  REWARD_POINT_TRANSACTION_TYPES,
  type RewardPointTransactionType,
} from "./reward-point.types";

export interface RewardPointAccount {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RewardPointTransaction {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  type: RewardPointTransactionType;
  points: number;
  balanceAfter: number;
  referenceId?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RewardPointTransactionDocument =
  HydratedDocument<RewardPointTransaction>;

const accountSchema = new Schema<RewardPointAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
    lifetimeEarned: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
    lifetimeRedeemed: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
  },
  { timestamps: true },
);

const transactionSchema = new Schema<RewardPointTransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(REWARD_POINT_TRANSACTION_TYPES),
      required: true,
    },
    points: {
      type: Number,
      required: true,
      min: 1,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    referenceId: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 250,
    },
  },
  { timestamps: true },
);

// Prevent the same order/reference from earning points twice.
transactionSchema.index(
  { userId: 1, type: 1, referenceId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: REWARD_POINT_TRANSACTION_TYPES.EARN,
      referenceId: { $type: "string" },
    },
  },
);

transactionSchema.index({ userId: 1, createdAt: -1 });

export const RewardPointAccountModel =
  (models.RewardPointAccount as Model<RewardPointAccount> | undefined) ??
  model<RewardPointAccount>("RewardPointAccount", accountSchema);

export const RewardPointTransactionModel =
  (models.RewardPointTransaction as
    Model<RewardPointTransaction> | undefined) ??
  model<RewardPointTransaction>("RewardPointTransaction", transactionSchema);

export default RewardPointAccountModel;
