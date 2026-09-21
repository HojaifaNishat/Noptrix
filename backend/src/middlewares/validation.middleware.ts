import {
    Request,
    Response,
    NextFunction,
    RequestHandler,
} from "express";

import { ZodError, ZodSchema } from "zod";

/*
|--------------------------------------------------------------------------
| Validation Target
|--------------------------------------------------------------------------
*/

export type ValidationTarget =
    | "body"
    | "query"
    | "params"
    | "headers";

/*
|--------------------------------------------------------------------------
| Zod Validation Middleware
|--------------------------------------------------------------------------
*/

export const validate = (
    schema: ZodSchema,
    target: ValidationTarget = "body"
): RequestHandler => {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const result = schema.safeParse(
                req[target]
            );

            if (!result.success) {
                const formattedErrors =
                    result.error.issues.map(
                        (issue) => ({
                            field:
                                issue.path.length > 0
                                    ? issue.path.join(".")
                                    : "unknown",

                            message: issue.message,

                            code: issue.code,
                        })
                    );

                res.status(400).json({
                    success: false,
                    message:
                        "Validation failed.",
                    errors: formattedErrors,
                });

                return;
            }

            /*
             * Replace the original request data
             * with Zod's parsed/transformed data.
             *
             * This is important when schemas use:
             * - trim()
             * - transform()
             * - preprocess()
             * - coercion
             */
            Object.assign(
                req[target],
                result.data
            );

            next();
        } catch (error) {
            next(error);
        }
    };
};

/*
|--------------------------------------------------------------------------
| Validate Multiple Request Parts
|--------------------------------------------------------------------------
|
| Useful for endpoints that need validation for:
| - params
| - query
| - body
|
*/

export const validateRequest = (schemas: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
    headers?: ZodSchema;
}): RequestHandler => {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const errors: Array<{
                target: string;
                field: string;
                message: string;
                code: string;
            }> = [];

            for (const [
                target,
                schema,
            ] of Object.entries(schemas)) {
                if (!schema) continue;

                const result =
                    schema.safeParse(
                        req[
                            target as ValidationTarget
                        ]
                    );

                if (!result.success) {
                    errors.push(
                        ...result.error.issues.map(
                            (issue) => ({
                                target,
                                field:
                                    issue.path.length >
                                    0
                                        ? issue.path.join(
                                              "."
                                          )
                                        : "unknown",
                                message:
                                    issue.message,
                                code:
                                    issue.code,
                            })
                        )
                    );

                    continue;
                }

                Object.assign(
                    req[
                        target as ValidationTarget
                    ],
                    result.data
                );
            }

            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message:
                        "Request validation failed.",
                    errors,
                });

                return;
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/*
|--------------------------------------------------------------------------
| Zod Error Helper
|--------------------------------------------------------------------------
|
| Useful inside controllers/services when we
| intentionally catch ZodError.
|
*/

export const formatValidationError = (
    error: unknown
) => {
    if (!(error instanceof ZodError)) {
        return null;
    }

    return error.issues.map((issue) => ({
        field:
            issue.path.length > 0
                ? issue.path.join(".")
                : "unknown",

        message: issue.message,

        code: issue.code,
    }));
};