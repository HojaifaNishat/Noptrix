import crypto from "crypto";

import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";

/*
|--------------------------------------------------------------------------
| Search Constants
|--------------------------------------------------------------------------
*/

export const SEARCH_SORT_FIELDS = {
    RELEVANCE: "relevance",
    CREATED_AT: "createdAt",
    UPDATED_AT: "updatedAt",
    PRICE: "price",
    NAME: "name",
} as const;

export type SearchSortField =
    (typeof SEARCH_SORT_FIELDS)[keyof typeof SEARCH_SORT_FIELDS];

export const SEARCH_SORT_DIRECTIONS = {
    ASC: "asc",
    DESC: "desc",
} as const;

export type SearchSortDirection =
    (typeof SEARCH_SORT_DIRECTIONS)[keyof typeof SEARCH_SORT_DIRECTIONS];

export const SEARCH_STATUSES = {
    SUCCESS: "success",
    EMPTY: "empty",
    FAILED: "failed",
} as const;

export type SearchStatus =
    (typeof SEARCH_STATUSES)[keyof typeof SEARCH_STATUSES];

/*
|--------------------------------------------------------------------------
| Search Filter
|--------------------------------------------------------------------------
*/

export interface SearchFilter {
    readonly field: string;
    readonly operator:
        | "eq"
        | "neq"
        | "gt"
        | "gte"
        | "lt"
        | "lte"
        | "in"
        | "nin"
        | "contains"
        | "startsWith"
        | "endsWith";
    readonly value: unknown;
}

/*
|--------------------------------------------------------------------------
| Search Sort
|--------------------------------------------------------------------------
*/

export interface SearchSort {
    readonly field: SearchSortField;
    readonly direction: SearchSortDirection;
}

/*
|--------------------------------------------------------------------------
| Search Pagination
|--------------------------------------------------------------------------
*/

export interface SearchPagination {
    readonly page: number;
    readonly limit: number;
    readonly skip: number;
}

/*
|--------------------------------------------------------------------------
| Search Request
|--------------------------------------------------------------------------
*/

export interface SearchRequest {
    readonly query?: string;

    readonly index: string;

    readonly filters?: readonly SearchFilter[];

    readonly sort?: readonly SearchSort[];

    readonly page?: number;
    readonly limit?: number;

    readonly fields?: readonly string[];

    readonly includeInactive?: boolean;

    readonly metadata?: Readonly<Record<string, unknown>>;
}

/*
|--------------------------------------------------------------------------
| Search Result Item
|--------------------------------------------------------------------------
*/

export interface SearchResultItem<T = unknown> {
    readonly id: string;

    readonly document: T;

    readonly score?: number;

    readonly highlights?: Readonly<
        Record<string, readonly string[]>
    >;
}

/*
|--------------------------------------------------------------------------
| Search Result
|--------------------------------------------------------------------------
*/

export interface SearchResult<T = unknown> {
    readonly status: SearchStatus;

    readonly query: string;

    readonly index: string;

    readonly items: readonly SearchResultItem<T>[];

    readonly total: number;

    readonly pagination: SearchPagination;

    readonly tookMs: number;

    readonly provider?: string;

    readonly requestId: string;

    readonly metadata?: Readonly<Record<string, unknown>>;
}

/*
|--------------------------------------------------------------------------
| Search Provider Context
|--------------------------------------------------------------------------
*/

export interface SearchProviderContext {
    readonly requestId: string;
    readonly request: SearchRequest;
}

/*
|--------------------------------------------------------------------------
| Search Provider Adapter
|--------------------------------------------------------------------------
|
| Future providers:
|
| MongoDB
| Elasticsearch
| Meilisearch
| Typesense
|
| can implement this interface.
|--------------------------------------------------------------------------
*/

export interface SearchProviderAdapter {
    readonly name: string;

    readonly priority?: number;

    search<T = unknown>(
        context: SearchProviderContext
    ): Promise<SearchResult<T>>;

