import mongoose, {
  model,
  Schema,
  type Model,
} from "mongoose";

import {
  ADDRESS_TYPES,
  type Address,
} from "./address.types";

const addressLocationSchema = new Schema(
  {
    latitude: {
      type: Number,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
    },
  },
  {
    _id: false,
    strict: "throw",
  },
);

const addressSchema = new Schema<Address>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ADDRESS_TYPES,
      default: "HOME",
      required: true,
    },

    label: {
      type: String,
      trim: true,
      maxlength: 80,
    },

    fullName: {
      type: String,
      trim: true,
      required: true,
      minlength: 2,
      maxlength: 120,
    },

    phone: {
      type: String,
      trim: true,
      required: true,
      minlength: 5,
      maxlength: 25,
    },

    alternatePhone: {
      type: String,
      trim: true,
      maxlength: 25,
    },

    country: {
      type: String,
      trim: true,
      required: true,
      maxlength: 100,
    },

    countryCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 3,
    },

    state: {
      type: String,
      trim: true,
      required: true,
      maxlength: 100,
    },

    city: {
      type: String,
      trim: true,
      required: true,
      maxlength: 100,
    },

    area: {
      type: String,
      trim: true,
      maxlength: 120,
    },

    postalCode: {
      type: String,
      trim: true,
      maxlength: 20,
    },

    addressLine1: {
      type: String,
      trim: true,
      required: true,
      minlength: 3,
      maxlength: 250,
    },

    addressLine2: {
      type: String,
      trim: true,
      maxlength: 250,
    },

    landmark: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    location: {
      type: addressLocationSchema,
      default: undefined,
    },

    isDefault: {
      type: Boolean,
      default: false,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
    collection: "addresses",
  },
);

addressSchema.index({
  userId: 1,
  isActive: 1,
  createdAt: -1,
});

addressSchema.index({
  userId: 1,
  isDefault: 1,
  isActive: 1,
});

addressSchema.index({
  userId: 1,
  type: 1,
  isActive: 1,
});

export type AddressDocument = mongoose.HydratedDocument<Address>;

export const AddressModel: Model<Address> =
  (mongoose.models.Address as Model<Address> | undefined) ??
  model<Address>("Address", addressSchema);

export default AddressModel;
