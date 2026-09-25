import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Common
|--------------------------------------------------------------------------
*/

const objectIdSchema = z
    .string()
    .regex(
        /^[a-f\d]{24}$/i,
        "Invalid ObjectId.",
    );

const jobApplicationStatuses = [
    "SUBMITTED",
    "UNDER_REVIEW",
    "SHORTLISTED",
    "INTERVIEW",
    "SELECTED",
    "REJECTED",
    "WITHDRAWN",
] as const;

/*
|--------------------------------------------------------------------------
| Create Application
|--------------------------------------------------------------------------
*/

export const createJobApplicationSchema = z.object({
    vacancyId: objectIdSchema,

    name: z
        .string()
        .trim()
        .min(2)
        .max(150),

    email: z
        .string()
        .trim()
        .email()
        .max(254),

    phone: z
        .string()
        .trim()
        .max(30)
        .optional(),

    resumeUrl: z
        .string()
        .trim()
        .url()
        .max(2000)
        .optional(),

    coverLetter: z
        .string()
        .trim()
        .max(10000)
        .optional(),
});

/*
|--------------------------------------------------------------------------
| Update Application Status
|--------------------------------------------------------------------------
*/

export const updateJobApplicationStatusSchema = z.object({
    status: z.enum(jobApplicationStatuses),

    rejectionReason: z
        .string()
        .trim()
        .max(2000)
        .optional(),

    notes: z
        .string()
        .trim()
        .max(5000)
        .optional(),

    interviewAt: z
        .coerce
        .date()
        .optional(),
});

/*
|--------------------------------------------------------------------------
| Application ID
|--------------------------------------------------------------------------
*/

export const jobApplicationIdParamSchema = z.object({
    applicationId: objectIdSchema,
});

/*
|--------------------------------------------------------------------------
| Query
|--------------------------------------------------------------------------
*/

export const jobApplicationQuerySchema = z.object({
    page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1),

    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20),

    status: z
        .enum(jobApplicationStatuses)
        .optional(),

    vacancyId: objectIdSchema.optional(),

    applicantId: objectIdSchema.optional(),

    search: z
        .string()
        .trim()
        .max(100)
        .optional(),
});

/*
|--------------------------------------------------------------------------
| Inferred Types
|--------------------------------------------------------------------------
*/

export type CreateJobApplicationInput =
    z.infer<typeof createJobApplicationSchema>;

export type UpdateJobApplicationStatusInput =
    z.infer<typeof updateJobApplicationStatusSchema>;

export type JobApplicationIdParam =
    z.infer<typeof jobApplicationIdParamSchema>;

export type JobApplicationQueryInput =
    z.infer<typeof jobApplicationQuerySchema>;