    healthCheck?(): Promise<SearchProviderHealth>;
}

/*
|--------------------------------------------------------------------------
| Search Provider Health
|--------------------------------------------------------------------------
*/

export interface SearchProviderHealth {
    readonly provider: string;

    readonly healthy: boolean;

    readonly latencyMs?: number;

    readonly message?: string;

    readonly timestamp: Date;
}

/*
|--------------------------------------------------------------------------
| Search Service Health
|--------------------------------------------------------------------------
*/

export interface SearchServiceHealth {
    readonly service: "search";

    readonly healthy: boolean;

    readonly activeProvider?: string;

    readonly registeredProviders: readonly string[];

    readonly timestamp: Date;
}

/*
|--------------------------------------------------------------------------
| Search Configuration
|--------------------------------------------------------------------------
*/

export interface SearchServiceConfig {
    readonly defaultPage: number;
    readonly defaultLimit: number;
    readonly maxLimit: number;
    readonly maxQueryLength: number;
    readonly maxFilters: number;
    readonly maxSortFields: number;
}

/*
|--------------------------------------------------------------------------
| Default Configuration
|--------------------------------------------------------------------------
*/

const DEFAULT_CONFIG: SearchServiceConfig = {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
    maxQueryLength: 200,
    maxFilters: 20,
    maxSortFields: 5,
};

let searchConfig: SearchServiceConfig = {
    ...DEFAULT_CONFIG,
};

/*
|--------------------------------------------------------------------------
| Provider Registry
|--------------------------------------------------------------------------
*/

const providerRegistry = new Map<
    string,
    SearchProviderAdapter
>();

let activeProviderName: string | undefined;

/*
|--------------------------------------------------------------------------
| Query Normalization
|--------------------------------------------------------------------------
*/

const normalizeQuery = (
    query?: string
): string => {
    if (query === undefined) {
        return "";
    }

    if (typeof query !== "string") {
        throw ApiError.badRequest(
            "Search query must be a string.",
            {
                code: "INVALID_SEARCH_QUERY",
            }
        );
    }

    const normalized = query
        .trim()
        .replace(/\s+/g, " ");

    if (
        normalized.length >
        searchConfig.maxQueryLength
    ) {
        throw ApiError.badRequest(
            `Search query cannot exceed ${searchConfig.maxQueryLength} characters.`,
            {
                code: "SEARCH_QUERY_TOO_LONG",
            }
        );
    }

    return normalized;
};

/*
|--------------------------------------------------------------------------
| Index Validation
|--------------------------------------------------------------------------
*/

const normalizeIndex = (
    index: string
): string => {
    if (
        typeof index !== "string" ||
        index.trim().length === 0
    ) {
        throw ApiError.badRequest(
            "Search index is required.",
            {
                code: "INVALID_SEARCH_INDEX",
            }
        );
    }

    const normalized = index.trim();

    /*
    |--------------------------------------------------------------------------
    | Security
    |--------------------------------------------------------------------------
    |
    | Index names are controlled identifiers, not arbitrary Mongo/SQL paths.
    |--------------------------------------------------------------------------
    */

    if (
        !/^[a-zA-Z0-9_-]+$/.test(normalized)
    ) {
        throw ApiError.badRequest(
            "Search index contains invalid characters.",
            {
                code: "INVALID_SEARCH_INDEX",
            }
        );
    }

    return normalized;
};

/*
|--------------------------------------------------------------------------
| Pagination Normalization
|--------------------------------------------------------------------------
*/

