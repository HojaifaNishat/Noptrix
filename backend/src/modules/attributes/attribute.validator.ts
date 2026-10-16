import { z } from "zod";
import { ATTRIBUTE_TYPES, ATTRIBUTE_STATUSES } from "./attribute.model";

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain lowercase letters, numbers and hyphens.");

const optionsSchema = z
  .array(z.string().trim().min(1).max(120))
  .max(200)
  .refine(
    (values) =>
      new Set(values.map((value) => value.toLowerCase())).size === values.length,
    "Options must not contain duplicates.",
  );

const commonFields = {
  name: z.string().trim().min(2).max(120),
  slug: slugSchema.optional(),
  description: z.string().trim().max(2000).optional(),
  type: z.enum(ATTRIBUTE_TYPES),
  options: optionsSchema.optional(),
  isRequired: z.boolean().optional(),
  isVariant: z.boolean().optional(),
  isFilterable: z.boolean().optional(),
  isSearchable: z.boolean().optional(),
  status: z.enum(ATTRIBUTE_STATUSES).optional(),
  sortOrder: z.number().finite().min(0).max(1_000_000).optional(),
};

const validateTypeOptions = <
  T extends { type?: string; options?: string[] },
>(
  value: T,
  ctx: z.RefinementCtx,
) => {
  const type = value.type;
  const options = value.options;

  if ((type === "SELECT" || type === "MULTI_SELECT") &&
      (!options || options.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["options"],
      message: "SELECT and MULTI_SELECT attributes require at least one option.",
    });
  }

  if (type && !["SELECT", "MULTI_SELECT"].includes(type) &&
      options && options.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["options"],
      message: "Only SELECT and MULTI_SELECT attributes can define options.",
    });
  }
};

export const createAttributeSchema = z
  .object(commonFields)
  .strict()
  .superRefine(validateTypeOptions);

export const updateAttributeSchema = z
  .object({
    name: commonFields.name.optional(),
    slug: commonFields.slug,
    description: commonFields.description,
    type: commonFields.type.optional(),
    options: commonFields.options,
    isRequired: commonFields.isRequired,
    isVariant: commonFields.isVariant,
    isFilterable: commonFields.isFilterable,
    isSearchable: commonFields.isSearchable,
    status: commonFields.status,
    sortOrder: commonFields.sortOrder,
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided.",
  });

export const attributeIdParamSchema = z.object({
  attributeId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid attribute ID."),
});

export const attributeSlugParamSchema = z.object({
  slug: slugSchema,
});

export const updateAttributeStatusSchema = z.object({
  status: z.enum(ATTRIBUTE_STATUSES),
}).strict();

export const updateAttributeSortOrderSchema = z.object({
  sortOrder: z.number().finite().min(0).max(1_000_000),
}).strict();

export const attributeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  type: z.enum(ATTRIBUTE_TYPES).optional(),
  status: z.enum(ATTRIBUTE_STATUSES).optional(),
  isVariant: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  isFilterable: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  sortBy: z.enum(["name", "createdAt", "updatedAt", "sortOrder"]).default("sortOrder"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
}).strict();

export const attributeIdParamsSchema = attributeIdParamSchema;
export const attributeStatusSchema = updateAttributeStatusSchema;
export const attributeSortOrderSchema = updateAttributeSortOrderSchema;
