import { z } from "zod";

const boundedString = (max = 200) =>
    z.string().trim().min(1).max(max);

export const generalWebhookSchema = z.object({
    eventId: boundedString(200),
    eventType: boundedString(100),
    transactionId: boundedString(200),
    status: z.enum([
        "pending",
        "processing",
        "success",
        "failed",
        "cancelled",
    ]),
    amount: z.number().finite().positive().max(9_999_999_999),
    currency: z.string().trim().regex(/^[A-Za-z]{3}$/),
    providerTransactionId: z.string().trim().max(200).optional(),
}).strict();

export type GeneralWebhookPayload =
    z.infer<typeof generalWebhookSchema>;

export const sslCommerzIpnSchema = z.object({
    tran_id: z.string().trim().min(1).max(200),
    val_id: z.string().trim().min(1).max(500),
    status: z.string().trim().min(1).max(50).optional(),
    amount: z.union([z.string(), z.number()]).optional(),
    currency: z.string().trim().max(3).optional(),
}).passthrough();

export type SslCommerzIpnPayload =
    z.infer<typeof sslCommerzIpnSchema>;
