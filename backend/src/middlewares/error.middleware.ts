import {
    Request,
    Response,
    NextFunction,
    ErrorRequestHandler,
} from "express";

import {
    ZodError,
} from "zod";

import {
    ApiError,
} from "../utils/ApiError";

/*
|--------------------------------------------------------------------------
| Error Response Shape
|--------------------------------------------------------------------------
*/

interface ErrorResponse {
    success: false;
    message: string;
    code?: string;
    errors?: unknown;
    stack?: string;
}

/*
|--------------------------------------------------------------------------
| HTTP Status Code Validation
|--------------------------------------------------------------------------
*/

const isValidStatusCode = (
    statusCode: unknown
): statusCode is number => {
    return (
        typeof statusCode === "number" &&
        Number.isInteger(statusCode) &&
        statusCode >= 400 &&
        statusCode <= 599
    );
};

/*
|--------------------------------------------------------------------------
| Error Message Extraction
|--------------------------------------------------------------------------
*/

const getErrorMessage = (
    error: unknown
): string => {
    if (
        error instanceof Error &&
        error.message.trim()
    ) {
        return error.message;
    }

    return "An unexpected error occurred.";
};

/*
|--------------------------------------------------------------------------
| Error Code Extraction
|--------------------------------------------------------------------------
*/

const getErrorCode = (
    error: unknown
): string | undefined => {
    if (
        typeof error === "object" &&
        error !== null &&
        "code" in error
    ) {
        const code =
            (
                error as {
                    code?: unknown;
                }
            ).code;

        if (
            typeof code === "string" &&
            code.trim()
        ) {
            return code;
        }
    }

    return undefined;
};

/*
|--------------------------------------------------------------------------
| ApiError Status Extraction
|--------------------------------------------------------------------------
*/

const getStatusCode = (
    error: unknown
): number => {
    if (
        error instanceof ApiError &&
        isValidStatusCode(
            error.statusCode
        )
    ) {
        return error.statusCode;
    }

    if (
        typeof error === "object" &&
        error !== null &&
        "statusCode" in error
    ) {
        const statusCode =
            (
                error as {
                    statusCode?: unknown;
                }
            ).statusCode;

        if (
            isValidStatusCode(
                statusCode
            )
        ) {
            return statusCode;
        }
    }

    if (
        typeof error === "object" &&
        error !== null &&
        "status" in error
    ) {
        const status =
            (
                error as {
                    status?: unknown;
                }
            ).status;

        if (
            isValidStatusCode(
                status
            )
        ) {
            return status;
        }
    }

    return 500;
};

/*
|--------------------------------------------------------------------------
| Development Environment Check
|--------------------------------------------------------------------------
*/

const isDevelopment =
    process.env.NODE_ENV !==
    "production";

/*
|--------------------------------------------------------------------------
| Zod Error Handler
|--------------------------------------------------------------------------
*/

const handleZodError = (
    error: ZodError
): ErrorResponse => {
    return {
        success: false,

        message:
            "Validation failed.",

        code:
            "VALIDATION_ERROR",

        errors:
            error.issues.map(
                (issue) => ({
                    field:
                        issue.path.join(
                            "."
                        ),

                    message:
                        issue.message,

                    code:
                        issue.code,
                })
            ),
    };
};

/*
|--------------------------------------------------------------------------
| Mongo / Mongoose Duplicate Key Error
|--------------------------------------------------------------------------
*/

const isDuplicateKeyError = (
    error: unknown
): boolean => {
    if (
        typeof error !== "object" ||
        error === null
    ) {
        return false;
    }

    if (
        "code" in error
    ) {
        const code =
            (
                error as {
                    code?: unknown;
                }
            ).code;

        return code === 11000;
    }

    return false;
};

/*
|--------------------------------------------------------------------------
| Duplicate Key Error Response
|--------------------------------------------------------------------------
*/

