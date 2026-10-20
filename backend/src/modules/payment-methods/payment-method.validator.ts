import { z } from "zod";

export const paymentMethodParamsSchema = z
    .object({
        methodId: z.enum(["cod", "online"]),
    })
    .strict();

export const updatePaymentMethodSchema = z
    .object({
        enabled: z.boolean(),
        displayOrder: z.number().int().min(0).max(1000).optional(),
        description: z.string().trim().max(500).optional(),
    })
    .strict();

export const paymentMethodListQuerySchema = z
    .object({
        includeDisabled: z.enum(["true", "false"]).optional(),
    })
    .strict();

export type PaymentMethodParams =
    z.infer<typeof paymentMethodParamsSchema>;

export type UpdatePaymentMethodBody =
    z.infer<typeof updatePaymentMethodSchema>;

export type PaymentMethodListQuery =
    z.infer<typeof paymentMethodListQuerySchema>;
