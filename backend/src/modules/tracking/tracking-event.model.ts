import { Schema, model, models, Types } from "mongoose";

import {
  TRACKING_EVENT_TYPES,
  TRACKING_STATUSES,
  type TrackingEventType,
  type TrackingStatus,
} from "./tracking.model";

export interface ITrackingEvent {
  trackingId: Types.ObjectId;
  orderId: Types.ObjectId;
  riderId?: Types.ObjectId;
  type: TrackingEventType;
  status?: TrackingStatus;
  latitude?: number;
  longitude?: number;
  address?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  createdBy?: Types.ObjectId;
  createdAt: Date;
}

const trackingEventSchema = new Schema<ITrackingEvent>(
  {
    trackingId: {
      type: Schema.Types.ObjectId,
      ref: "Tracking",
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    riderId: {
      type: Schema.Types.ObjectId,
      ref: "Rider",
      index: true,
    },
    type: {
      type: String,
      enum: TRACKING_EVENT_TYPES,
      required: true,
    },
    status: {
      type: String,
      enum: TRACKING_STATUSES,
    },
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
    address: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true,
      immutable: true,
    },
  },
  {
    versionKey: false,
    timestamps: false,
  },
);

trackingEventSchema.index({
  trackingId: 1,
  createdAt: -1,
});

trackingEventSchema.index({
  orderId: 1,
  createdAt: -1,
});

export const TrackingEvent =
  models.TrackingEvent ??
  model<ITrackingEvent>("TrackingEvent", trackingEventSchema);
