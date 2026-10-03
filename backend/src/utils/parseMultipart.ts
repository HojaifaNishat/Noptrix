/*
|--------------------------------------------------------------------------
| Multipart Field Parser
|--------------------------------------------------------------------------
|
| Converts multipart/form-data string fields into their intended
| primitive/object values before Zod validation.
|
|--------------------------------------------------------------------------
*/

export class MultipartParseError extends Error {
    public readonly code: string;

    constructor(
        message: string,
        code = "INVALID_MULTIPART_FIELD"
    ) {
        super(message);

        this.name = "MultipartParseError";
        this.code = code;

        Object.setPrototypeOf(
            this,
            MultipartParseError.prototype
        );
    }
}

/*
|--------------------------------------------------------------------------
| Boolean
|--------------------------------------------------------------------------
*/

export const parseMultipartBoolean = (
    value: unknown
): boolean | undefined => {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value !== "string") {
        throw new MultipartParseError(
            "Boolean field must be a valid boolean value."
        );
    }

    const normalized =
        value.trim().toLowerCase();

    if (normalized === "true") {
        return true;
    }

    if (normalized === "false") {
        return false;
    }

    throw new MultipartParseError(
        `Invalid boolean value "${value}".`
    );
};

/*
|--------------------------------------------------------------------------
| Number
|--------------------------------------------------------------------------
*/

export const parseMultipartNumber = (
    value: unknown
): number | undefined => {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value === "number") {
        if (Number.isFinite(value)) {
            return value;
        }

        throw new MultipartParseError(
            "Number field must be finite."
        );
    }

    if (typeof value !== "string") {
        throw new MultipartParseError(
            "Number field must be a valid number."
        );
    }

    const normalized =
        value.trim();

    if (normalized.length === 0) {
        throw new MultipartParseError(
            "Number field cannot be empty."
        );
    }

    const parsed =
        Number(normalized);

    if (!Number.isFinite(parsed)) {
        throw new MultipartParseError(
            `Invalid number value "${value}".`
        );
    }

    return parsed;
};

/*
|--------------------------------------------------------------------------
| JSON Object
|--------------------------------------------------------------------------
*/

export const parseMultipartJsonObject = <
    T extends Record<string, unknown> = Record<
        string,
        unknown
    >
>(
    value: unknown
): T | undefined => {
    if (value === undefined) {
        return undefined;
    }

    if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    ) {
        return value as T;
    }

    if (typeof value !== "string") {
        throw new MultipartParseError(
            "JSON field must contain a valid JSON object."
        );
    }

    const normalized =
        value.trim();

    if (normalized.length === 0) {
        throw new MultipartParseError(
            "JSON field cannot be empty."
        );
    }

    let parsed: unknown;

    try {
        parsed =
            JSON.parse(normalized);
    } catch {
        throw new MultipartParseError(
            "JSON field contains invalid JSON."
        );
    }

    if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
    ) {
        throw new MultipartParseError(
            "JSON field must contain a JSON object."
        );
    }

    return parsed as T;
};

/*
|--------------------------------------------------------------------------
| Category Multipart Body
|--------------------------------------------------------------------------
*/

export const normalizeCategoryMultipartBody = <
    T extends Record<string, unknown>
>(
    body: T
): T => {
    const normalized = {
        ...body,
    } as Record<string, unknown>;

    if (
        "isFeatured" in normalized
    ) {
        normalized.isFeatured =
            parseMultipartBoolean(
                normalized.isFeatured
            );
    }

    if (
        "sortOrder" in normalized
    ) {
        normalized.sortOrder =
            parseMultipartNumber(
                normalized.sortOrder
            );
    }

    if (
        "removeImage" in normalized
    ) {
        normalized.removeImage =
            parseMultipartBoolean(
                normalized.removeImage
            );
    }

    if (
        "seo" in normalized
    ) {
        normalized.seo =
            parseMultipartJsonObject(
                normalized.seo
            );
    }

    return normalized as T;
};
