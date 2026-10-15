import { z } from "zod";

const objectIdSchema = z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid MongoDB ObjectId.");

export const listMyCodRecordsQuerySchema = z.object({
    page: z.coerce
        .number()
        .int()
        .min(1)
        .max(1_000_000)
        .default(1),
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20),
}).strict();

export const codRecordIdParamsSchema = z.object({
    recordId: objectIdSchema,
}).strict();

export type ListMyCodRecordsQuery = z.infer<
    typeof listMyCodRecordsQuerySchema
>;

export type CodRecordIdParams = z.infer<
    typeof codRecordIdParamsSchema
>;
