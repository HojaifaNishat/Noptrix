export interface PaginationInput {
    readonly page?: number | string;
    readonly limit?: number | string;
}

export interface PaginationOptions {
    readonly defaultPage?: number;
    readonly defaultLimit?: number;
    readonly maxLimit?: number;
    readonly maxPage?: number;
}

export interface PaginationMeta {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
    readonly hasNextPage: boolean;
    readonly hasPreviousPage: boolean;
    readonly nextPage: number | null;
    readonly previousPage: number | null;
}

export interface PaginationResult {
    readonly page: number;
    readonly limit: number;
    readonly skip: number;
    readonly meta: (
        total: number
    ) => PaginationMeta;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const DEFAULT_MAX_LIMIT = 100;
const DEFAULT_MAX_PAGE = 1_000_000;

const MIN_VALUE = 1;

const normalizePositiveSafeInteger = (
    value: unknown,
    fallback: number
): number => {
    const parsed =
        typeof value === "number"
            ? value
            : Number(
                  typeof value ===
                      "string"
                      ? value.trim()
                      : value
              );

    if (
        !Number.isSafeInteger(parsed) ||
        parsed < MIN_VALUE
    ) {
        return fallback;
    }

    return parsed;
};

const normalizeNonNegativeSafeInteger = (
    value: unknown,
    fallback: number
): number => {
    const parsed =
        typeof value === "number"
            ? value
            : Number(
                  typeof value ===
                      "string"
                      ? value.trim()
                      : value
              );

    if (
        !Number.isSafeInteger(parsed) ||
        parsed < 0
    ) {
        return fallback;
    }

    return parsed;
};

const normalizeOptions = (
    options: PaginationOptions
) => {
    const maxLimit =
        normalizePositiveSafeInteger(
            options.maxLimit,
            DEFAULT_MAX_LIMIT
        );

    const defaultLimit = Math.min(
        normalizePositiveSafeInteger(
            options.defaultLimit,
            DEFAULT_LIMIT
        ),
        maxLimit
    );

    const maxPage =
        normalizePositiveSafeInteger(
            options.maxPage,
            DEFAULT_MAX_PAGE
        );

    const defaultPage = Math.min(
        normalizePositiveSafeInteger(
            options.defaultPage,
            DEFAULT_PAGE
        ),
        maxPage
    );

    return Object.freeze({
        defaultPage,
        defaultLimit,
        maxLimit,
        maxPage,
    });
};

export const getPagination = (
    input: PaginationInput = {},
    options: PaginationOptions = {}
): PaginationResult => {
    const config =
        normalizeOptions(options);

    const requestedPage =
        normalizePositiveSafeInteger(
            input.page,
            config.defaultPage
        );

    const requestedLimit =
        normalizePositiveSafeInteger(
            input.limit,
            config.defaultLimit
        );

    const page = Math.min(
        requestedPage,
        config.maxPage
    );

    const limit = Math.min(
        requestedLimit,
        config.maxLimit
    );

    const skip =
        (page - 1) * limit;

    const createMeta = (
        total: number
    ): PaginationMeta => {
        const safeTotal =
            normalizeNonNegativeSafeInteger(
                total,
                0
            );

        const totalPages =
            safeTotal === 0
                ? 0
                : Math.ceil(
                      safeTotal / limit
                  );

        return Object.freeze({
            page,
            limit,
            total: safeTotal,
            totalPages,
            hasNextPage:
                totalPages > 0 &&
                page < totalPages,
            hasPreviousPage:
                page > 1 &&
                totalPages > 0,
            nextPage:
                page < totalPages
                    ? page + 1
                    : null,
            previousPage:
                page > 1 &&
                totalPages > 0
                    ? page - 1
                    : null,
        });
    };

    return Object.freeze({
        page,
        limit,
        skip,
        meta: createMeta,
    });
};

export const createPaginationMeta = (
    page: number,
    limit: number,
    total: number,
    options: PaginationOptions = {}
): PaginationMeta => {
    const config =
        normalizeOptions(options);

    const safePage = Math.min(
        normalizePositiveSafeInteger(
            page,
            config.defaultPage
        ),
        config.maxPage
    );

    const safeLimit = Math.min(
        normalizePositiveSafeInteger(
            limit,
            config.defaultLimit
        ),
        config.maxLimit
    );

    const safeTotal =
        normalizeNonNegativeSafeInteger(
            total,
            0
        );

    const totalPages =
        safeTotal === 0
            ? 0
            : Math.ceil(
                  safeTotal /
                      safeLimit
              );

    return Object.freeze({
        page: safePage,
        limit: safeLimit,
        total: safeTotal,
        totalPages,
        hasNextPage:
            totalPages > 0 &&
            safePage < totalPages,
        hasPreviousPage:
            safePage > 1 &&
            totalPages > 0,
        nextPage:
            safePage < totalPages
                ? safePage + 1
                : null,
        previousPage:
            safePage > 1 &&
            totalPages > 0
                ? safePage - 1
                : null,
    });
};

export const getPaginationSkip = (
    page: number,
    limit: number
): number => {
    const safePage =
        normalizePositiveSafeInteger(
            page,
            DEFAULT_PAGE
        );

    const safeLimit =
        normalizePositiveSafeInteger(
            limit,
            DEFAULT_LIMIT
        );

    return (
        safePage - 1
    ) * safeLimit;
};