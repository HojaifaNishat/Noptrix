import {
    Types,
} from "mongoose";

import {
    RiderEarningStatus,
    RiderEarningType,
} from "./riderEarning.model";

/*
|--------------------------------------------------------------------------
| Rider Earning Data
|--------------------------------------------------------------------------
*/

export interface RiderEarningData {
    _id: Types.ObjectId;

    riderId: Types.ObjectId;

    orderId?: Types.ObjectId;

    type: RiderEarningType;

    amount: number;

    currency: string;

    status: RiderEarningStatus;

    description?: string;

    earningDate: Date;

    approvedAt?: Date;
    approvedBy?: Types.ObjectId;

    paidAt?: Date;
    paidBy?: Types.ObjectId;

    cancelledAt?: Date;
    cancelledBy?: Types.ObjectId;

    cancellationReason?: string;

    notes?: string;

    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
*/

export interface RiderEarningPagination {
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

export interface RiderEarningListResult {
    earnings: RiderEarningData[];
    pagination: RiderEarningPagination;
}

/*
|--------------------------------------------------------------------------
| Rider Earnings Summary
|--------------------------------------------------------------------------
*/

export interface RiderEarningSummary {
    totalEarnings: number;

    pendingEarnings: number;

    approvedEarnings: number;

    paidEarnings: number;

    cancelledEarnings: number;

    currency: string;
}