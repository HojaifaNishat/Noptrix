import { z } from "zod";

import { CUSTOMER_STATUSES } from "./customer.model";

/*
|--------------------------------------------------------------------------
| Shared Schemas
|--------------------------------------------------------------------------
*/

const customerIdSchema = z.string().trim().min(1, "Customer ID is required.");

const avatarSchema = z
  .string()
  .trim()
  .url("Avatar must be a valid URL.")
  .max(2000, "Avatar URL cannot exceed 2000 characters.");

const genderSchema = z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]);
const customerStatusSchema = z.enum([
  CUSTOMER_STATUSES.ACTIVE,
  CUSTOMER_STATUSES.INACTIVE,
  CUSTOMER_STATUSES.SUSPENDED,
  CUSTOMER_STATUSES.BLOCKED,
]);
const customerSegmentSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "BLOCKED",
  "NEW_BUYERS",
  "REPEAT_BUYERS",
]);

/*
|--------------------------------------------------------------------------
| Create Customer
|--------------------------------------------------------------------------
*/

export const createCustomerSchema = z.object({
  userId: customerIdSchema,

  avatar: avatarSchema.optional(),

  dateOfBirth: z.coerce.date().optional(),

  gender: genderSchema.optional(),
});

/*
|--------------------------------------------------------------------------
| Update Customer
|--------------------------------------------------------------------------
*/

export const updateCustomerSchema = z
  .object({
    avatar: avatarSchema.optional(),

    dateOfBirth: z.coerce.date().optional(),

    gender: genderSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });

/*
|--------------------------------------------------------------------------
| Customer Status
|--------------------------------------------------------------------------
*/

export const updateCustomerStatusSchema = z.object({
  status: customerStatusSchema,
});

/*
|--------------------------------------------------------------------------
| Customer Listing
|--------------------------------------------------------------------------
*/

export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  status: customerStatusSchema.optional(),
  segment: customerSegmentSchema.optional(),
});

export const updateCustomerNotificationPreferencesSchema = z
  .object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    push: z.boolean().optional(),
    marketing: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one preference must be provided.",
  });

/*
|--------------------------------------------------------------------------
| Customer ID Params
|--------------------------------------------------------------------------
*/

export const customerIdParamSchema = z.object({
  customerId: customerIdSchema,
});

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export type UpdateCustomerStatusInput = z.infer<
  typeof updateCustomerStatusSchema
>;

export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
export type UpdateCustomerNotificationPreferencesInput = z.infer<
  typeof updateCustomerNotificationPreferencesSchema
>;

export type CustomerIdParam = z.infer<typeof customerIdParamSchema>;
