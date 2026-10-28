import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");

const productSchema = z.object({
  productId: objectId,
  salePrice: z.number().finite().min(0),
  quantityLimit: z.number().int().positive().nullable().optional(),
});

const createBody = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000).optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    products: z.array(productSchema).min(1),
    status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).optional(),
    priority: z.number().int().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.endsAt <= data.startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "End date must be after start date",
      });
    }

    const ids = data.products.map((item) => item.productId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        path: ["products"],
        message: "Duplicate products are not allowed",
      });
    }
  });

export const createFlashSaleSchema = z.object({
  body: createBody,
});

export const updateFlashSaleSchema = z.object({
  params: z.object({
    flashSaleId: objectId,
  }),
  body: createBody.partial().superRefine((data, ctx) => {
    if (data.startsAt && data.endsAt && data.endsAt <= data.startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "End date must be after start date",
      });
    }

    if (data.products) {
      const ids = data.products.map((item) => item.productId);
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({
          code: "custom",
          path: ["products"],
          message: "Duplicate products are not allowed",
        });
      }
    }
  }),
});

export const flashSaleIdParamsSchema = z.object({
  params: z.object({ flashSaleId: objectId }),
});

export const flashSaleListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).optional(),
  }),
});
