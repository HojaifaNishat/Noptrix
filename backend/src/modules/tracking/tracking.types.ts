import { Types } from "mongoose";

import {
    TrackingStatus,
    TrackingEventType,
} from "./tracking.model";

/*
|--------------------------------------------------------------------------
| Tracking Data
|--------------------------------------------------------------------------
*/

export interface TrackingData {
    _id: Types.ObjectId;

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
| Tracking Event
|--------------------------------------------------------------------------
*/

export interface TrackingEventData {
    _id: Types.ObjectId;

    trackingId: Types.ObjectId;

    orderId: Types.ObjectId;

    riderId?: Types.ObjectId;

    type: TrackingEventType;

    status?: TrackingStatus;

    latitude?: number;
    longitude?: number;

    address?: string;

    message?: string;

    metadata?: Record<
        string,
        unknown
    >;

    createdBy?: Types.ObjectId;

    createdAt: Date;
}

/*
|--------------------------------------------------------------------------
| Status Transition
|--------------------------------------------------------------------------
*/

export interface TrackingStatusTransition {
    from: TrackingStatus;
    to: TrackingStatus;
}

/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
*/

export interface TrackingPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

/*
|--------------------------------------------------------------------------
| List Result
|--------------------------------------------------------------------------
*/

export interface TrackingListResult {
    trackings: TrackingData[];
    pagination: TrackingPagination;
}