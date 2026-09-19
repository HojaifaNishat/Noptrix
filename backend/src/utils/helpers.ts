import {
    randomBytes,
    randomInt,
} from "node:crypto";

/*
|--------------------------------------------------------------------------
| Primitive Types
|--------------------------------------------------------------------------
*/

export type Primitive =
    | string
    | number
    | boolean
    | bigint
    | symbol
    | null
    | undefined;

/*
|--------------------------------------------------------------------------
| Generic Object Types
|--------------------------------------------------------------------------
*/

export type PlainObject =
    Record<string, unknown>;

/*
|--------------------------------------------------------------------------
| String Helpers
|--------------------------------------------------------------------------
*/

export const isNonEmptyString = (
    value: unknown
): value is string => {
    return (
        typeof value === "string" &&
        value.trim().length > 0
    );
};

export const normalizeString = (
    value: unknown
): string => {
    if (
        typeof value !== "string"
    ) {
        return "";
    }

    return value.trim();
};

export const normalizeEmail = (
    email: string
): string => {
    return email
        .trim()
        .toLowerCase();
};

export const capitalize = (
    value: string
): string => {
    const normalized =
        normalizeString(value);

    if (!normalized) {
        return "";
    }

    return (
        normalized.charAt(0)
            .toUpperCase() +
        normalized.slice(1)
    );
};

export const toTitleCase = (
    value: string
): string => {
    return normalizeString(value)
        .toLowerCase()
        .replace(
            /\b\p{L}/gu,
            (character) =>
                character.toUpperCase()
        );
};

export const toSlug = (
    value: string
): string => {
    return normalizeString(value)
        .normalize("NFKD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .replace(
            /[^\p{L}\p{N}\s-]/gu,
            ""
        )
        .replace(
            /[\s_-]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            "");
};

export const truncate = (
    value: string,
    maxLength: number,
    suffix = "..."
): string => {
    const normalized =
        normalizeString(value);

    if (
        !Number.isSafeInteger(
            maxLength
        ) ||
        maxLength < 0
    ) {
        throw new RangeError(
            "Maximum length must be a non-negative safe integer."
        );
    }

    if (
        typeof suffix !== "string"
    ) {
        throw new TypeError(
            "Suffix must be a string."
        );
    }

    if (
        normalized.length <=
        maxLength
    ) {
        return normalized;
    }

    if (
        suffix.length >= maxLength
    ) {
        return normalized.slice(
            0,
            maxLength
        );
    }

    return (
        normalized.slice(
            0,
            maxLength - suffix.length
        ) + suffix
    );
};

/*
|--------------------------------------------------------------------------
| Number Helpers
|--------------------------------------------------------------------------
*/

export const isFiniteNumber = (
    value: unknown
): value is number => {
    return (
        typeof value === "number" &&
        Number.isFinite(value)
    );
};

export const isSafeInteger = (
    value: unknown
): value is number => {
    return Number.isSafeInteger(
        value
    );
};

export const clamp = (
    value: number,
    minimum: number,
    maximum: number
): number => {
    if (
        !Number.isFinite(value) ||
        !Number.isFinite(minimum) ||
        !Number.isFinite(maximum)
    ) {
        throw new TypeError(
            "Value and boundaries must be finite numbers."
        );
    }

    if (
        minimum > maximum
    ) {
        throw new RangeError(
            "Minimum cannot be greater than maximum."
        );
    }

    return Math.min(
        Math.max(value, minimum),
        maximum
    );
};

/*
|--------------------------------------------------------------------------
| General Number Rounding
|--------------------------------------------------------------------------
|
| WARNING:
| Do not use this helper for financial calculations.
| Money should use integer minor units or a decimal
| arithmetic strategy in the payment/accounting layer.
|
*/

export const roundTo = (
    value: number,
    decimals = 2
): number => {
    if (
        !Number.isFinite(value)
    ) {
        throw new TypeError(
            "Value must be a finite number."
        );
    }

    if (
        !Number.isInteger(
            decimals
        ) ||
        decimals < 0 ||
        decimals > 20
    ) {
        throw new RangeError(
            "Decimals must be an integer between 0 and 20."
        );
    }

    const multiplier =
        10 ** decimals;

    return (
        Math.round(
            (value + Number.EPSILON) *
                multiplier
        ) / multiplier
    );
};

