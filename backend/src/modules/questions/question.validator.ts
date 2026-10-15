import { z } from "zod";

const objectIdSchema = z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId.");

const trimmedString = (
    min: number,
    max: number,
    field: string,
) =>
    z
        .string()
        .trim()
        .min(min, `${field} must contain at least ${min} characters.`)
        .max(max, `${field} cannot exceed ${max} characters.`);

const paginationSchema = z.object({
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
});

export const createQuestionSchema = z.object({
    body: z.object({
        productId: objectIdSchema,
        question: trimmedString(5, 3000, "Question"),
    }).strict(),
});

export const productQuestionsParamsSchema = z.object({
    params: z.object({
        productId: objectIdSchema,
    }),
    query: paginationSchema,
});

export const questionIdParamsSchema = z.object({
    params: z.object({
        questionId: objectIdSchema,
    }),
});

export const myQuestionsQuerySchema = z.object({
    query: paginationSchema,
});

export const adminQuestionsQuerySchema = z.object({
    query: paginationSchema.extend({
        status: z.enum([
            "PENDING",
            "APPROVED",
            "ANSWERED",
            "REJECTED",
        ]).optional(),
        productId: objectIdSchema.optional(),
        customerId: objectIdSchema.optional(),
    }),
});

export const answerQuestionSchema = z.object({
    params: z.object({
        questionId: objectIdSchema,
    }),
    body: z.object({
        answer: trimmedString(2, 10000, "Answer"),
    }).strict(),
});

export const moderateQuestionSchema = z.object({
    params: z.object({
        questionId: objectIdSchema,
    }),
    body: z.object({
        status: z.enum(["APPROVED", "REJECTED"]),
        reason: z.string()
            .trim()
            .max(1000)
            .optional(),
    }).strict().superRefine((data, ctx) => {
        if (
            data.status === "REJECTED" &&
            (!data.reason || data.reason.length < 3)
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["reason"],
                message:
                    "A rejection reason of at least 3 characters is required.",
            });
        }
    }),
});

export type CreateQuestionBody = z.infer<
    typeof createQuestionSchema
>["body"];

export type ProductQuestionsParams = z.infer<
    typeof productQuestionsParamsSchema
>["params"];

export type AnswerQuestionBody = z.infer<
    typeof answerQuestionSchema
>["body"];

export type ModerateQuestionBody = z.infer<
    typeof moderateQuestionSchema
>["body"];
