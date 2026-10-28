import { z } from "zod";

export const receiptListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["ISSUED", "VOID"]).optional(),
});

export const receiptIdParamSchema = z.object({
  receiptId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid receipt ID"),
});

export const receiptOrderParamSchema = z.object({
  orderId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid order ID"),
});

export type ReceiptListQueryInput = z.infer<typeof receiptListQuerySchema>;