const normalizePagination = (
    page?: number,
    limit?: number
): SearchPagination => {
    const normalizedPage =
        page ?? searchConfig.defaultPage;

    const normalizedLimit =
        limit ?? searchConfig.defaultLimit;

    if (
        !Number.isInteger(normalizedPage) ||
        normalizedPage < 1
    ) {
        throw ApiError.badRequest(
            "Search page must be a positive integer.",
            {
                code: "INVALID_SEARCH_PAGE",
            }
        );
    }

    if (
        !Number.isInteger(normalizedLimit) ||
        normalizedLimit < 1 ||
        normalizedLimit >
            searchConfig.maxLimit
    ) {
        throw ApiError.badRequest(
            `Search limit must be between 1 and ${searchConfig.maxLimit}.`,
            {
                code: "INVALID_SEARCH_LIMIT",
            }
        );
    }

    return {
        page: normalizedPage,
        limit: normalizedLimit,
        skip:
            (normalizedPage - 1) *
            normalizedLimit,
    };
};

/*
|--------------------------------------------------------------------------
| Filter Validation
|--------------------------------------------------------------------------
*/

const VALID_FILTER_OPERATORS = [
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "in",
    "nin",
    "contains",
    "startsWith",
    "endsWith",
] as const;

const normalizeFilters = (
    filters?: readonly SearchFilter[]
): readonly SearchFilter[] => {
    if (!filters) {
        return [];
    }

    if (
        !Array.isArray(filters)
    ) {
        throw ApiError.badRequest(
            "Search filters must be an array.",
            {
                code: "INVALID_SEARCH_FILTERS",
            }
        );
    }

    if (
        filters.length >
        searchConfig.maxFilters
    ) {
        throw ApiError.badRequest(
            `A maximum of ${searchConfig.maxFilters} search filters is allowed.`,
            {
                code: "TOO_MANY_SEARCH_FILTERS",
            }
        );
    }

    return filters.map(
        (filter, index) => {
            if (
                !filter ||
                typeof filter !== "object"
            ) {
                throw ApiError.badRequest(
                    `Search filter at index ${index} is invalid.`,
                    {
                        code: "INVALID_SEARCH_FILTER",
                    }
                );
            }

            if (
                typeof filter.field !==
                    "string" ||
                filter.field.trim().length === 0
            ) {
                throw ApiError.badRequest(
                    `Search filter field at index ${index} is required.`,
                    {
                        code: "INVALID_SEARCH_FILTER_FIELD",
                    }
                );
            }

            if (
                !VALID_FILTER_OPERATORS.includes(
                    filter.operator
                )
            ) {
                throw ApiError.badRequest(
                    `Search filter operator at index ${index} is invalid.`,
                    {
                        code: "INVALID_SEARCH_FILTER_OPERATOR",
                    }
                );
            }

            return {
                ...filter,
                field: filter.field.trim(),
            };
        }
    );
};

/*
|--------------------------------------------------------------------------
| Sort Validation
|--------------------------------------------------------------------------
*/

const normalizeSort = (
    sort?: readonly SearchSort[]
): readonly SearchSort[] => {
    if (!sort) {
        return [];
    }

    if (
        !Array.isArray(sort)
    ) {
        throw ApiError.badRequest(
            "Search sort must be an array.",
            {
                code: "INVALID_SEARCH_SORT",
            }
        );
    }

    if (
        sort.length >
        searchConfig.maxSortFields
    ) {
        throw ApiError.badRequest(
            `A maximum of ${searchConfig.maxSortFields} sort fields is allowed.`,
            {
                code: "TOO_MANY_SEARCH_SORT_FIELDS",
            }
        );
    }

    return sort.map(
        (item, index) => {
            if (
                !item ||
                typeof item !== "object"
            ) {
                throw ApiError.badRequest(
                    `Search sort at index ${index} is invalid.`,
                    {
                        code: "INVALID_SEARCH_SORT",
                    }
                );
            }

            if (
                !Object.values(
                    SEARCH_SORT_FIELDS
                ).includes(
                    item.field
                )
            ) {
                throw ApiError.badRequest(
                    `Search sort field at index ${index} is invalid.`,
                    {
                        code: "INVALID_SEARCH_SORT_FIELD",
                    }
                );
            }

            if (
                !Object.values(
                    SEARCH_SORT_DIRECTIONS
                ).includes(
                    item.direction
                )
            ) {
                throw ApiError.badRequest(
                    `Search sort direction at index ${index} is invalid.`,
                    {
                        code: "INVALID_SEARCH_SORT_DIRECTION",
                    }
                );
            }

            return item;
        }
    );
};

