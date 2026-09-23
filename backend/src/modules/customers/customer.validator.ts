import { z } from "zod";

import {
    CUSTOMER_STATUSES,
} from "./customer.model";

/*
|--------------------------------------------------------------------------
| Shared Schemas
|--------------------------------------------------------------------------
*/

const customerIdSchema = z
    .string()
    .trim()
    .min(1, "Customer ID is required.");

const avatarSchema = z
    .string()
    .trim()
    .url("Avatar must be a valid URL.")
    .max(
        2000,
        "Avatar URL cannot exceed 2000 characters."
    );

const genderSchema = z.enum([
    "MALE",
    "FEMALE",
    "OTHER",
    "PREFER_NOT_TO_SAY",
]);

/*
|--------------------------------------------------------------------------
| Create Customer
|--------------------------------------------------------------------------
*/

export const createCustomerSchema = z.object({
    userId: customerIdSchema,

    avatar: avatarSchema.optional(),

    dateOfBirth: z
        .coerce
        .date()
        .optional(),

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

        dateOfBirth: z
            .coerce
            .date()
            .optional(),

        gender: genderSchema.optional(),
    })
    .refine(
        (data) =>
            Object.keys(data).length > 0,
        {
            message:
                "At least one field is required.",
        }
    );

/*
|--------------------------------------------------------------------------
| Customer Status
|--------------------------------------------------------------------------
*/

export const updateCustomerStatusSchema =
    z.object({
        status: z.enum([
            CUSTOMER_STATUSES.ACTIVE,
            CUSTOMER_STATUSES.INACTIVE,
            CUSTOMER_STATUSES.SUSPENDED,
            CUSTOMER_STATUSES.BLOCKED,
        ]),
    });

/*
|--------------------------------------------------------------------------
| Customer ID Params
|--------------------------------------------------------------------------
*/

export const customerIdParamSchema =
    z.object({
        customerId: customerIdSchema,
    });

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type CreateCustomerInput =
    z.infer<
        typeof createCustomerSchema
    >;

export type UpdateCustomerInput =
    z.infer<
        typeof updateCustomerSchema
    >;

export type UpdateCustomerStatusInput =
    z.infer<
        typeof updateCustomerStatusSchema
    >;

export type CustomerIdParam =
    z.infer<
        typeof customerIdParamSchema
    >;