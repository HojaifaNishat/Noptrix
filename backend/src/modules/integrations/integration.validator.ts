import { z } from "zod";

const safeConfigSchema = z
  .record(z.string(), z.unknown())
  .default({})
  .refine(
    (value) => Object.keys(value).length <= 50,
    "Config may contain at most 50 keys.",
  );

export const createIntegrationSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    provider: z.string().trim().min(2).max(100),
    description: z.string().trim().max(1000).optional(),
    config: safeConfigSchema,
    secretEnvKeys: z
      .array(
        z
          .string()
          .regex(
            /^[A-Z][A-Z0-9_]{1,99}$/,
            "Use a valid environment variable name.",
          ),
      )
      .max(30)
      .default([]),
  })
  .strict();

export const updateIntegrationSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    provider: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    config: safeConfigSchema.optional(),
    secretEnvKeys: z
      .array(z.string().regex(/^[A-Z][A-Z0-9_]{1,99}$/))
      .max(30)
      .optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field must be provided.",
  );

export const integrationIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i),
});

export const listIntegrationsSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(["ACTIVE", "INACTIVE", "ERROR"]).optional(),
    provider: z.string().trim().min(1).max(100).optional(),
    search: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

export type CreateIntegrationInput = z.infer<typeof createIntegrationSchema>;
export type UpdateIntegrationInput = z.infer<typeof updateIntegrationSchema>;
export type ListIntegrationsQuery = z.infer<typeof listIntegrationsSchema>;