/*
|--------------------------------------------------------------------------
| Search Request Normalization
|--------------------------------------------------------------------------
*/

export const normalizeSearchRequest = (
    request: SearchRequest
): SearchRequest & {
    readonly query: string;
    readonly index: string;
    readonly filters: readonly SearchFilter[];
    readonly sort: readonly SearchSort[];
    readonly page: number;
    readonly limit: number;
} => {
    if (
        !request ||
        typeof request !== "object"
    ) {
        throw ApiError.badRequest(
            "Search request is required.",
            {
                code: "INVALID_SEARCH_REQUEST",
            }
        );
    }

    const query =
        normalizeQuery(request.query);

    const index =
        normalizeIndex(request.index);

    const pagination =
        normalizePagination(
            request.page,
            request.limit
        );

    const filters =
        normalizeFilters(
            request.filters
        );

    const sort =
        normalizeSort(request.sort);

    return {
        ...request,

        query,
        index,

        filters,
        sort,

        page: pagination.page,
        limit: pagination.limit,
    };
};

/*
|--------------------------------------------------------------------------
| Provider Registration
|--------------------------------------------------------------------------
*/

export const registerSearchProvider = (
    provider: SearchProviderAdapter
): void => {
    if (
        !provider ||
        typeof provider !== "object"
    ) {
        throw ApiError.badRequest(
            "Search provider is required.",
            {
                code: "INVALID_SEARCH_PROVIDER",
            }
        );
    }

    if (
        typeof provider.name !==
            "string" ||
        provider.name.trim().length === 0
    ) {
        throw ApiError.badRequest(
            "Search provider name is required.",
            {
                code: "INVALID_SEARCH_PROVIDER_NAME",
            }
        );
    }

    if (
        typeof provider.search !==
        "function"
    ) {
        throw ApiError.badRequest(
            "Search provider must implement search().",
            {
                code: "INVALID_SEARCH_PROVIDER",
            }
        );
    }

    const name =
        provider.name.trim();

    providerRegistry.set(
        name,
        provider
    );

    /*
    |--------------------------------------------------------------------------
    | Automatically select the first registered provider.
    |--------------------------------------------------------------------------
    */

    if (!activeProviderName) {
        activeProviderName = name;
    }

    logger.info(
        `Search provider registered: ${name}`
    );
};

/*
|--------------------------------------------------------------------------
| Provider Removal
|--------------------------------------------------------------------------
*/

export const unregisterSearchProvider = (
    providerName: string
): boolean => {
    const removed =
        providerRegistry.delete(
            providerName
        );

    if (
        activeProviderName ===
        providerName
    ) {
        activeProviderName =
            undefined;

        const nextProvider =
            [...providerRegistry.keys()][0];

        if (nextProvider) {
            activeProviderName =
                nextProvider;
        }
    }

    return removed;
};

/*
|--------------------------------------------------------------------------
| Active Provider
|--------------------------------------------------------------------------
*/

export const setActiveSearchProvider = (
    providerName: string
): void => {
    const normalizedName =
        providerName.trim();

    if (!normalizedName) {
        throw ApiError.badRequest(
            "Search provider name is required.",
            {
                code: "INVALID_SEARCH_PROVIDER_NAME",
            }
        );
    }

    if (
        !providerRegistry.has(
            normalizedName
        )
    ) {
        throw ApiError.notFound(
            `Search provider "${normalizedName}" is not registered.`,
            {
                code: "SEARCH_PROVIDER_NOT_FOUND",
            }
        );
    }

    activeProviderName =
        normalizedName;

    logger.info(
        `Active search provider changed to: ${normalizedName}`
    );
};

