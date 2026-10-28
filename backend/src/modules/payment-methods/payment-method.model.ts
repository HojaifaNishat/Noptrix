import { Schema, model, models, type InferSchemaType } from "mongoose";

export const PAYMENT_METHOD_IDS = ["cod", "online"] as const;

const paymentMethodSchema = new Schema(
  {
    methodId: {
      type: String,
      required: true,
      enum: PAYMENT_METHOD_IDS,
      unique: true,
      immutable: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    enabled: {
      type: Boolean,
      required: true,
      default: true,
    },
    displayOrder: {
      type: Number,
      required: true,
      min: 0,
      max: 1000,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
  },
);

paymentMethodSchema.index({ enabled: 1, displayOrder: 1 });

export type PaymentMethodDocument = InferSchemaType<typeof paymentMethodSchema>;

export const PaymentMethodModel =
  models.PaymentMethod ?? model("PaymentMethod", paymentMethodSchema);