/*
|--------------------------------------------------------------------------
| Boolean Helpers
|--------------------------------------------------------------------------
*/

export const toBoolean = (
    value: unknown,
    fallback = false
): boolean => {
    if (
        typeof value === "boolean"
    ) {
        return value;
    }

    if (
        typeof value === "number"
    ) {
        if (value === 1) {
            return true;
        }

        if (value === 0) {
            return false;
        }

        return fallback;
    }

    if (
        typeof value !== "string"
    ) {
        return fallback;
    }

    const normalized =
        value.trim().toLowerCase();

    if (
        normalized === "true" ||
        normalized === "1" ||
        normalized === "yes" ||
        normalized === "on"
    ) {
        return true;
    }

    if (
        normalized === "false" ||
        normalized === "0" ||
        normalized === "no" ||
        normalized === "off"
    ) {
        return false;
    }

    return fallback;
};

/*
|--------------------------------------------------------------------------
| Object Helpers
|--------------------------------------------------------------------------
*/

export const isPlainObject = (
    value: unknown
): value is PlainObject => {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        return false;
    }

    const prototype =
        Object.getPrototypeOf(
            value
        );

    return (
        prototype ===
            Object.prototype ||
        prototype === null
    );
};

export const hasOwn = <
    T extends object,
    K extends PropertyKey
>(
    object: T,
    key: K
): key is K & keyof T => {
    return Object.prototype.hasOwnProperty.call(
        object,
        key
    );
};

export const omitKeys = <
    T extends PlainObject,
    K extends keyof T
>(
    object: T,
    keys: readonly K[]
): Omit<T, K> => {
    const result = {
        ...object,
    } as T;

    for (const key of keys) {
        delete result[key];
    }

    return result as Omit<T, K>;
};

export const pickKeys = <
    T extends PlainObject,
    K extends keyof T
>(
    object: T,
    keys: readonly K[]
): Pick<T, K> => {
    const result =
        {} as Pick<T, K>;

    for (const key of keys) {
        if (
            hasOwn(
                object,
                key
            )
        ) {
            result[key] =
                object[key];
        }
    }

    return result;
};

export const cloneObject = <
    T extends PlainObject
>(
    object: T
): T => {
    return {
        ...object,
    };
};

/*
|--------------------------------------------------------------------------
| Array Helpers
|--------------------------------------------------------------------------
*/

export const isArrayNotEmpty = <
    T
>(
    value: unknown
): value is T[] => {
    return (
        Array.isArray(value) &&
        value.length > 0
    );
};

export const unique = <T>(
    values: readonly T[]
): T[] => {
    return [
        ...new Set(values),
    ];
};

export const compact = <T>(
    values: readonly (
        | T
        | null
        | undefined
    )[]
): T[] => {
    return values.filter(
        isDefined
    );
};

/*
|--------------------------------------------------------------------------
| Null / Undefined Helpers
|--------------------------------------------------------------------------
*/

export const isNil = (
    value: unknown
): value is null | undefined => {
    return (
        value === null ||
        value === undefined
    );
};

export const isDefined = <
    T
>(
    value:
        | T
        | null
        | undefined
): value is T => {
    return (
        value !== null &&
        value !== undefined
    );
};

export const coalesce = <
    T
>(
    value:
        | T
        | null
        | undefined,
    fallback: T
): T => {
    return isDefined(value)
        ? value
        : fallback;
};

/*
|--------------------------------------------------------------------------
| Random / Secure Value Helpers
|--------------------------------------------------------------------------
*/

export const generateRandomHex = (
    byteLength = 16
): string => {
    if (
        !Number.isSafeInteger(
            byteLength
        ) ||
        byteLength < 1 ||
        byteLength > 1024
    ) {
        throw new RangeError(
            "Byte length must be a safe integer between 1 and 1024."
        );
    }

    return randomBytes(
        byteLength
    ).toString("hex");
};

