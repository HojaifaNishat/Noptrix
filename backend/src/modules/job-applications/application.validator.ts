import { z } from "zod";
import { APPLICATION_STATUSES } from "./application.model";

const applicationIdSchema = z
    .string()
    .trim()
    .min(1, "Application ID is required.");

export const createApplicationSchema =
    z.object({
        fullName: z
            .string()
            .trim()
            .min(1, "Full name is required.")
            .max(100),

        email: z
            .string()
            .trim()
            .email("Invalid email format.")
            .toLowerCase(),

        phone: z
            .string()
            .trim()
            .min(7, "Phone number is too short.")
            .max(30, "Phone number is too long."),

        coverLetter: z
            .string()
            .trim()
            .max(3000)
            .optional(),

        resumeUrl: z
            .string()
            .trim()
            .url("Invalid resume URL format."),

        appliedRoleId: z
            .string()
            .trim()
            .optional(),
    });

export const updateApplicationStatusSchema =
    z.object({
        status: z.enum([
            APPLICATION_STATUSES.PENDING,
            APPLICATION_STATUSES.SHORTLISTED,
            APPLICATION_STATUSES.REJECTED,
            APPLICATION_STATUSES.ACCEPTED,
        ]),
        notes: z
            .string()
            .trim()
            .max(2000)
            .optional(),
    });

export const applicationIdParamSchema =
    z.object({
        id: applicationIdSchema,
    });

export type CreateApplicationInput =
    z.infer<
        typeof createApplicationSchema
    >;

export type UpdateApplicationStatusInput =
    z.infer<
        typeof updateApplicationStatusSchema
    >;

export type ApplicationIdParam =
    z.infer<
        typeof applicationIdParamSchema
    >;
