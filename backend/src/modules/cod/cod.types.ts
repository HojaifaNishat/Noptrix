import type { Types } from "mongoose";

export const COD_STATUSES = [
    "PENDING",
    "COLLECTED",
    "REMITTED",
    "REVERSED",
] as const;

export type CODStatus = (typeof COD_STATUSES)[number];

export interface ICOD {
    orderId: Types.ObjectId;
    riderId: Types.ObjectId;
    amount: number;
    currency: string;
    status: CODStatus;
    collectedAt?: Date;
    remittedAt?: Date;
    reversedAt?: Date;
    notes?: string;
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateCODInput {
    orderId: string;
    notes?: string;
}

export interface CollectCODInput {
    amount: number;
    notes?: string;
}

export interface CODQuery {
    status?: CODStatus;
    riderId?: string;
    orderId?: string;
    page?: number;
    limit?: number;
}
