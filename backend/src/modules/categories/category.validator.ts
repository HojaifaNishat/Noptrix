import { z } from "zod";

import {
    CATEGORY_STATUSES,
} from "./category.types";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const objectIdRegex =
    /^[0-9a-fA-F]{24}$/;

const slugRegex =
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/*
|--------------------------------------------------------------------------
| SEO Schema
|--------------------------------------------------------------------------
*/

const categorySeoSchema =
    z
        .object({
            title: z
                .string()
                .trim()
                .min(
                    1,
                    "SEO title cannot be empty."
                )
                .max(
                    70,
                    "SEO title cannot exceed 70 characters."
                )
                .optional(),

            description: z
                .string()
                .trim()
                .min(
                    1,
                    "SEO description cannot be empty."
                )
                .max(
                    320,
                    "SEO description cannot exceed 320 characters."
                )
                .optional(),

            keywords: z
                .array(
                    z
                        .string()
                        .trim()
                        .min(
                            1,
                            "SEO keyword cannot be empty."
                        )
                        .max(
                            100,
                            "SEO keyword cannot exceed 100 characters."
                        )
                )
                .max(
                    20,
                    "A category can have at most 20 SEO keywords."
                )
                .optional(),
        })
        .strict();

/*
|--------------------------------------------------------------------------
| Create Category
|--------------------------------------------------------------------------
*/

export const createCategorySchema =
    z
        .object({
            name: z
                .string()
                .trim()
                .min(
                    2,
                    "Category name must be at least 2 characters."
                )
                .max(
                    120,
                    "Category name cannot exceed 120 characters."
                ),

            slug: z
                .string()
                .trim()
                .toLowerCase()
                .min(
                    2,
                    "Slug must be at least 2 characters."
                )
                .max(
                    160,
                    "Slug cannot exceed 160 characters."
                )
                .regex(
                    slugRegex,
                    "Slug may contain only lowercase letters, numbers and hyphens."
                )
                .optional(),

            description: z
                .string()
                .trim()
                .max(
                    2000,
                    "Description cannot exceed 2000 characters."
                )
                .optional(),

            status: z
                .enum(
                    Object.values(
                        CATEGORY_STATUSES
                    ) as [
                        (typeof CATEGORY_STATUSES)[keyof typeof CATEGORY_STATUSES],
                        ...(typeof CATEGORY_STATUSES)[keyof typeof CATEGORY_STATUSES][]
                    ]
                )
                .optional(),

            isFeatured: z
                .boolean()
                .optional(),

            sortOrder: z
                .number()
                .int()
                .min(
                    0,
                    "Sort order cannot be negative."
                )
                .max(
                    1_000_000,
                    "Sort order is too large."
                )
                .optional(),

            seo: categorySeoSchema.optional(),

            createdBy: z
                .string()
                .regex(
                    objectIdRegex,
                    "Invalid creator ID."
                )
                .optional(),
        })
        .strict();

/*
|--------------------------------------------------------------------------
| Update Category
|--------------------------------------------------------------------------
*/

export const updateCategorySchema =
    z
        .object({
            name: z
                .string()
                .trim()
                .min(
                    2,
                    "Category name must be at least 2 characters."
                )
                .max(
                    120,
                    "Category name cannot exceed 120 characters."
                )
                .optional(),

            slug: z
                .string()
                .trim()
                .toLowerCase()
                .min(
                    2,
                    "Slug must be at least 2 characters."
                )
                .max(
                    160,
                    "Slug cannot exceed 160 characters."
                )
                .regex(
                    slugRegex,
                    "Slug may contain only lowercase letters, numbers and hyphens."
                )
                .optional(),

            description: z
                .string()
                .trim()
                .max(
                    2000,
                    "Description cannot exceed 2000 characters."
                )
                .optional(),

            status: z
                .enum(
                    Object.values(
                        CATEGORY_STATUSES
                    ) as [
                        (typeof CATEGORY_STATUSES)[keyof typeof CATEGORY_STATUSES],
                        ...(typeof CATEGORY_STATUSES)[keyof typeof CATEGORY_STATUSES][]
                    ]
                )
                .optional(),

            isFeatured: z
                .boolean()
                .optional(),

            sortOrder: z
                .number()
                .int()
                .min(
                    0,
                    "Sort order cannot be negative."
                )
                .max(
                    1_000_000,
                    "Sort order is too large."
                )
                .optional(),

            seo: categorySeoSchema.optional(),

            updatedBy: z
                .string()
                .regex(
                    objectIdRegex,
                    "Invalid updater ID."
                )
                .optional(),
        })
        .strict()
        .refine(
            (data) =>
                Object.keys(data).length > 0,
            {
                message:
                    "At least one field must be provided for update.",
            }
        );

