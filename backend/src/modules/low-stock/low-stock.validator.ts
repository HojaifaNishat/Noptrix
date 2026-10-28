import { z } from "zod";

export const lowStockQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  warehouseId: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
  productId: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
  status: z.enum(["ALL", "LOW_STOCK", "OUT_OF_STOCK"]).default("ALL"),
  sortBy: z.enum(["quantity", "createdAt", "updatedAt"]).default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type LowStockQueryInput = z.infer<typeof lowStockQuerySchema>;
