import { z } from "zod";

import { COD_STATUSES } from "./cod.types";

const objectIdSchema = z.string().regex(
    /^[a-f\d]{24}$/i,
    "A valid MongoDB ObjectId is required.",
);

export const codIdParamSchema = z.object({
    codId: objectIdSchema,
});

export const codOrderIdParamSchema = z.object({
    orderId: objectIdSchema,
});

export const createCODSchema = z.object({
    orderId: objectIdSchema,
    notes: z.string().trim().max(500).optional(),
}).strict();

export const collectCODSchema = z.object({
    amount: z.number().finite().positive(),
    notes: z.string().trim().max(500).optional(),
}).strict();

export const remitCODSchema = z.object({
    notes: z.string().trim().max(500).optional(),
}).strict();

export const reverseCODSchema = z.object({
    notes: z.string().trim().min(3).max(500),
}).strict();

export const codQuerySchema = z.object({
    status: z.enum(COD_STATUSES).optional(),
    riderId: objectIdSchema.optional(),
    orderId: objectIdSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();