/*
|--------------------------------------------------------------------------
| Category ID Params
|--------------------------------------------------------------------------
*/

export const categoryIdParamSchema =
    z
        .object({
            categoryId: z
                .string()
                .regex(
                    objectIdRegex,
                    "Invalid category ID."
                ),
        })
        .strict();

/*
|--------------------------------------------------------------------------
| Category Slug Params
|--------------------------------------------------------------------------
*/

export const categorySlugParamSchema =
    z
        .object({
            slug: z
                .string()
                .trim()
                .min(
                    2,
                    "Invalid category slug."
                )
                .max(
                    160,
                    "Category slug cannot exceed 160 characters."
                )
                .regex(
                    slugRegex,
                    "Invalid category slug."
                ),
        })
        .strict();

/*
|--------------------------------------------------------------------------
| Category List Query
|--------------------------------------------------------------------------
*/

export const categoryListQuerySchema =
    z
        .object({
            search: z
                .string()
                .trim()
                .max(
                    120,
                    "Search query cannot exceed 120 characters."
                )
                .optional(),

            status: z
                .enum(
                    Object.values(
                        CATEGORY_STATUSES
                    ) as [
                        (typeof CATEGORY_STATUSES)[keyof typeof CATEGORY_STATUSES],
                        ...(typeof CATEGORY_STATUSES)[keyof typeof CATEGORY_STATUSES][]
                    ]
                )
                .optional(),

            isFeatured: z
                .enum([
                    "true",
                    "false",
                ])
                .transform(
                    (value) =>
                        value === "true"
                )
                .optional(),

            page: z
                .coerce
                .number()
                .int()
                .min(
                    1,
                    "Page must be at least 1."
                )
                .max(
                    10_000,
                    "Page is too large."
                )
                .default(1),

            limit: z
                .coerce
                .number()
                .int()
                .min(
                    1,
                    "Limit must be at least 1."
                )
                .max(
                    100,
                    "Limit cannot exceed 100."
                )
                .default(20),

            sortBy: z
                .enum([
                    "name",
                    "sortOrder",
                    "createdAt",
                    "updatedAt",
                ])
                .default(
                    "sortOrder"
                ),

            sortOrder: z
                .enum([
                    "asc",
                    "desc",
                ])
                .default("asc"),
        })
        .strict();

/*
|--------------------------------------------------------------------------
| Status Update
|--------------------------------------------------------------------------
*/

export const updateCategoryStatusSchema =
    z
        .object({
            status: z.enum(
                Object.values(
                    CATEGORY_STATUSES
                ) as [
                    (typeof CATEGORY_STATUSES)[keyof typeof CATEGORY_STATUSES],
                    ...(typeof CATEGORY_STATUSES)[keyof typeof CATEGORY_STATUSES][]
                ]
            ),
        })
        .strict();

/*
|--------------------------------------------------------------------------
| Featured Update
|--------------------------------------------------------------------------
*/

export const updateCategoryFeaturedSchema =
    z
        .object({
            isFeatured:
                z.boolean(),
        })
        .strict();

/*
|--------------------------------------------------------------------------
| Sort Order Update
|--------------------------------------------------------------------------
*/

export const updateCategorySortOrderSchema =
    z
        .object({
            sortOrder: z
                .number()
                .int()
                .min(0)
                .max(
                    1_000_000
                ),
        })
        .strict();

/*
|--------------------------------------------------------------------------
| Exported Types
|--------------------------------------------------------------------------
*/

export type CreateCategoryInput =
    z.infer<
        typeof createCategorySchema
    >;

export type UpdateCategoryInput =
    z.infer<
        typeof updateCategorySchema
    >;

export type CategoryIdParams =
    z.infer<
        typeof categoryIdParamSchema
    >;

export type CategoryListQuery =
    z.infer<
        typeof categoryListQuerySchema
    >;
