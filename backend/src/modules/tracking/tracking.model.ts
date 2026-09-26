import {
    Schema,
    model,
    Types,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

export const TRACKING_STATUSES = [
    "PENDING",
    "ASSIGNED",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "FAILED",
    "CANCELLED",
] as const;

export type TrackingStatus =
    (typeof TRACKING_STATUSES)[number];

export const TRACKING_EVENT_TYPES = [
    "CREATED",
    "ASSIGNED",
    "PICKED_UP",
    "LOCATION_UPDATED",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "FAILED",
    "CANCELLED",
] as const;

export type TrackingEventType =
    (typeof TRACKING_EVENT_TYPES)[number];

/*
|--------------------------------------------------------------------------
| Interface
|--------------------------------------------------------------------------
*/

export interface ITracking {
    orderId: Types.ObjectId;

    riderId?: Types.ObjectId;

    status: TrackingStatus;

    currentLatitude?: number;
    currentLongitude?: number;

    currentAddress?: string;

    lastLocationAt?: Date;

    estimatedDeliveryAt?: Date;

    deliveredAt?: Date;

    failedAt?: Date;
    failureReason?: string;

    cancelledAt?: Date;
    cancellationReason?: string;

    notes?: string;

    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| Schema
|--------------------------------------------------------------------------
*/

const trackingSchema =
    new Schema<ITracking>(
        {
            orderId: {
                type: Schema.Types.ObjectId,
                ref: "Order",
                required: true,
                unique: true,
                index: true,
            },

            riderId: {
                type: Schema.Types.ObjectId,
                ref: "Rider",
                index: true,
            },

            status: {
                type: String,
                enum: TRACKING_STATUSES,
                default: "PENDING",
                required: true,
                index: true,
            },

            currentLatitude: {
                type: Number,
                min: -90,
                max: 90,
            },

            currentLongitude: {
                type: Number,
                min: -180,
                max: 180,
            },

            currentAddress: {
                type: String,
                trim: true,
                maxlength: 500,
            },

            lastLocationAt: {
                type: Date,
            },

            estimatedDeliveryAt: {
                type: Date,
            },

            deliveredAt: {
                type: Date,
            },

            failedAt: {
                type: Date,
            },

            failureReason: {
                type: String,
                trim: true,
                maxlength: 1000,
            },

            cancelledAt: {
                type: Date,
            },

            cancellationReason: {
                type: String,
                trim: true,
                maxlength: 1000,
            },

            notes: {
                type: String,
                trim: true,
                maxlength: 2000,
            },

            createdBy: {
                type: Schema.Types.ObjectId,
                ref: "User",
            },

            updatedBy: {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        },
        {
            timestamps: true,
        },
    );

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

trackingSchema.index({
    riderId: 1,
    status: 1,
});

trackingSchema.index({
    status: 1,
    createdAt: -1,
});

trackingSchema.index({
    lastLocationAt: -1,
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

export const Tracking =
    model<ITracking>(
        "Tracking",
        trackingSchema,
    );