const handleDuplicateKeyError = (
    error: unknown
): ErrorResponse => {
    let message =
        "A record with the same unique value already exists.";

    let errors:
        | unknown
        | undefined;

    if (
        typeof error === "object" &&
        error !== null &&
        "keyValue" in error
    ) {
        const keyValue =
            (
                error as {
                    keyValue?: unknown;
                }
            ).keyValue;

        if (
            keyValue &&
            typeof keyValue ===
                "object"
        ) {
            const fields =
                Object.keys(
                    keyValue
                );

            if (
                fields.length > 0
            ) {
                message =
                    `A record with the same ${fields.join(
                        ", "
                    )} already exists.`;

                errors =
                    fields.map(
                        (
                            field
                        ) => ({
                            field,
                            message:
                                `${field} already exists.`,
                        })
                    );
            }
        }
    }

    return {
        success: false,
        message,
        code:
            "DUPLICATE_RESOURCE",
        ...(errors
            ? { errors }
            : {}),
    };
};

/*
|--------------------------------------------------------------------------
| Cast Error Handler
|--------------------------------------------------------------------------
|
| Handles invalid MongoDB ObjectId
| and similar cast failures.
|
|--------------------------------------------------------------------------
*/

const isMongooseCastError = (
    error: unknown
): boolean => {
    if (
        typeof error !== "object" ||
        error === null
    ) {
        return false;
    }

    if (
        "name" in error
    ) {
        const name =
            (
                error as {
                    name?: unknown;
                }
            ).name;

        return (
            name ===
            "CastError"
        );
    }

    return false;
};

const handleMongooseCastError =
    (): ErrorResponse => {
        return {
            success: false,

            message:
                "Invalid resource identifier.",

            code:
                "INVALID_RESOURCE_ID",
        };
    };

/*
|--------------------------------------------------------------------------
| Mongoose Validation Error
|--------------------------------------------------------------------------
*/

const isMongooseValidationError = (
    error: unknown
): boolean => {
    if (
        typeof error !== "object" ||
        error === null
    ) {
        return false;
    }

    if (
        "name" in error
    ) {
        const name =
            (
                error as {
                    name?: unknown;
                }
            ).name;

        return (
            name ===
            "ValidationError"
        );
    }

    return false;
};

const handleMongooseValidationError =
    (
        error: unknown
    ): ErrorResponse => {
        const errors: Array<{
            field: string;
            message: string;
        }> = [];

        if (
            typeof error ===
                "object" &&
            error !== null &&
            "errors" in error
        ) {
            const mongooseErrors =
                (
                    error as {
                        errors?: Record<
                            string,
                            {
                                message?: string;
                            }
                        >;
                    }
                ).errors;

            if (
                mongooseErrors
            ) {
                for (
                    const [
                        field,
                        fieldError,
                    ] of Object.entries(
                        mongooseErrors
                    )
                ) {
                    errors.push({
                        field,

                        message:
                            fieldError
                                ?.message ||
                            "Invalid value.",
                    });
                }
            }
        }

        return {
            success: false,

            message:
                "Database validation failed.",

            code:
                "DATABASE_VALIDATION_ERROR",

            ...(errors.length > 0
                ? { errors }
                : {}),
        };
    };

/*
|--------------------------------------------------------------------------
| JSON Parse Error
|--------------------------------------------------------------------------
*/

const isJsonParseError = (
    error: unknown
): boolean => {
    if (
        !(error instanceof Error)
    ) {
        return false;
    }

    return (
        error instanceof
            SyntaxError &&
        "body" in error
    );
};

const handleJsonParseError =
    (): ErrorResponse => {
        return {
            success: false,

            message:
                "Invalid JSON request body.",

            code:
                "INVALID_JSON",
        };
    };

/*
|--------------------------------------------------------------------------
| Error Logger
|--------------------------------------------------------------------------
*/

const logError = (
    error: unknown,
    req: Request
): void => {
    /*
     * Keep logging centralized.
     *
     * Later this can be connected directly
     * to the project's logger utility.
     */

    if (
        isDevelopment
    ) {
        console.error(
            "[ERROR]",
            {
                method:
                    req.method,

                path:
                    req.originalUrl,

                message:
                    getErrorMessage(
                        error
                    ),

                error,
            }
        );
    }
};

