import { z } from "zod";
import { ABANDONED_CART_STATUSES } from "./abandonedCart.types";

export const recoverAbandonedCartSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i, "Invalid recovery token"),
});

export const abandonedCartListQuerySchema = z
  .object({
    status: z.enum(ABANDONED_CART_STATUSES).optional(),
    userId: z
      .string()
      .regex(/^[a-f\d]{24}$/i)
      .optional(),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine(
    (value) =>
      !value.from || !value.to || new Date(value.from) <= new Date(value.to),
    { message: "'from' must be before or equal to 'to'", path: ["from"] },
  );
