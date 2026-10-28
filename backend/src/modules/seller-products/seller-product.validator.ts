import { z } from "zod";
import { PRODUCT_STATUSES, PRODUCT_TYPES } from "../products/product.types";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const slug = z
  .string()
  .trim()
  .min(2)
  .max(200)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain lowercase letters, numbers and hyphens",
  );

const shippingSchema = z
  .object({
    required: z.boolean().optional(),
    weight: z.number().finite().min(0).optional(),
    weightUnit: z.enum(["g", "kg"]).optional(),
    length: z.number().finite().min(0).optional(),
    width: z.number().finite().min(0).optional(),
    height: z.number().finite().min(0).optional(),
    dimensionUnit: z.enum(["cm", "m"]).optional(),
  })
  .strict();

const seoSchema = z
  .object({
    title: z.string().trim().max(70).optional(),
    description: z.string().trim().max(320).optional(),
    keywords: z.array(z.string().trim().max(80)).max(30).optional(),
    canonicalUrl: z.string().url().max(2048).optional(),
  })
  .strict();

const productFields = {
  name: z.string().trim().min(2).max(180),
  slug: slug.optional(),
  description: z.string().trim().max(30000).optional(),
  shortDescription: z.string().trim().max(500).optional(),
  type: z.enum(PRODUCT_TYPES).optional(),
  sku: z.string().trim().min(1).max(100).optional(),
  barcode: z.string().trim().min(1).max(100).optional(),
  categoryId: objectId,
  subcategoryId: objectId.optional(),
  brandId: objectId.optional(),
  collectionIds: z.array(objectId).max(100).optional(),
  price: z.number().finite().min(0),
  compareAtPrice: z.number().finite().min(0).optional(),
  currency: z.string().trim().length(3).optional(),
  trackInventory: z.boolean().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  inventoryPolicy: z.enum(["DENY", "CONTINUE"]).optional(),
  requiresShipping: z.boolean().optional(),
  shipping: shippingSchema.optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(100).optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  seo: seoSchema.optional(),
};

const createBody = z
  .object(productFields)
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.compareAtPrice !== undefined &&
      data.compareAtPrice <= data.price
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["compareAtPrice"],
        message: "compareAtPrice must be greater than price",
      });
    }

    if (data.type === "DIGITAL" && data.requiresShipping === true) {
      ctx.addIssue({
        code: "custom",
        path: ["requiresShipping"],
        message: "Digital products cannot require shipping",
      });
    }
  });

const updateBody = z
  .object(productFields)
  .partial()
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.compareAtPrice !== undefined &&
      data.price !== undefined &&
      data.compareAtPrice <= data.price
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["compareAtPrice"],
        message: "compareAtPrice must be greater than price",
      });
    }

    if (data.type === "DIGITAL" && data.requiresShipping === true) {
      ctx.addIssue({
        code: "custom",
        path: ["requiresShipping"],
        message: "Digital products cannot require shipping",
      });
    }
  });

export const sellerProductCreateSchema = z
  .object({
    body: createBody,
  })
  .strict();

export const sellerProductUpdateSchema = z
  .object({
    params: z.object({ id: objectId }).strict(),
    body: updateBody,
  })
  .strict();

export const sellerProductIdSchema = z
  .object({
    params: z.object({ id: objectId }).strict(),
  })
  .strict();

export const sellerProductListSchema = z
  .object({
    query: z
      .object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        search: z.string().trim().max(150).optional(),
        status: z.enum(PRODUCT_STATUSES).optional(),
        type: z.enum(PRODUCT_TYPES).optional(),
        categoryId: objectId.optional(),
        subcategoryId: objectId.optional(),
        brandId: objectId.optional(),
        minPrice: z.coerce.number().min(0).optional(),
        maxPrice: z.coerce.number().min(0).optional(),
        inStock: z.enum(["true", "false"]).optional(),
        sortBy: z
          .enum(["createdAt", "updatedAt", "name", "price"])
          .default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
      .strict()
      .superRefine((query, ctx) => {
        if (
          query.minPrice !== undefined &&
          query.maxPrice !== undefined &&
          query.minPrice > query.maxPrice
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["minPrice"],
            message: "minPrice cannot exceed maxPrice",
          });
        }
      }),
  })
  .strict();

export type SellerProductCreateBody = z.infer<
  typeof sellerProductCreateSchema
>["body"];

export type SellerProductUpdateBody = z.infer<
  typeof sellerProductUpdateSchema
>["body"];

export type SellerProductListQuery = z.infer<
  typeof sellerProductListSchema
>["query"];

export const sellerProductUpdateParamsSchema = z
  .object({
    params: z.object({ id: objectId }).strict(),
  })
  .strict();

export const sellerProductUpdateBodySchema = z
  .object({
    body: updateBody,
  })
  .strict();

export const sellerProductResubmitParamsSchema = sellerProductIdSchema;

export const sellerProductReviewParamsSchema = z
  .object({
    params: z.object({ id: objectId }).strict(),
  })
  .strict();

export const sellerProductReviewBodySchema = z
  .object({
    body: z
      .object({
        decision: z.enum(["APPROVED", "REJECTED"]),
        rejectionReason: z.string().trim().max(2000).optional(),
      })
      .strict()
      .superRefine((data, ctx) => {
        if (data.decision === "REJECTED" && !data.rejectionReason?.trim()) {
          ctx.addIssue({
            code: "custom",
            path: ["rejectionReason"],
            message: "A rejection reason is required.",
          });
        }
      }),
  })
  .strict();
