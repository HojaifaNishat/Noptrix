import {
    Types,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| Seller Application Status
|--------------------------------------------------------------------------
*/

export const SELLER_APPLICATION_STATUSES = [
    "SUBMITTED",
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
    "WITHDRAWN",
] as const;

export type SellerApplicationStatus =
    (typeof SELLER_APPLICATION_STATUSES)[number];

/*
|--------------------------------------------------------------------------
| Seller Type
|--------------------------------------------------------------------------
*/

export const SELLER_TYPES = [
    "INDIVIDUAL",
    "BUSINESS",
] as const;

export type SellerType =
    (typeof SELLER_TYPES)[number];

/*
|--------------------------------------------------------------------------
| Seller Application Data
|--------------------------------------------------------------------------
*/

export interface SellerApplicationData {
    _id: Types.ObjectId;

    applicantId: Types.ObjectId;

    businessName: string;

    legalName?: string;

    type: SellerType;

    email: string;

    phone?: string;

    taxNumber?: string;

    registrationNumber?: string;

    description?: string;

    logoUrl?: string;

    website?: string;

    address?: string;

    city?: string;

    country?: string;

    status: SellerApplicationStatus;

    reviewedAt?: Date;

    reviewedBy?: Types.ObjectId;

    approvedAt?: Date;

    rejectedAt?: Date;

    withdrawnAt?: Date;

    rejectionReason?: string;

    notes?: string;

    createdAt: Date;

    updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| Status Transition
|--------------------------------------------------------------------------
*/

export interface SellerApplicationStatusTransition {
    from: SellerApplicationStatus;

    to: SellerApplicationStatus;
}

/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
*/

export interface SellerApplicationPagination {
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

export interface SellerApplicationListResult {
    applications: SellerApplicationData[];

    pagination: SellerApplicationPagination;
}