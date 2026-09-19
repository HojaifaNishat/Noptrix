/*
|--------------------------------------------------------------------------
| API Response Types
|--------------------------------------------------------------------------
*/

export interface ApiResponseMeta {
    readonly requestId?: string;
    readonly timestamp?: string;
    readonly [key: string]: unknown;
}

export interface ApiResponseOptions {
    readonly statusCode?: number;
    readonly message?: string;
    readonly meta?: ApiResponseMeta;
}

export interface SerializedApiResponse<
    T = unknown
> {
    readonly success: true;
    readonly message: string;
    readonly data: T;
    readonly meta?: ApiResponseMeta;
}

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_STATUS_CODE = 200;

const DEFAULT_SUCCESS_MESSAGE =
    "Request successful.";

const CREATED_STATUS_CODE = 201;
const ACCEPTED_STATUS_CODE = 202;
const NO_CONTENT_STATUS_CODE = 204;

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

const isValidStatusCode = (
    statusCode: number
): boolean => {
    return (
        Number.isInteger(statusCode) &&
        statusCode >= 200 &&
        statusCode <= 299
    );
};

const normalizeMessage = (
    message: unknown
): string => {
    if (
        typeof message !== "string"
    ) {
        return DEFAULT_SUCCESS_MESSAGE;
    }

    const normalized =
        message.trim();

    return (
        normalized ||
        DEFAULT_SUCCESS_MESSAGE
    );
};

const normalizeMeta = (
    meta?: ApiResponseMeta
): ApiResponseMeta | undefined => {
    if (meta === undefined) {
        return undefined;
    }

    return Object.freeze({
        ...meta,
    });
};

/*
|--------------------------------------------------------------------------
| API Response
|--------------------------------------------------------------------------
*/

export class ApiResponse<
    T = unknown
> {
    public readonly success = true;

    public readonly statusCode: number;

    public readonly message: string;

    public readonly data: T;

    public readonly meta?:
        | ApiResponseMeta
        | undefined;

    public constructor(
        data: T,
        options: ApiResponseOptions = {}
    ) {
        const statusCode =
            options.statusCode ??
            DEFAULT_STATUS_CODE;

        if (
            !isValidStatusCode(
                statusCode
            )
        ) {
            throw new RangeError(
                `Invalid API success status code: ${statusCode}`
            );
        }

        /*
        |--------------------------------------------------------------------------
        | 204 No Content
        |--------------------------------------------------------------------------
        |
        | HTTP 204 responses must not contain
        | a response body.
        |
        | The helper `noContent()` exists for
        | semantic correctness, while the actual
        | Express middleware should send 204
        | without JSON.
        |
        */

        this.statusCode =
            statusCode;

        this.message =
            normalizeMessage(
                options.message
            );

        this.data = data;

        this.meta =
            normalizeMeta(
                options.meta
            );
    }

    /*
    |--------------------------------------------------------------------------
    | Serialize
    |--------------------------------------------------------------------------
    */

    public serialize():
        SerializedApiResponse<T> {
        const response: {
            success: true;
            message: string;
            data: T;
            meta?: ApiResponseMeta;
        } = {
            success: true,
            message: this.message,
            data: this.data,
        };

        if (
            this.meta !== undefined
        ) {
            response.meta =
                this.meta;
        }

        return response;
    }

    /*
    |--------------------------------------------------------------------------
    | Standard 200 OK
    |--------------------------------------------------------------------------
    */

    public static ok<T>(
        data: T,
        message =
            DEFAULT_SUCCESS_MESSAGE,
        meta?: ApiResponseMeta
    ): ApiResponse<T> {
        return new ApiResponse<T>(
            data,
            {
                statusCode:
                    DEFAULT_STATUS_CODE,
                message,
                meta,
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Standard 201 Created
    |--------------------------------------------------------------------------
    */

    public static created<T>(
        data: T,
        message =
            "Resource created successfully.",
        meta?: ApiResponseMeta
    ): ApiResponse<T> {
        return new ApiResponse<T>(
            data,
            {
                statusCode:
                    CREATED_STATUS_CODE,
                message,
                meta,
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Standard 202 Accepted
    |--------------------------------------------------------------------------
    */

    public static accepted<T>(
        data: T,
        message =
            "Request accepted.",
        meta?: ApiResponseMeta
    ): ApiResponse<T> {
        return new ApiResponse<T>(
            data,
            {
                statusCode:
                    ACCEPTED_STATUS_CODE,
                message,
                meta,
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | 204 No Content
    |--------------------------------------------------------------------------
    */

    public static noContent(
        meta?: ApiResponseMeta
    ): ApiResponse<null> {
        return new ApiResponse<null>(
            null,
            {
                statusCode:
                    NO_CONTENT_STATUS_CODE,
                message:
                    "Request completed successfully.",
                meta,
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Type Guard
    |--------------------------------------------------------------------------
    */

    public static isApiResponse(
        value: unknown
    ): value is ApiResponse<unknown> {
        return (
            value instanceof
            ApiResponse
        );
    }
}