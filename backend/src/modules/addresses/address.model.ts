import mongoose, { Document, Model, Schema, Types, model } from "mongoose";

export interface IAddress {
  _id: Types.ObjectId;
  customerId: Types.ObjectId;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  postalCode?: string;
  countryCode: string;
  deliveryInstructions?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddressDocument extends IAddress, Document {}

const addressSchema = new Schema<IAddressDocument>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 160,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32,
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240,
    },
    addressLine2: {
      type: String,
      trim: true,
      maxlength: 240,
      default: undefined,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    region: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: 24,
      default: undefined,
    },
    countryCode: {
      type: String,
      required: true,
      uppercase: true,
      match: /^[A-Z]{2}$/,
    },
    deliveryInstructions: {
      type: String,
      trim: true,
      maxlength: 500,
      default: undefined,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
  },
);

addressSchema.index({ customerId: 1, createdAt: -1 });
addressSchema.index({ customerId: 1, isDefault: 1 });

export const Address: Model<IAddressDocument> =
  (mongoose.models.Address as Model<IAddressDocument> | undefined) ??
  model<IAddressDocument>("Address", addressSchema);
