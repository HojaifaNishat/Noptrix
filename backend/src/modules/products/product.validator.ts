import { z } from "zod";
import { PRODUCT_STATUSES, PRODUCT_TYPES, INVENTORY_POLICIES } from "./product.model";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ID.");
const slug = z.string().trim().min(2).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i);
const status = z.enum([
  PRODUCT_STATUSES.DRAFT,
  PRODUCT_STATUSES.ACTIVE,
  PRODUCT_STATUSES.INACTIVE,
  PRODUCT_STATUSES.ARCHIVED,
]);
const type = z.enum([
  PRODUCT_TYPES.SIMPLE,
  PRODUCT_TYPES.VARIABLE,
  PRODUCT_TYPES.DIGITAL,
  PRODUCT_TYPES.SERVICE,
]);
const inventoryPolicy = z.enum([
  INVENTORY_POLICIES.TRACK,
  INVENTORY_POLICIES.DONT_TRACK,
]);
const seoSchema = z.object({
  title: z.string().trim().max(200).optional(),
  description: z.string().trim().max(500).optional(),
  keywords: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
}).strict();
const shippingSchema = z.object({
  requiresShipping: z.boolean().default(true),
  weight: z.number().nonnegative().optional(),
  weightUnit: z.enum(["g", "kg"]).optional(),
  length: z.number().nonnegative().optional(),
  width: z.number().nonnegative().optional(),
  height: z.number().nonnegative().optional(),
  dimensionUnit: z.enum(["cm", "m"]).optional(),
}).strict();

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(180),
  slug: slug.optional(),
  type: type.default(PRODUCT_TYPES.SIMPLE),
  shortDescription: z.string().trim().max(500).optional(),
  description: z.string().trim().max(10000).default(""),
  categoryId: objectId.optional(),
  subcategoryId: objectId.optional(),
  brandId: objectId.optional(),
  collectionIds: z.array(objectId).max(100).default([]),
  sku: z.string().trim().min(1).max(80),
  barcode: z.string().trim().max(120).optional(),
  price: z.coerce.number().finite().positive(),
  compareAtPrice: z.coerce.number().finite().positive().optional(),
  currency: z.string().trim().length(3).transform(v => v.toUpperCase()).default("SAR"),
  images: z.array(z.string().trim().url().max(2048)).max(50).default([]),
  status: status.default(PRODUCT_STATUSES.DRAFT),
  isFeatured: z.boolean().default(false),
  inventoryPolicy: inventoryPolicy.default(INVENTORY_POLICIES.TRACK),
  hasVariants: z.boolean().default(false),
  defaultImageId: objectId.optional(),
  seo: seoSchema.optional(),
  shipping: shippingSchema.default({ requiresShipping: true }),
}).strict().superRefine((v, ctx) => {
  if (v.compareAtPrice !== undefined && v.compareAtPrice < v.price) {
    ctx.addIssue({ code: "custom", path: ["compareAtPrice"], message: "compareAtPrice must be greater than or equal to price." });
  }
  if (v.type === PRODUCT_TYPES.VARIABLE && !v.hasVariants) {
    ctx.addIssue({ code: "custom", path: ["hasVariants"], message: "VARIABLE products must enable hasVariants." });
  }
  if (v.hasVariants && v.type !== PRODUCT_TYPES.VARIABLE) {
    ctx.addIssue({ code: "custom", path: ["type"], message: "Products with variants must use VARIABLE type." });
  }
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(2).max(180).optional(),
  slug: slug.optional(),
  type: type.optional(),
  shortDescription: z.string().trim().max(500).nullable().optional(),
  description: z.string().trim().max(10000).optional(),
  categoryId: objectId.nullable().optional(),
  subcategoryId: objectId.nullable().optional(),
  brandId: objectId.nullable().optional(),
  collectionIds: z.array(objectId).max(100).optional(),
  sku: z.string().trim().min(1).max(80).optional(),
  barcode: z.string().trim().max(120).nullable().optional(),
  price: z.coerce.number().finite().positive().optional(),
  compareAtPrice: z.coerce.number().finite().positive().nullable().optional(),
  currency: z.string().trim().length(3).transform(v => v.toUpperCase()).optional(),
  images: z.array(z.string().trim().url().max(2048)).max(50).optional(),
  status: status.optional(),
  isFeatured: z.boolean().optional(),
  inventoryPolicy: inventoryPolicy.optional(),
  hasVariants: z.boolean().optional(),
  defaultImageId: objectId.nullable().optional(),
  seo: seoSchema.optional(),
  shipping: shippingSchema.optional(),
}).strict().refine(v => Object.keys(v).length > 0, {
  message: "At least one field is required.",
}).superRefine((v, ctx) => {
  if (v.compareAtPrice != null && v.price != null && v.compareAtPrice < v.price) {
    ctx.addIssue({ code: "custom", path: ["compareAtPrice"], message: "compareAtPrice must be greater than or equal to price." });
  }
});

export const productIdParamSchema = z.object({ productId: objectId });
export const productSlugParamSchema = z.object({ slug: z.string().trim().min(1).max(200) });
export const productStatusSchema = z.object({ status });
export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(150).optional(),
  categoryId: objectId.optional(),
  subcategoryId: objectId.optional(),
  brandId: objectId.optional(),
  status: status.optional(),
  type: type.optional(),
  isFeatured: z.enum(["true", "false"]).transform(v => v === "true").optional(),
  hasVariants: z.enum(["true", "false"]).transform(v => v === "true").optional(),
  sortBy: z.enum(["name", "price", "createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const imageCreateSchema = z.object({
  productId: objectId,
  url: z.string().trim().url().max(2048),
  publicId: z.string().trim().max(500).optional(),
  alt: z.string().trim().max(300).default(""),
  sortOrder: z.coerce.number().int().min(0).max(1000000).default(0),
  isPrimary: z.boolean().default(false),
}).strict();
export const imageUpdateSchema = imageCreateSchema.omit({ productId: true }).partial()
  .strict().refine(v => Object.keys(v).length > 0, { message: "At least one field is required." });

export const tagCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i).optional(),
  description: z.string().trim().max(500).optional(),
}).strict();
export const tagUpdateSchema = tagCreateSchema.partial().strict()
  .refine(v => Object.keys(v).length > 0, { message: "At least one field is required." });

export const variantCreateSchema = z.object({
  productId: objectId,
  name: z.string().trim().min(1).max(180),
  sku: z.string().trim().min(1).max(80),
  options: z.record(z.string(), z.string().trim().min(1).max(100)).default({}),
  price: z.coerce.number().finite().positive(),
  compareAtPrice: z.coerce.number().finite().positive().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
}).strict().refine(v => v.compareAtPrice === undefined || v.compareAtPrice >= v.price, {
  message: "compareAtPrice must be greater than or equal to price.",
  path: ["compareAtPrice"],
});
export const variantUpdateSchema = variantCreateSchema.omit({ productId: true }).partial()
  .strict().refine(v => Object.keys(v).length > 0, { message: "At least one field is required." });
export const mongoIdParamSchema = z.object({ id: objectId });
export const assignTagSchema = z.object({ productId: objectId, tagId: objectId });
export const productTagAssignmentParamSchema = z.object({ productId: objectId, tagId: objectId });
