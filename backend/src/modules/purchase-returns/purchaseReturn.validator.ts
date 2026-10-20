import { z } from "zod";

import {
  PURCHASE_RETURN_REFUND_METHODS,
  PURCHASE_RETURN_REFUND_STATUSES,
  PURCHASE_RETURN_REASONS,
  PURCHASE_RETURN_STATUSES,
} from "./purchaseReturn.types";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "A valid MongoDB ObjectId is required.");

const optionalText = (max: number) =>
  z.string().trim().max(max).optional();

const moneySchema = z
  .number()
  .finite()
  .min(0)
  .max(1_000_000_000);

const positiveMoneySchema = z
  .number()
  .finite()
  .gt(0)
  .max(1_000_000_000);

const quantitySchema = z
  .number()
  .int()
  .positive()
  .max(1_000_000);

const dateStringSchema = z
  .string()
  .datetime({ offset: true });

const returnReasonSchema = z.enum(PURCHASE_RETURN_REASONS);

const returnItemSchema = z
  .object({
    productId: objectIdSchema,
    variantId: objectIdSchema.optional(),
    quantity: quantitySchema,
    reason: returnReasonSchema,
    condition: z
      .enum(["DAMAGED", "DEFECTIVE", "UNOPENED", "OTHER"])
      .optional(),
    restock: z.boolean().optional(),
    note: optionalText(1000),
  })
  .strict();

export const purchaseReturnIdSchema = z
  .object({
    id: objectIdSchema,
  })
  .strict();

export const purchaseReturnNumberSchema = z
  .object({
    returnNumber: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .regex(/^[A-Z0-9_-]+$/i, "Invalid return number."),
  })
  .strict();

export const createPurchaseReturnSchema = z
  .object({
    purchaseId: objectIdSchema,
    items: z.array(returnItemSchema).min(1).max(200),
    reason: returnReasonSchema,
    reasonDetails: optionalText(2000),
    supplierReference: optionalText(150),
    referenceNumber: optionalText(150),
    notes: optionalText(5000),
  })
  .strict()
  .superRefine((value, ctx) => {
    const itemKeys = value.items.map(
      (item) => `${item.productId}:${item.variantId ?? ""}`,
    );

    if (new Set(itemKeys).size !== itemKeys.length) {
      ctx.addIssue({
        code: "custom",
        path: ["items"],
        message:
          "Duplicate product/variant entries are not allowed in one return.",
      });
    }

    if (
      value.reason === "OTHER" &&
      !value.reasonDetails?.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["reasonDetails"],
        message: "Reason details are required when reason is OTHER.",
      });
    }
  });

export const updatePurchaseReturnSchema = z
  .object({
    items: z.array(returnItemSchema).min(1).max(200).optional(),
    reason: returnReasonSchema.optional(),
    reasonDetails: optionalText(2000),
    supplierReference: optionalText(150),
    referenceNumber: optionalText(150),
    notes: optionalText(5000),
  })
  .strict()
  .refine(
    (value) => Object.values(value).some((item) => item !== undefined),
    { message: "At least one field must be provided." },
  );

export const purchaseReturnQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    status: z.enum(PURCHASE_RETURN_STATUSES).optional(),
    refundStatus: z.enum(PURCHASE_RETURN_REFUND_STATUSES).optional(),
    purchaseId: objectIdSchema.optional(),
    supplierId: objectIdSchema.optional(),
    warehouseId: objectIdSchema.optional(),
    requestedBy: objectIdSchema.optional(),
    fromDate: dateStringSchema.optional(),
    toDate: dateStringSchema.optional(),
    sortBy: z
      .enum(["createdAt", "updatedAt", "returnNumber", "totalAmount"])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.fromDate &&
      value.toDate &&
      new Date(value.fromDate) > new Date(value.toDate)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["toDate"],
        message: "toDate must be on or after fromDate.",
      });
    }
  });

export const approvePurchaseReturnSchema = z
  .object({
    note: optionalText(2000),
  })
  .strict();

export const rejectPurchaseReturnSchema = z
  .object({
    reason: z.string().trim().min(3).max(2000),
  })
  .strict();

export const completePurchaseReturnSchema = z
  .object({
    note: optionalText(2000),
  })
  .strict();

export const recordPurchaseReturnRefundSchema = z
  .object({
    amount: positiveMoneySchema,
    method: z.enum(PURCHASE_RETURN_REFUND_METHODS),
    referenceNumber: optionalText(150),
    refundedAt: dateStringSchema.optional(),
    note: optionalText(1000),
  })
  .strict();

export const cancelPurchaseReturnSchema = z
  .object({
    reason: z.string().trim().min(3).max(2000),
  })
  .strict();

export const purchaseReturnSummaryQuerySchema = z
  .object({
    fromDate: dateStringSchema.optional(),
    toDate: dateStringSchema.optional(),
    supplierId: objectIdSchema.optional(),
    warehouseId: objectIdSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.fromDate &&
      value.toDate &&
      new Date(value.fromDate) > new Date(value.toDate)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["toDate"],
        message: "toDate must be on or after fromDate.",
      });
    }
  });

export type CreatePurchaseReturnBody = z.infer<
  typeof createPurchaseReturnSchema
>;
export type UpdatePurchaseReturnBody = z.infer<
  typeof updatePurchaseReturnSchema
>;
export type PurchaseReturnQuery = z.infer<
  typeof purchaseReturnQuerySchema
>;
export type ApprovePurchaseReturnBody = z.infer<
  typeof approvePurchaseReturnSchema
>;
export type RejectPurchaseReturnBody = z.infer<
  typeof rejectPurchaseReturnSchema
>;
export type CompletePurchaseReturnBody = z.infer<
  typeof completePurchaseReturnSchema
>;
export type RecordPurchaseReturnRefundBody = z.infer<
  typeof recordPurchaseReturnRefundSchema
>;
export type CancelPurchaseReturnBody = z.infer<
  typeof cancelPurchaseReturnSchema
>;
export type PurchaseReturnSummaryQuery = z.infer<
  typeof purchaseReturnSummaryQuerySchema
>;

export type PurchaseReturnItemBody = z.infer<typeof returnItemSchema>;
export type PurchaseReturnReasonValue = z.infer<
  typeof returnReasonSchema
>;
export type PurchaseReturnRefundMethodValue = z.infer<
  typeof recordPurchaseReturnRefundSchema
>["method"];

export const purchaseReturnMoneySchema = moneySchema;
