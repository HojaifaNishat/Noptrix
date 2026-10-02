import { z } from "zod";

import {
    SUBCATEGORY_STATUSES,
} from "./subcategory.types";

const objectIdRegex =
    /^[a-f\d]{24}$/i;

const slugRegex =
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const statusValues = [
    SUBCATEGORY_STATUSES.ACTIVE,
    SUBCATEGORY_STATUSES.INACTIVE,
    SUBCATEGORY_STATUSES.ARCHIVED,
] as const;

const subcategorySeoSchema =
    z
        .object({
            title: z
                .string()
                .trim()
                .min(2)
                .max(180)
                .optional(),

            description: z
                .string()
                .trim()
                .min(2)
                .max(320)
                .optional(),

            keywords: z
                .array(
                    z
                        .string()
                        .trim()
                        .min(1)
                        .max(80)
                )
                .max(30)
                .optional(),
        })
        .strict();

export const createSubcategorySchema =
    z
        .object({
            categoryId: z
                .string()
                .trim()
                .regex(
                    objectIdRegex,
                    "Invalid category ID."
                ),

            name: z
                .string()
                .trim()
                .min(
                    2,
                    "Subcategory name is too short."
                )
                .max(160),

            slug: z
                .string()
                .trim()
                .min(2)
                .max(160)
                .regex(
                    slugRegex,
                    "Invalid subcategory slug."
                )
                .optional(),

            description: z
                .string()
                .trim()
                .max(5000)
                .optional(),

            status: z
                .enum(statusValues)
                .optional(),

            isFeatured: z
                .boolean()
                .optional(),

            sortOrder: z
                .coerce
                .number()
                .int()
                .min(0)
                .max(1_000_000)
                .optional(),

            seo:
                subcategorySeoSchema
                    .optional(),

            createdBy: z
                .string()
                .trim()
                .regex(
                    objectIdRegex,
                    "Invalid creator ID."
                )
                .optional(),
        })
        .strict();

export const updateSubcategorySchema =
    z
        .object({
            categoryId: z
                .string()
                .trim()
                .regex(
                    objectIdRegex,
                    "Invalid category ID."
                )
                .optional(),

            name: z
                .string()
                .trim()
                .min(2)
                .max(160)
                .optional(),

            slug: z
                .string()
                .trim()
                .min(2)
                .max(160)
                .regex(
                    slugRegex,
                    "Invalid subcategory slug."
                )
                .optional(),

            description: z
                .string()
                .trim()
                .max(5000)
                .optional(),

            status: z
                .enum(statusValues)
                .optional(),

            isFeatured: z
                .boolean()
                .optional(),

            sortOrder: z
                .coerce
                .number()
                .int()
                .min(0)
                .max(1_000_000)
                .optional(),

            seo:
                subcategorySeoSchema
                    .optional(),

            updatedBy: z
                .string()
                .trim()
                .regex(
                    objectIdRegex,
                    "Invalid updater ID."
                )
                .optional(),
        })
        .strict()
        .refine(
            (data) =>
                Object.keys(data).length >
                0,
            {
                message:
                    "At least one field is required for update.",
            }
        );

export const subcategoryIdParamSchema =
    z
        .object({
            subcategoryId: z
                .string()
                .trim()
                .regex(
                    objectIdRegex,
                    "Invalid subcategory ID."
                ),
        })
        .strict();

export const subcategorySlugParamSchema =
    z
        .object({
            slug: z
                .string()
                .trim()
                .min(2)
                .max(160)
                .regex(
                    slugRegex,
                    "Invalid subcategory slug."
                ),
        })
        .strict();

export const subcategoryListQuerySchema =
    z
        .object({
            categoryId: z
                .string()
                .trim()
                .regex(
                    objectIdRegex,
                    "Invalid category ID."
                )
                .optional(),

            search: z
                .string()
                .trim()
                .max(120)
                .optional(),

            status: z
                .enum(statusValues)
                .optional(),

            isFeatured: z
                .string()
                .trim()
                .toLowerCase()
                .pipe(
                    z.enum([
                        "true",
                        "false",
                    ])
                )
                .transform(
                    (value) =>
                        value === "true"
                )
                .optional(),

            page: z
                .coerce
                .number()
                .int()
                .min(1)
                .default(1),

            limit: z
                .coerce
                .number()
                .int()
                .min(1)
                .max(100)
                .default(20),

            sortBy: z
                .enum([
                    "name",
                    "sortOrder",
                    "createdAt",
                    "updatedAt",
                ])
                .optional(),

            sortOrder: z
                .enum([
                    "asc",
                    "desc",
                ])
                .optional(),
        })
        .strict();

export const updateSubcategoryStatusSchema =
    z
        .object({
            status:
                z.enum(statusValues),
        })
        .strict();

export const updateSubcategoryFeaturedSchema =
    z
        .object({
            isFeatured:
                z.boolean(),
        })
        .strict();

export const updateSubcategorySortOrderSchema =
    z
        .object({
            sortOrder: z
                .coerce
                .number()
                .int()
                .min(0)
                .max(1_000_000),
        })
        .strict();

export type CreateSubcategoryBody =
    z.infer<
        typeof createSubcategorySchema
    >;

export type UpdateSubcategoryBody =
    z.infer<
        typeof updateSubcategorySchema
    >;

export type SubcategoryListQueryInput =
    z.infer<
        typeof subcategoryListQuerySchema
    >;
