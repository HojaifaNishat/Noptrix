export interface ApiErrorOptions {
    readonly statusCode?: number;
    readonly code?: string;
    readonly details?: unknown;
    readonly isOperational?: boolean;
    readonly cause?: unknown;
    readonly expose?: boolean;
}

export interface SerializedApiError {
    readonly success: false;
    readonly message: string;
    readonly code: string;
    readonly statusCode: number;
    readonly details?: unknown;
}

const DEFAULT_STATUS_CODE = 500;
const DEFAULT_ERROR_CODE = "INTERNAL_SERVER_ERROR";

const MIN_STATUS_CODE = 400;
const MAX_STATUS_CODE = 599;

const isValidStatusCode = (
    statusCode: number
): boolean => {
    return (
        Number.isInteger(statusCode) &&
        statusCode >= MIN_STATUS_CODE &&
        statusCode <= MAX_STATUS_CODE
    );
};

export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details?: unknown;
    public readonly isOperational: boolean;
    public readonly expose: boolean;

    public constructor(
        message: string,
        options: ApiErrorOptions = {}
    ) {
        super(message);

        this.name = "ApiError";

        const statusCode =
            options.statusCode ??
            DEFAULT_STATUS_CODE;

        if (!isValidStatusCode(statusCode)) {
            throw new RangeError(
                `Invalid API error status code: ${statusCode}`
            );
        }

        this.statusCode = statusCode;

        this.code =
            options.code?.trim() ||
            DEFAULT_ERROR_CODE;

        this.details = options.details;

        this.isOperational =
            options.isOperational ?? true;

        this.expose =
            options.expose ??
            statusCode < 500;

        if (options.cause !== undefined) {
            this.cause = options.cause;
        }

        Object.setPrototypeOf(
            this,
            new.target.prototype
        );

        Error.captureStackTrace(
            this,
            new.target
        );
    }

    public serialize(): SerializedApiError {
        const response: {
            success: false;
            message: string;
            code: string;
            statusCode: number;
            details?: unknown;
        } = {
            success: false,
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
        };

        if (this.details !== undefined) {
            response.details = this.details;
        }

        return response;
    }

    public static badRequest(
        message = "Bad request.",
        options: Omit<
            ApiErrorOptions,
            "statusCode"
        > = {}
    ): ApiError {
        return new ApiError(message, {
            ...options,
            statusCode: 400,
        });
    }

    public static unauthorized(
        message = "Authentication required.",
        options: Omit<
            ApiErrorOptions,
            "statusCode"
        > = {}
    ): ApiError {
        return new ApiError(message, {
            ...options,
            statusCode: 401,
        });
    }

    public static forbidden(
        message = "You do not have permission to perform this action.",
        options: Omit<
            ApiErrorOptions,
            "statusCode"
        > = {}
    ): ApiError {
        return new ApiError(message, {
            ...options,
            statusCode: 403,
        });
    }

    public static notFound(
        message = "The requested resource was not found.",
        options: Omit<
            ApiErrorOptions,
            "statusCode"
        > = {}
    ): ApiError {
        return new ApiError(message, {
            ...options,
            statusCode: 404,
        });
    }

    public static conflict(
        message = "The request conflicts with the current state of the resource.",
        options: Omit<
            ApiErrorOptions,
            "statusCode"
        > = {}
    ): ApiError {
        return new ApiError(message, {
            ...options,
            statusCode: 409,
        });
    }

    public static tooManyRequests(
        message = "Too many requests. Please try again later.",
        options: Omit<
            ApiErrorOptions,
            "statusCode"
        > = {}
    ): ApiError {
        return new ApiError(message, {
            ...options,
            statusCode: 429,
        });
    }

    public static internal(
        message = "An unexpected server error occurred.",
        options: Omit<
            ApiErrorOptions,
            "statusCode"
        > = {}
    ): ApiError {
        return new ApiError(message, {
            ...options,
            statusCode: 500,
        });
    }

    public static isApiError(
        error: unknown
    ): error is ApiError {
        return error instanceof ApiError;
    }
}