export const generateNumericCode = (
    length = 6
): string => {
    if (
        !Number.isSafeInteger(
            length
        ) ||
        length < 1 ||
        length > 9
    ) {
        throw new RangeError(
            "Code length must be a safe integer between 1 and 9."
        );
    }

    const minimum =
        length === 1
            ? 0
            : 10 ** (length - 1);

    const maximum =
        10 ** length;

    return randomInt(
        minimum,
        maximum
    )
        .toString()
        .padStart(
            length,
            "0"
        );
};

/*
|--------------------------------------------------------------------------
| Date Helpers
|--------------------------------------------------------------------------
*/

export const isValidDate = (
    value: unknown
): value is Date => {
    return (
        value instanceof Date &&
        !Number.isNaN(
            value.getTime()
        )
    );
};

export const toValidDate = (
    value: unknown
): Date | null => {
    if (
        value instanceof Date
    ) {
        return isValidDate(value)
            ? new Date(
                  value.getTime()
              )
            : null;
    }

    if (
        typeof value !== "string" &&
        typeof value !== "number"
    ) {
        return null;
    }

    const date =
        new Date(value);

    return isValidDate(date)
        ? date
        : null;
};

export const now = (): Date => {
    return new Date();
};

/*
|--------------------------------------------------------------------------
| Promise / Async Helpers
|--------------------------------------------------------------------------
*/

export const sleep = (
    milliseconds: number
): Promise<void> => {
    if (
        !Number.isFinite(
            milliseconds
        ) ||
        milliseconds < 0
    ) {
        return Promise.reject(
            new RangeError(
                "Sleep duration must be a non-negative finite number."
            )
        );
    }

    return new Promise(
        (resolve) => {
            setTimeout(
                resolve,
                milliseconds
            );
        }
    );
};

/*
|--------------------------------------------------------------------------
| Timeout Helper
|--------------------------------------------------------------------------
|
| Supports AbortSignal when the underlying operation
| understands cancellation.
|
*/

export const withTimeout = async <
    T
>(
    promise: Promise<T>,
    milliseconds: number,
    signal?: AbortSignal
): Promise<T> => {
    if (
        !Number.isFinite(
            milliseconds
        ) ||
        milliseconds <= 0
    ) {
        throw new RangeError(
            "Timeout must be a positive finite number."
        );
    }

    if (
        signal?.aborted
    ) {
        throw new Error(
            "Operation was aborted."
        );
    }

    let timeout:
        | NodeJS.Timeout
        | undefined;

    try {
        return await Promise.race([
            promise,

            new Promise<T>(
                (_, reject) => {
                    timeout =
                        setTimeout(
                            () => {
                                reject(
                                    new Error(
                                        "Operation timed out."
                                    )
                                );
                            },
                            milliseconds
                        );
                }
            ),

            ...(signal
                ? [
                      new Promise<T>(
                          (
                              _,
                              reject
                          ) => {
                              const onAbort =
                                  () => {
                                      reject(
                                          new Error(
                                              "Operation was aborted."
                                          )
                                      );
                                  };

                              signal.addEventListener(
                                  "abort",
                                  onAbort,
                                  {
                                      once: true,
                                  }
                              );
                          }
                      ),
                  ]
                : []),
        ]);
    } finally {
        if (timeout) {
            clearTimeout(
                timeout
            );
        }
    }
};

/*
|--------------------------------------------------------------------------
| Error Helpers
|--------------------------------------------------------------------------
*/

export const getErrorMessage = (
    error: unknown
): string => {
    if (
        error instanceof Error
    ) {
        return error.message;
    }

    if (
        typeof error === "string"
    ) {
        return error;
    }

    return "An unknown error occurred.";
};

/*
|--------------------------------------------------------------------------
| JSON Helpers
|--------------------------------------------------------------------------
*/

export const safeJsonParse = <
    T = unknown
>(
    value: string
): T | null => {
    if (
        typeof value !== "string"
    ) {
        return null;
    }

    try {
        return JSON.parse(
            value
        ) as T;
    } catch {
        return null;
    }
};

export const safeJsonStringify = (
    value: unknown
): string | null => {
    try {
        return JSON.stringify(
            value
        );
    } catch {
        return null;
    }
};