/*
|--------------------------------------------------------------------------
| Get Active Provider
|--------------------------------------------------------------------------
*/

export const getActiveSearchProvider =
    (): SearchProviderAdapter => {
        if (!activeProviderName) {
            throw ApiError.internal(
                "No search provider is currently configured.",
                {
                    code: "SEARCH_PROVIDER_NOT_CONFIGURED",
                }
            );
        }

        const provider =
            providerRegistry.get(
                activeProviderName
            );

        if (!provider) {
            throw ApiError.internal(
                "The active search provider is unavailable.",
                {
                    code: "SEARCH_PROVIDER_UNAVAILABLE",
                }
            );
        }

        return provider;
    };

/*
|--------------------------------------------------------------------------
| Search
|--------------------------------------------------------------------------
*/

export const search = async <T = unknown>(
    request: SearchRequest
): Promise<SearchResult<T>> => {
    const normalizedRequest =
        normalizeSearchRequest(
            request
        );

    const provider =
        getActiveSearchProvider();

    const requestId =
        `search_${crypto.randomUUID()}`;

    const startedAt =
        Date.now();

    try {
        const result =
            await provider.search<T>({
                requestId,
                request: normalizedRequest,
            });

        const tookMs =
            Date.now() - startedAt;

        return {
            ...result,

            query:
                normalizedRequest.query,

            index:
                normalizedRequest.index,

            pagination: {
                page:
                    normalizedRequest.page,
                limit:
                    normalizedRequest.limit,
                skip:
                    (
                        normalizedRequest.page -
                        1
                    ) *
                    normalizedRequest.limit,
            },

            tookMs,

            provider:
                provider.name,

            requestId,

            status:
                result.items.length > 0
                    ? SEARCH_STATUSES.SUCCESS
                    : SEARCH_STATUSES.EMPTY,
        };
    } catch (error) {
        const tookMs =
            Date.now() - startedAt;

        logger.error(
            `Search failed. provider=${provider.name} index=${normalizedRequest.index} requestId=${requestId} tookMs=${tookMs}`
        );

        if (ApiError.isApiError(error)) {
            throw error;
        }

        throw ApiError.internal(
            "Search operation failed.",
            {
                code: "SEARCH_OPERATION_FAILED",
                cause: error,
                details: {
                    requestId,
                    provider:
                        provider.name,
                    index:
                        normalizedRequest.index,
                },
            }
        );
    }
};

/*
|--------------------------------------------------------------------------
| Search Configuration
|--------------------------------------------------------------------------
*/

export const configureSearchService = (
    config: Partial<SearchServiceConfig>
): SearchServiceConfig => {
    if (!config || typeof config !== "object") {
        throw ApiError.badRequest(
            "Search service configuration is required.",
            {
                code: "INVALID_SEARCH_CONFIG",
            }
        );
    }

    const nextConfig: SearchServiceConfig = {
        ...searchConfig,
        ...config,
    };

    if (
        !Number.isInteger(nextConfig.defaultPage) ||
        nextConfig.defaultPage < 1
    ) {
        throw ApiError.badRequest(
            "Default search page must be a positive integer.",
            {
                code: "INVALID_SEARCH_DEFAULT_PAGE",
            }
        );
    }

    if (
        !Number.isInteger(nextConfig.defaultLimit) ||
        nextConfig.defaultLimit < 1
    ) {
        throw ApiError.badRequest(
            "Default search limit must be a positive integer.",
            {
                code: "INVALID_SEARCH_DEFAULT_LIMIT",
            }
        );
    }

    if (
        !Number.isInteger(nextConfig.maxLimit) ||
        nextConfig.maxLimit < nextConfig.defaultLimit
    ) {
        throw ApiError.badRequest(
            "Maximum search limit must be greater than or equal to the default limit.",
            {
                code: "INVALID_SEARCH_MAX_LIMIT",
            }
        );
    }

    if (
        !Number.isInteger(nextConfig.maxQueryLength) ||
        nextConfig.maxQueryLength < 1
    ) {
        throw ApiError.badRequest(
            "Maximum search query length must be a positive integer.",
            {
                code: "INVALID_SEARCH_MAX_QUERY_LENGTH",
            }
        );
    }

    if (
        !Number.isInteger(nextConfig.maxFilters) ||
        nextConfig.maxFilters < 0
    ) {
        throw ApiError.badRequest(
            "Maximum search filters must be a non-negative integer.",
            {
                code: "INVALID_SEARCH_MAX_FILTERS",
            }
        );
    }

    if (
        !Number.isInteger(nextConfig.maxSortFields) ||
        nextConfig.maxSortFields < 0
    ) {
        throw ApiError.badRequest(
            "Maximum search sort fields must be a non-negative integer.",
            {
                code: "INVALID_SEARCH_MAX_SORT_FIELDS",
            }
        );
    }

    searchConfig = nextConfig;

    return {
        ...searchConfig,
    };
};

