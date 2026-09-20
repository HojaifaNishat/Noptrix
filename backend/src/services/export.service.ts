import crypto from "crypto";

import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";

/*
|--------------------------------------------------------------------------
| Export Formats
|--------------------------------------------------------------------------
*/

export const EXPORT_FORMATS = {
    CSV: "csv",
    JSON: "json",
    XLSX: "xlsx",
} as const;

export type ExportFormat =
    (typeof EXPORT_FORMATS)[keyof typeof EXPORT_FORMATS];

/*
|--------------------------------------------------------------------------
| Export Status
|--------------------------------------------------------------------------
*/

export const EXPORT_STATUSES = {
    GENERATED: "generated",
    FAILED: "failed",
} as const;

export type ExportStatus =
    (typeof EXPORT_STATUSES)[keyof typeof EXPORT_STATUSES];

/*
|--------------------------------------------------------------------------
| Export MIME Types
|--------------------------------------------------------------------------
*/

export const EXPORT_MIME_TYPES: Record<
    ExportFormat,
    string
> = {
    [EXPORT_FORMATS.CSV]:
        "text/csv; charset=utf-8",

    [EXPORT_FORMATS.JSON]:
        "application/json; charset=utf-8",

    [EXPORT_FORMATS.XLSX]:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

/*
|--------------------------------------------------------------------------
| Export Column
|--------------------------------------------------------------------------
*/

export interface ExportColumn<T = unknown> {
    readonly key: string;

    readonly header: string;

    readonly accessor?: (
        row: T
    ) => unknown;

    readonly formatter?: (
        value: unknown,
        row: T
    ) => string;
}

/*
|--------------------------------------------------------------------------
| Export Input
|--------------------------------------------------------------------------
*/

export interface ExportInput<T = unknown> {
    readonly data: readonly T[];

    readonly format: ExportFormat;

    readonly columns?: readonly ExportColumn<T>[];

    readonly fileName?: string;

    readonly sheetName?: string;

    readonly title?: string;

    readonly metadata?: Readonly<
        Record<string, unknown>
    >;
}

/*
|--------------------------------------------------------------------------
| Export Document
|--------------------------------------------------------------------------
*/

export interface ExportDocument {
    readonly id: string;

    readonly format: ExportFormat;

    readonly fileName: string;

    readonly mimeType: string;

    readonly data: Buffer;

    readonly size: number;

    readonly status: ExportStatus;

    readonly rowCount: number;

    readonly columnCount: number;

    readonly checksum: string;

    readonly provider?: string;

    readonly metadata?: Readonly<
        Record<string, unknown>
    >;

    readonly generatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| Export Provider Context
|--------------------------------------------------------------------------
*/

export interface ExportProviderContext<T = unknown> {
    readonly exportId: string;

    readonly data: readonly T[];

    readonly format: ExportFormat;

    readonly columns?: readonly ExportColumn<T>[];

    readonly sheetName?: string;

    readonly title?: string;

    readonly metadata?: Readonly<
        Record<string, unknown>
    >;
}

/*
|--------------------------------------------------------------------------
| Export Provider Adapter
|--------------------------------------------------------------------------
|
| Future providers/engines can implement this:
|
| CSV generator
| JSON generator
| ExcelJS
| SheetJS
| Streaming exporter
| External export service
|
|--------------------------------------------------------------------------
*/

export interface ExportProviderAdapter {
    readonly name: string;

    readonly formats: readonly ExportFormat[];

    export<T = unknown>(
        context: ExportProviderContext<T>
    ): Promise<Buffer>;
}

/*
|--------------------------------------------------------------------------
| Export Service Configuration
|--------------------------------------------------------------------------
*/

export interface ExportServiceConfig {
    readonly defaultFilePrefix: string;

    readonly maxFileNameLength: number;

    readonly maxRows: number;

    readonly maxColumns: number;

    readonly maxExportSizeBytes: number;
}

/*
|--------------------------------------------------------------------------
| Default Configuration
|--------------------------------------------------------------------------
*/

const DEFAULT_CONFIG: ExportServiceConfig = {
    defaultFilePrefix: "noptrix-export",

    maxFileNameLength: 180,

    maxRows: 100_000,

    maxColumns: 100,

    maxExportSizeBytes:
        50 * 1024 * 1024,
};

let exportConfig: ExportServiceConfig = {
    ...DEFAULT_CONFIG,
};

/*
|--------------------------------------------------------------------------
| Provider Registry
|--------------------------------------------------------------------------
*/

const providerRegistry = new Map<
    string,
    ExportProviderAdapter
>();

let activeProviderName: string | undefined;

/*
|--------------------------------------------------------------------------
| Validation Helpers
|--------------------------------------------------------------------------
*/

const isNonEmptyString = (
    value: unknown
): value is string => {
    return (
        typeof value === "string" &&
        value.trim().length > 0
    );
};

const assertExportFormat = (
    value: unknown
): ExportFormat => {
    if (
        typeof value !== "string" ||
        !Object.values(
            EXPORT_FORMATS
        ).includes(
            value as ExportFormat
        )
    ) {
        throw ApiError.badRequest(
            `Unsupported export format: ${String(value)}.`,
            {
                code: "INVALID_EXPORT_FORMAT",
            }
        );
    }

    return value as ExportFormat;
};

/*
|--------------------------------------------------------------------------
| File Name Normalization
|--------------------------------------------------------------------------
*/

const normalizeFileName = (
    fileName?: string,
    format?: ExportFormat
): string => {
    if (
        fileName !== undefined &&
        !isNonEmptyString(fileName)
    ) {
        throw ApiError.badRequest(
            "Export file name must be a non-empty string.",
            {
                code: "INVALID_EXPORT_FILE_NAME",
            }
        );
    }

    const extension =
        format
            ? `.${format}`
            : "";

    let normalized =
        fileName?.trim() ||
        `${exportConfig.defaultFilePrefix}-${Date.now()}${extension}`;

    /*
    |--------------------------------------------------------------------------
    | File-system safety
    |--------------------------------------------------------------------------
    */

    normalized = normalized
        .replace(/[\/\\:*?"<>|]/g, "-")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    if (
        format &&
        !normalized
            .toLowerCase()
            .endsWith(extension)
    ) {
        normalized += extension;
    }

    if (
        normalized.length >
        exportConfig.maxFileNameLength
    ) {
        const currentExtension =
            format
                ? extension
                : "";

        normalized =
            normalized.slice(
                0,
                exportConfig.maxFileNameLength -
                    currentExtension.length
            ) +
            currentExtension;
    }

    return normalized;
};

/*
|--------------------------------------------------------------------------
| Export ID
|--------------------------------------------------------------------------
*/

const generateExportId = (): string => {
    return `export_${crypto.randomUUID()}`;
};

/*
|--------------------------------------------------------------------------
| Checksum
|--------------------------------------------------------------------------
*/

const calculateExportChecksum = (
    data: Buffer
): string => {
    return crypto
        .createHash("sha256")
        .update(data)
        .digest("hex");
};

/*
|--------------------------------------------------------------------------
| Column Validation
|--------------------------------------------------------------------------
*/

const validateColumns = <T>(
    columns?: readonly ExportColumn<T>[]
): void => {
    if (!columns) {
        return;
    }

    if (
        !Array.isArray(columns)
    ) {
        throw ApiError.badRequest(
            "Export columns must be an array.",
            {
                code: "INVALID_EXPORT_COLUMNS",
            }
        );
    }

    if (
        columns.length >
        exportConfig.maxColumns
    ) {
        throw ApiError.badRequest(
            `Export cannot contain more than ${exportConfig.maxColumns} columns.`,
            {
                code: "TOO_MANY_EXPORT_COLUMNS",
            }
        );
    }

    const keys = new Set<string>();

    for (
        let index = 0;
        index < columns.length;
        index += 1
    ) {
        const column =
            columns[index];

        if (
            !column ||
            typeof column !== "object"
        ) {
            throw ApiError.badRequest(
                `Export column at index ${index} is invalid.`,
                {
                    code: "INVALID_EXPORT_COLUMN",
                }
            );
        }

        if (
            !isNonEmptyString(
                column.key
            )
        ) {
            throw ApiError.badRequest(
                `Export column key at index ${index} is required.`,
                {
                    code: "INVALID_EXPORT_COLUMN_KEY",
                }
            );
        }

        if (
            !isNonEmptyString(
                column.header
            )
        ) {
            throw ApiError.badRequest(
                `Export column header at index ${index} is required.`,
                {
                    code: "INVALID_EXPORT_COLUMN_HEADER",
                }
            );
        }

        const key =
            column.key.trim();

        if (keys.has(key)) {
            throw ApiError.conflict(
                `Duplicate export column key: ${key}.`,
                {
                    code: "DUPLICATE_EXPORT_COLUMN",
                }
            );
        }

        keys.add(key);
    }
};

/*
|--------------------------------------------------------------------------
| Input Validation
|--------------------------------------------------------------------------
*/

export const validateExportInput = <T>(
    input: ExportInput<T>
): void => {
    if (
        !input ||
        typeof input !== "object"
    ) {
        throw ApiError.badRequest(
            "Export input is required.",
            {
                code: "INVALID_EXPORT_INPUT",
            }
        );
    }

    assertExportFormat(
        input.format
    );

    if (
        !Array.isArray(input.data)
    ) {
        throw ApiError.badRequest(
            "Export data must be an array.",
            {
                code: "INVALID_EXPORT_DATA",
            }
        );
    }

    if (
        input.data.length >
        exportConfig.maxRows
    ) {
        throw ApiError.badRequest(
            `Export cannot contain more than ${exportConfig.maxRows} rows.`,
            {
                code: "TOO_MANY_EXPORT_ROWS",
            }
        );
    }

    validateColumns(
        input.columns
    );
};

/*
|--------------------------------------------------------------------------
| Provider Registration
|--------------------------------------------------------------------------
*/

export const registerExportProvider = (
    provider: ExportProviderAdapter
): void => {
    if (
        !provider ||
        typeof provider !== "object"
    ) {
        throw ApiError.badRequest(
            "Export provider is required.",
            {
                code: "INVALID_EXPORT_PROVIDER",
            }
        );
    }

    if (
        !isNonEmptyString(
            provider.name
        )
    ) {
        throw ApiError.badRequest(
            "Export provider name is required.",
            {
                code: "INVALID_EXPORT_PROVIDER_NAME",
            }
        );
    }

    if (
        !Array.isArray(
            provider.formats
        ) ||
        provider.formats.length === 0
    ) {
        throw ApiError.badRequest(
            "Export provider must support at least one format.",
            {
                code: "INVALID_EXPORT_PROVIDER_FORMATS",
            }
        );
    }

    for (
        const format of provider.formats
    ) {
        assertExportFormat(format);
    }

    if (
        typeof provider.export !==
        "function"
    ) {
        throw ApiError.badRequest(
            "Export provider must implement export().",
            {
                code: "INVALID_EXPORT_PROVIDER",
            }
        );
    }

    const name =
        provider.name.trim();

    providerRegistry.set(
        name,
        provider
    );

    if (!activeProviderName) {
        activeProviderName =
            name;
    }

    logger.info(
        `Export provider registered: ${name}`
    );
};

/*
|--------------------------------------------------------------------------
| Provider Removal
|--------------------------------------------------------------------------
*/

export const unregisterExportProvider = (
    providerName: string
): boolean => {
    const normalizedName =
        providerName.trim();

    const removed =
        providerRegistry.delete(
            normalizedName
        );

    if (
        activeProviderName ===
        normalizedName
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
| Set Active Export Provider
|--------------------------------------------------------------------------
*/

export const setActiveExportProvider = (
    providerName: string
): void => {
    const normalizedName =
        providerName.trim();

    if (!normalizedName) {
        throw ApiError.badRequest(
            "Export provider name is required.",
            {
                code: "INVALID_EXPORT_PROVIDER_NAME",
            }
        );
    }

    if (
        !providerRegistry.has(
            normalizedName
        )
    ) {
        throw ApiError.notFound(
            `Export provider "${normalizedName}" is not registered.`,
            {
                code: "EXPORT_PROVIDER_NOT_FOUND",
            }
        );
    }

    activeProviderName =
        normalizedName;

    logger.info(
        `Active export provider changed to: ${normalizedName}`
    );
};

/*
|--------------------------------------------------------------------------
| Get Active Export Provider
|--------------------------------------------------------------------------
*/

export const getActiveExportProvider =
    (): ExportProviderAdapter => {
        if (!activeProviderName) {
            throw ApiError.internal(
                "No export provider is currently configured.",
                {
                    code: "EXPORT_PROVIDER_NOT_CONFIGURED",
                }
            );
        }

        const provider =
            providerRegistry.get(
                activeProviderName
            );

        if (!provider) {
            throw ApiError.internal(
                "The active export provider is unavailable.",
                {
                    code: "EXPORT_PROVIDER_UNAVAILABLE",
                }
            );
        }

        return provider;
    };

/*
|--------------------------------------------------------------------------
| Check Provider Format Support
|--------------------------------------------------------------------------
*/

const assertProviderSupportsFormat = (
    provider: ExportProviderAdapter,
    format: ExportFormat
): void => {
    if (
        !provider.formats.includes(
            format
        )
    ) {
        throw ApiError.badRequest(
            `Export provider "${provider.name}" does not support "${format}" format.`,
            {
                code: "EXPORT_FORMAT_NOT_SUPPORTED",
                details: {
                    provider:
                        provider.name,
                    format,
                    supportedFormats:
                        provider.formats,
                },
            }
        );
    }
};

/*
|--------------------------------------------------------------------------
| Generate Export
|--------------------------------------------------------------------------
*/

export const generateExport = async <
    T = unknown
>(
    input: ExportInput<T>
): Promise<ExportDocument> => {
    validateExportInput(input);

    const format =
        assertExportFormat(
            input.format
        );

    const provider =
        getActiveExportProvider();

    assertProviderSupportsFormat(
        provider,
        format
    );

    const fileName =
        normalizeFileName(
            input.fileName,
            format
        );

    const exportId =
        generateExportId();

    const startedAt =
        Date.now();

    try {
        const data =
            await provider.export({
                exportId,
                data: input.data,
                format,
                columns:
                    input.columns,
                sheetName:
                    input.sheetName,
                title:
                    input.title,
                metadata:
                    input.metadata,
            });

        if (
            !Buffer.isBuffer(data)
        ) {
            throw ApiError.internal(
                "Export provider returned an invalid result.",
                {
                    code: "INVALID_EXPORT_PROVIDER_RESULT",
                }
            );
        }

        if (data.length === 0) {
            throw ApiError.internal(
                "Export provider returned an empty document.",
                {
                    code: "EMPTY_EXPORT_DOCUMENT",
                }
            );
        }

        if (
            data.length >
            exportConfig.maxExportSizeBytes
        ) {
            throw ApiError.internal(
                "Generated export exceeds the configured size limit.",
                {
                    code: "EXPORT_DOCUMENT_TOO_LARGE",
                    details: {
                        maxSizeBytes:
                            exportConfig.maxExportSizeBytes,

                        actualSizeBytes:
                            data.length,
                    },
                }
            );
        }

        const generatedAt =
            new Date();

        const checksum =
            calculateExportChecksum(
                data
            );

        const columnCount =
            input.columns?.length ??
            0;

        const document: ExportDocument = {
            id: exportId,

            format,

            fileName,

            mimeType:
                EXPORT_MIME_TYPES[
                    format
                ],

            data,

            size:
                data.length,

            status:
                EXPORT_STATUSES.GENERATED,

            rowCount:
                input.data.length,

            columnCount,

            checksum,

            provider:
                provider.name,

            metadata:
                input.metadata,

            generatedAt,
        };

        logger.info(
            `Export generated successfully. provider=${provider.name} format=${format} exportId=${exportId} rows=${input.data.length} size=${data.length} tookMs=${Date.now() - startedAt}`
        );

        return document;
    } catch (error) {
        logger.error(
            `Export generation failed. provider=${provider.name} format=${format} exportId=${exportId} tookMs=${Date.now() - startedAt}`
        );

        if (
            ApiError.isApiError(error)
        ) {
            throw error;
        }

        throw ApiError.internal(
            "Export generation failed.",
            {
                code: "EXPORT_GENERATION_FAILED",

                cause: error,

                details: {
                    exportId,
                    format,
                    provider:
                        provider.name,
                },
            }
        );
    }
};

/*
|--------------------------------------------------------------------------
| Export Configuration
|--------------------------------------------------------------------------
*/

export const configureExportService = (
    config: Partial<ExportServiceConfig>
): ExportServiceConfig => {
    if (
        !config ||
        typeof config !== "object"
    ) {
        throw ApiError.badRequest(
            "Export service configuration is required.",
            {
                code: "INVALID_EXPORT_CONFIG",
            }
        );
    }

    const nextConfig: ExportServiceConfig = {
        ...exportConfig,
        ...config,
    };

    if (
        !isNonEmptyString(
            nextConfig.defaultFilePrefix
        )
    ) {
        throw ApiError.badRequest(
            "Export default file prefix is required.",
            {
                code: "INVALID_EXPORT_DEFAULT_PREFIX",
            }
        );
    }

    if (
        !Number.isInteger(
            nextConfig.maxFileNameLength
        ) ||
        nextConfig.maxFileNameLength < 20
    ) {
        throw ApiError.badRequest(
            "Export maximum file name length must be at least 20.",
            {
                code: "INVALID_EXPORT_MAX_FILE_NAME_LENGTH",
            }
        );
    }

    if (
        !Number.isInteger(
            nextConfig.maxRows
        ) ||
        nextConfig.maxRows <= 0
    ) {
        throw ApiError.badRequest(
            "Export maximum rows must be a positive integer.",
            {
                code: "INVALID_EXPORT_MAX_ROWS",
            }
        );
    }

    if (
        !Number.isInteger(
            nextConfig.maxColumns
        ) ||
        nextConfig.maxColumns <= 0
    ) {
        throw ApiError.badRequest(
            "Export maximum columns must be a positive integer.",
            {
                code: "INVALID_EXPORT_MAX_COLUMNS",
            }
        );
    }

    if (
        !Number.isInteger(
            nextConfig.maxExportSizeBytes
        ) ||
        nextConfig.maxExportSizeBytes <= 0
    ) {
        throw ApiError.badRequest(
            "Export maximum document size must be a positive integer.",
            {
                code: "INVALID_EXPORT_MAX_SIZE",
            }
        );
    }

    exportConfig =
        nextConfig;

    return {
        ...exportConfig,
    };
};

/*
|--------------------------------------------------------------------------
| Get Export Configuration
|--------------------------------------------------------------------------
*/

export const getExportConfig =
    (): ExportServiceConfig => {
        return {
            ...exportConfig,
        };
    };

/*
|--------------------------------------------------------------------------
| Registered Providers
|--------------------------------------------------------------------------
*/

export const getRegisteredExportProviders =
    (): readonly string[] => {
        return [
            ...providerRegistry.keys(),
        ];
    };

/*
|--------------------------------------------------------------------------
| Provider Health
|--------------------------------------------------------------------------
*/

export interface ExportProviderHealth {
    readonly provider: string;

    readonly healthy: boolean;

    readonly supportedFormats?: readonly ExportFormat[];

    readonly message?: string;

    readonly timestamp: Date;
}

/*
|--------------------------------------------------------------------------
| Check Export Provider Health
|--------------------------------------------------------------------------
*/

export const checkExportProviderHealth = async (
    providerName?: string
): Promise<ExportProviderHealth> => {
    const name =
        providerName?.trim() ||
        activeProviderName;

    if (!name) {
        return {
            provider: "none",

            healthy: false,

            message:
                "No active export provider is configured.",

            timestamp:
                new Date(),
        };
    }

    const provider =
        providerRegistry.get(
            name
        );

    if (!provider) {
        return {
            provider: name,

            healthy: false,

            message:
                "Export provider is not registered.",

            timestamp:
                new Date(),
        };
    }

    return {
        provider: name,

        healthy: true,

        supportedFormats:
            provider.formats,

        message:
            "Export provider is registered and available.",

        timestamp:
            new Date(),
    };
};

/*
|--------------------------------------------------------------------------
| Export Service Health
|--------------------------------------------------------------------------
*/

export interface ExportServiceHealth {
    readonly service: "export";

    readonly healthy: boolean;

    readonly activeProvider?: string;

    readonly registeredProviders:
        readonly string[];

    readonly timestamp: Date;
}

/*
|--------------------------------------------------------------------------
| Check Export Service
|--------------------------------------------------------------------------
*/

export const checkExportService =
    async (): Promise<ExportServiceHealth> => {
        const registeredProviders =
            getRegisteredExportProviders();

        if (!activeProviderName) {
            return {
                service: "export",

                healthy: false,

                registeredProviders,

                timestamp:
                    new Date(),
            };
        }

        const providerHealth =
            await checkExportProviderHealth(
                activeProviderName
            );

        return {
            service: "export",

            healthy:
                providerHealth.healthy,

            activeProvider:
                activeProviderName,

            registeredProviders,

            timestamp:
                new Date(),
        };
    };

/*
|--------------------------------------------------------------------------
| Service Initialization
|--------------------------------------------------------------------------
*/

export const initializeExportService =
    async (): Promise<ExportServiceHealth> => {
        const health =
            await checkExportService();

        logger.info(
            `Export service initialized. Active provider: ${
                health.activeProvider ??
                "none"
            }`
        );

        return health;
    };