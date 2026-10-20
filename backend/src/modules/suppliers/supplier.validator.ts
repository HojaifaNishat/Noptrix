import { z } from "zod";

import { SUPPLIER_STATUSES } from "./supplier.types";

const optionalEmail = z
  .string()
  .trim()
  .email("Invalid email address.")
  .max(254)
  .optional()
  .or(z.literal(""));

const optionalPhone = z
  .string()
  .trim()
  .min(5, "Phone number is too short.")
  .max(25, "Phone number is too long.")
  .optional()
  .or(z.literal(""));

const addressSchema = z
  .object({
    street: z.string().trim().max(200).optional(),
    city: z.string().trim().min(1).max(100),
    state: z.string().trim().max(100).optional(),
    postalCode: z.string().trim().max(20).optional(),
    country: z.string().trim().min(2).max(100),
  })
  .strict();

const contactPersonSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    email: optionalEmail,
    phone: optionalPhone,
    designation: z.string().trim().max(100).optional(),
  })
  .strict();

const supplierFields = {
  name: z.string().trim().min(2).max(150),
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9_-]*$/,
      "Code may contain letters, numbers, underscores and hyphens.",
    )
    .optional(),
  email: optionalEmail,
  phone: z
    .string()
    .trim()
    .min(5, "Phone number is too short.")
    .max(25, "Phone number is too long."),
  alternatePhone: optionalPhone,
  website: z
    .string()
    .trim()
    .url("Invalid website URL.")
    .max(2048)
    .optional()
    .or(z.literal("")),
  taxId: z.string().trim().max(80).optional(),
  registrationNumber: z.string().trim().max(100).optional(),
  address: addressSchema,
  contactPerson: contactPersonSchema.optional(),
  paymentTermsDays: z.number().int().min(0).max(365).optional(),
  creditLimit: z.number().finite().min(0).max(1_000_000_000).optional(),
  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a three-letter ISO code.")
    .regex(/^[A-Za-z]{3}$/)
    .transform((value) => value.toUpperCase())
    .optional(),
  notes: z.string().trim().max(2000).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
};

export const createSupplierSchema = z
  .object(supplierFields)
  .strict();

export const updateSupplierSchema = z
  .object({
    name: supplierFields.name.optional(),
    email: supplierFields.email,
    phone: supplierFields.phone.optional(),
    alternatePhone: supplierFields.alternatePhone,
    website: supplierFields.website,
    taxId: supplierFields.taxId,
    registrationNumber: supplierFields.registrationNumber,
    address: addressSchema.optional(),
    contactPerson: contactPersonSchema,
    paymentTermsDays: supplierFields.paymentTermsDays,
    creditLimit: supplierFields.creditLimit,
    currency: supplierFields.currency,
    notes: supplierFields.notes,
    tags: supplierFields.tags,
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for an update.",
  });

export const supplierIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid supplier ID."),
});

export const supplierQuerySchema = z
  .object({
    search: z.string().trim().max(150).optional(),
    status: z.enum(SUPPLIER_STATUSES).optional(),
    city: z.string().trim().max(100).optional(),
    country: z.string().trim().max(100).optional(),
    tags: z
      .union([
        z.string().trim().min(1).max(40),
        z.array(z.string().trim().min(1).max(40)).max(30),
      ])
      .optional(),
    page: z.coerce.number().int().min(1).max(1_000_000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z
      .enum(["name", "code", "createdAt", "updatedAt"])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export const updateSupplierStatusSchema = z
  .object({
    status: z.enum(SUPPLIER_STATUSES),
    reason: z.string().trim().min(3).max(500).optional(),
  })
  .strict();

export const supplierParamsSchema = supplierIdSchema;

export type CreateSupplierBody = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierBody = z.infer<typeof updateSupplierSchema>;
export type SupplierQuery = z.infer<typeof supplierQuerySchema>;
export type UpdateSupplierStatusBody = z.infer<
  typeof updateSupplierStatusSchema
>;