/*
|--------------------------------------------------------------------------
| Get Search Configuration
|--------------------------------------------------------------------------
*/

export const getSearchConfig =
    (): SearchServiceConfig => {
        return {
            ...searchConfig,
        };
    };

/*
|--------------------------------------------------------------------------
| Registered Providers
|--------------------------------------------------------------------------
*/

export const getRegisteredSearchProviders =
    (): readonly string[] => {
        return [
            ...providerRegistry.keys(),
        ];
    };

/*
|--------------------------------------------------------------------------
| Provider Health Check
|--------------------------------------------------------------------------
*/

export const checkSearchProviderHealth =
    async (
        providerName?: string
    ): Promise<SearchProviderHealth> => {
        const name =
            providerName?.trim() ||
            activeProviderName;

        if (!name) {
            return {
                provider: "none",
                healthy: false,
                message:
                    "No active search provider is configured.",
                timestamp: new Date(),
            };
        }

        const provider =
            providerRegistry.get(name);

        if (!provider) {
            return {
                provider: name,
                healthy: false,
                message:
                    "Search provider is not registered.",
                timestamp: new Date(),
            };
        }

        if (!provider.healthCheck) {
            return {
                provider: name,
                healthy: true,
                message:
                    "Provider is registered but does not expose a health check.",
                timestamp: new Date(),
            };
        }

        const startedAt =
            Date.now();

        try {
            const health =
                await provider.healthCheck();

            return {
                ...health,
                provider: name,
                latencyMs:
                    health.latencyMs ??
                    Date.now() - startedAt,
                timestamp:
                    health.timestamp ??
                    new Date(),
            };
        } catch (error) {
            return {
                provider: name,
                healthy: false,
                latencyMs:
                    Date.now() - startedAt,
                message:
                    error instanceof Error
                        ? error.message
                        : "Search provider health check failed.",
                timestamp: new Date(),
            };
        }
    };

/*
|--------------------------------------------------------------------------
| Search Service Health
|--------------------------------------------------------------------------
*/

export const checkSearchService =
    async (): Promise<SearchServiceHealth> => {
        const registeredProviders =
            getRegisteredSearchProviders();

        if (!activeProviderName) {
            return {
                service: "search",
                healthy: false,
                registeredProviders,
                timestamp: new Date(),
            };
        }

        const providerHealth =
            await checkSearchProviderHealth(
                activeProviderName
            );

        return {
            service: "search",

            healthy:
                providerHealth.healthy,

            activeProvider:
                activeProviderName,

            registeredProviders,

            timestamp: new Date(),
        };
    };

/*
|--------------------------------------------------------------------------
| Service Initialization
|--------------------------------------------------------------------------
*/

export const initializeSearchService =
    async (): Promise<SearchServiceHealth> => {
        const health =
            await checkSearchService();

        logger.info(
            `Search service initialized. Active provider: ${
                health.activeProvider ??
                "none"
            }`
        );

        return health;
    };