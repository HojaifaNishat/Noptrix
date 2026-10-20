
import {
  Schema,
  model,
  models,
  type Model,
} from "mongoose";

import {
  DELIVERY_ZONE_STATUSES,
  type IDeliveryZone,
} from "./delivery-zone.types";

const deliveryZoneSchema = new Schema<IDeliveryZone>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    country: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 3,
      index: true,
    },

    state: {
      type: String,
      trim: true,
      maxlength: 120,
    },

    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true,
    },

    postalCodes: {
      type: [String],
      default: [],
      validate: {
        validator: (values: string[]) =>
          values.every(
            (value) =>
              typeof value === "string" &&
              value.trim().length > 0 &&
              value.length <= 20,
          ),
        message: "Invalid postal code",
      },
    },

    boundary: {
      type: {
        type: String,
        enum: ["Polygon"],
        required: true,
      },
      coordinates: {
        type: [[[Number]]],
        required: true,
      },
    },

    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
    },

    freeDeliveryThreshold: {
      type: Number,
      min: 0,
    },

    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },

    estimatedDeliveryMinDays: {
      type: Number,
      default: 1,
      min: 0,
      max: 365,
      required: true,
    },

    estimatedDeliveryMaxDays: {
      type: Number,
      default: 3,
      min: 0,
      max: 365,
      required: true,
    },

    supportsCOD: {
      type: Boolean,
      default: true,
      required: true,
    },

    priority: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },

    status: {
      type: String,
      enum: DELIVERY_ZONE_STATUSES,
      default: "active",
      required: true,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  },
);

deliveryZoneSchema.index({
  country: 1,
  city: 1,
  status: 1,
  priority: -1,
});

deliveryZoneSchema.index({
  postalCodes: 1,
  status: 1,
});

deliveryZoneSchema.index(
  { "boundary": "2dsphere" },
  {
    partialFilterExpression: {
      "boundary.type": "Polygon",
    },
  },
);

deliveryZoneSchema.pre("validate", function () {
  if (
    this.estimatedDeliveryMinDays >
    this.estimatedDeliveryMaxDays
  ) {
    this.invalidate(
      "estimatedDeliveryMaxDays",
      "Maximum delivery days must be greater than or equal to minimum days",
    );
  }

  if (
    this.boundary?.coordinates?.length &&
    this.boundary.coordinates[0]?.length < 4
  ) {
    this.invalidate(
      "boundary.coordinates",
      "A polygon ring must contain at least four positions",
    );
  }
});

export const DeliveryZone: Model<IDeliveryZone> =
  (models.DeliveryZone as Model<IDeliveryZone>) ||
  model<IDeliveryZone>(
    "DeliveryZone",
    deliveryZoneSchema,
  );