/*
|--------------------------------------------------------------------------
| Global Error Middleware
|--------------------------------------------------------------------------
*/

export const errorMiddleware:
    ErrorRequestHandler = (
        error,
        req,
        res,
        _next
    ) => {
        /*
        |--------------------------------------------------------------------------
        | Prevent duplicate responses
        |--------------------------------------------------------------------------
        */

        if (
            res.headersSent
        ) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Logging
        |--------------------------------------------------------------------------
        */

        logError(
            error,
            req
        );

        /*
        |--------------------------------------------------------------------------
        | Zod Validation Error
        |--------------------------------------------------------------------------
        */

        if (
            error instanceof
            ZodError
        ) {
            const response =
                handleZodError(
                    error
                );

            res.status(
                400
            ).json(
                response
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Duplicate Database Key
        |--------------------------------------------------------------------------
        */

        if (
            isDuplicateKeyError(
                error
            )
        ) {
            const response =
                handleDuplicateKeyError(
                    error
                );

            res.status(
                409
            ).json(
                response
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Mongoose Cast Error
        |--------------------------------------------------------------------------
        */

        if (
            isMongooseCastError(
                error
            )
        ) {
            const response =
                handleMongooseCastError();

            res.status(
                400
            ).json(
                response
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Mongoose Validation Error
        |--------------------------------------------------------------------------
        */

        if (
            isMongooseValidationError(
                error
            )
        ) {
            const response =
                handleMongooseValidationError(
                    error
                );

            res.status(
                400
            ).json(
                response
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Invalid JSON
        |--------------------------------------------------------------------------
        */

        if (
            isJsonParseError(
                error
            )
        ) {
            const response =
                handleJsonParseError();

            res.status(
                400
            ).json(
                response
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | ApiError
        |--------------------------------------------------------------------------
        */

        if (
            error instanceof
            ApiError
        ) {
            const statusCode =
                getStatusCode(
                    error
                );

            const response:
                ErrorResponse = {
                success: false,

                message:
                    error.message,

                ...(getErrorCode(
                    error
                )
                    ? {
                          code:
                              getErrorCode(
                                  error
                              ),
                      }
                    : {}),
            };

            /*
             * Expose stack only in development.
             */
            if (
                isDevelopment &&
                error.stack
            ) {
                response.stack =
                    error.stack;
            }

            res.status(
                statusCode
            ).json(
                response
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Generic Error
        |--------------------------------------------------------------------------
        */

        const statusCode =
            getStatusCode(
                error
            );

        const response:
            ErrorResponse = {
            success: false,

            message:
                statusCode >= 500 &&
                !isDevelopment
                    ? "Internal server error."
                    : getErrorMessage(
                          error
                      ),
        };

        const errorCode =
            getErrorCode(
                error
            );

        if (
            errorCode
        ) {
            response.code =
                errorCode;
        }

        /*
         * Never expose stack traces
         * in production.
         */
        if (
            isDevelopment &&
            error instanceof Error &&
            error.stack
        ) {
            response.stack =
                error.stack;
        }

        res.status(
            statusCode
        ).json(
            response
        );
    };

/*
|--------------------------------------------------------------------------
| Alias
|--------------------------------------------------------------------------
|
| Some files may prefer the conventional
| "globalErrorHandler" naming.
|
|--------------------------------------------------------------------------
*/

export const globalErrorHandler =
    errorMiddleware;

/*
|--------------------------------------------------------------------------
| Not Found Handler
|--------------------------------------------------------------------------
*/

export const notFoundMiddleware =
    (
        req: Request,
        res: Response
    ): void => {
        res.status(404).json({
            success: false,

            message:
                `Route not found: ${req.method} ${req.originalUrl}`,

            code:
                "ROUTE_NOT_FOUND",
        });
    };