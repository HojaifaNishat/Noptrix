import { z } from "zod";

import { ADDRESS_TYPES } from "./address.types";

const trimmedText = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

const optionalText = (max: number) =>
  z.string().trim().max(max).optional();

const phoneSchema = z
  .string()
  .trim()
  .min(5)
  .max(25)
  .regex(/^[+()\d\s.-]+$/, "Invalid phone number");

const optionalPhoneSchema = phoneSchema.optional();

export const addressIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid address ID"),
});

export const addressLocationSchema = z
  .object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  })
  .strict();

export const createAddressSchema = z
  .object({
    type: z.enum(ADDRESS_TYPES).default("HOME"),
    label: optionalText(80),

    fullName: trimmedText(2, 120),
    phone: phoneSchema,
    alternatePhone: optionalPhoneSchema,

    country: trimmedText(2, 100),
    countryCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2,3}$/)
      .optional(),

    state: trimmedText(1, 100),
    city: trimmedText(1, 100),
    area: optionalText(120),
    postalCode: optionalText(20),

    addressLine1: trimmedText(3, 250),
    addressLine2: optionalText(250),
    landmark: optionalText(200),

    location: addressLocationSchema.optional(),
    isDefault: z.boolean().optional().default(false),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.alternatePhone &&
      data.alternatePhone === data.phone
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["alternatePhone"],
        message: "Alternate phone must differ from primary phone",
      });
    }
  });

export const updateAddressSchema = z
  .object({
    type: z.enum(ADDRESS_TYPES).optional(),
    label: optionalText(80),

    fullName: trimmedText(2, 120).optional(),
    phone: phoneSchema.optional(),
    alternatePhone: optionalPhoneSchema,

    country: trimmedText(2, 100).optional(),
    countryCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2,3}$/)
      .optional(),

    state: trimmedText(1, 100).optional(),
    city: trimmedText(1, 100).optional(),
    area: optionalText(120),
    postalCode: optionalText(20),

    addressLine1: trimmedText(3, 250).optional(),
    addressLine2: optionalText(250),
    landmark: optionalText(200),

    location: addressLocationSchema.nullable().optional(),
    isDefault: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  })
  .superRefine((data, ctx) => {
    if (
      data.phone &&
      data.alternatePhone &&
      data.phone === data.alternatePhone
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["alternatePhone"],
        message: "Alternate phone must differ from primary phone",
      });
    }
  });

export const addressQuerySchema = z
  .object({
    type: z.enum(ADDRESS_TYPES).optional(),
    isDefault: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),

    search: z.string().trim().max(100).optional(),

    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),

    sortBy: z
      .enum(["createdAt", "updatedAt", "fullName"])
      .default("createdAt"),

    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export const setDefaultAddressSchema = addressIdSchema;

export type CreateAddressBody = z.infer<typeof createAddressSchema>;
export type UpdateAddressBody = z.infer<typeof updateAddressSchema>;
export type AddressQuery = z.infer<typeof addressQuerySchema>;
export type AddressIdParams = z.infer<typeof addressIdSchema>;
