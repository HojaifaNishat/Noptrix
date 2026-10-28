import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional();

const warehouseFields = {
  name: z.string().trim().min(2).max(120),
  code: z
    .string()
    .trim()
    .min(2)
    .max(32)
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/)
    .transform((value) => value.toUpperCase()),
  description: optionalText(1000),
  address: optionalText(300),
  city: optionalText(100),
  state: optionalText(100),
  postalCode: optionalText(20),
  country: optionalText(100),
  contactName: optionalText(120),
  contactPhone: z.string().trim().min(5).max(32).optional(),
  contactEmail: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase())
    .optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  isDefault: z.boolean().optional(),
};

export const createWarehouseSchema = z.object(warehouseFields);

export const updateWarehouseSchema = z
  .object(warehouseFields)
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field must be provided.",
  );

export const warehouseIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid warehouse ID."),
});

export const warehouseListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  city: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
  sortBy: z.enum(["name", "code", "createdAt", "updatedAt"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});
