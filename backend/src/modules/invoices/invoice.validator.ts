import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");

const lineSchema = z.object({
  description: z.string().trim().min(1).max(500),
  productId: objectId.optional(),
  sku: z.string().trim().max(100).optional(),
  quantity: z.number().finite().positive(),
  unitPrice: z.number().finite().min(0),
  discountAmount: z.number().finite().min(0).optional(),
  taxAmount: z.number().finite().min(0).optional(),
});

export const createInvoiceSchema = z.object({
  body: z.object({
    orderId: objectId.optional(),
    customerId: objectId,
    customerName: z.string().trim().min(1).max(200),
    customerEmail: z.string().email().optional(),
    currency: z.string().trim().length(3).default("BDT"),
    lines: z.array(lineSchema).min(1).max(500),
    discountAmount: z.number().finite().min(0).optional(),
    taxAmount: z.number().finite().min(0).optional(),
    shippingAmount: z.number().finite().min(0).optional(),
    dueAt: z.coerce.date().nullable().optional(),
    billingAddress: z.record(z.string(), z.unknown()).optional(),
    notes: z.string().trim().max(2000).optional(),
  }),
});

export const invoiceIdParamsSchema = z.object({
  params: z.object({
    invoiceId: objectId,
  }),
});

export const invoiceListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),
    status: z.enum(["DRAFT", "ISSUED", "PAID", "VOID", "OVERDUE"]).optional(),
    customerId: objectId.optional(),
  }),
});

export const invoiceStatusSchema = z.object({
  params: z.object({ invoiceId: objectId }),
  body: z.object({
    status: z.enum(["ISSUED", "VOID"]),
  }),
});
