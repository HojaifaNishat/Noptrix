import crypto from "crypto";

import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";

/*
|--------------------------------------------------------------------------
| PDF Document Types
|--------------------------------------------------------------------------
*/

export const PDF_DOCUMENT_TYPES = {
    INVOICE: "invoice",
    CREDIT_NOTE: "credit_note",
    RECEIPT: "receipt",
    REPORT: "report",
    GENERIC: "generic",
} as const;

export type PdfDocumentType =
    (typeof PDF_DOCUMENT_TYPES)[keyof typeof PDF_DOCUMENT_TYPES];

/*
|--------------------------------------------------------------------------
| PDF Output Formats
|--------------------------------------------------------------------------
*/

export const PDF_OUTPUT_FORMATS = {
    BUFFER: "buffer",
    STREAM: "stream",
} as const;

export type PdfOutputFormat =
    (typeof PDF_OUTPUT_FORMATS)[keyof typeof PDF_OUTPUT_FORMATS];

/*
|--------------------------------------------------------------------------
| PDF Status
|--------------------------------------------------------------------------
*/

export const PDF_STATUSES = {
    GENERATED: "generated",
    FAILED: "failed",
} as const;

export type PdfStatus =
    (typeof PDF_STATUSES)[keyof typeof PDF_STATUSES];

/*
|--------------------------------------------------------------------------
| PDF Document Metadata
|--------------------------------------------------------------------------
*/

export interface PdfDocumentMetadata {
    readonly documentId?: string;
    readonly invoiceId?: string;
    readonly creditNoteId?: string;

    readonly customerId?: string;
    readonly orderId?: string;

    readonly title?: string;
    readonly author?: string;
    readonly subject?: string;

    readonly language?: string;

    readonly [key: string]: unknown;
}

/*
|--------------------------------------------------------------------------
| PDF Generate Input
|--------------------------------------------------------------------------
*/

export interface GeneratePdfInput {
    readonly documentType: PdfDocumentType;

    readonly data: unknown;

    readonly fileName?: string;

    readonly metadata?: PdfDocumentMetadata;

    readonly outputFormat?: PdfOutputFormat;
}

/*
|--------------------------------------------------------------------------
| PDF Document
|--------------------------------------------------------------------------
*/

export interface PdfDocument {
    readonly id: string;

    readonly documentType: PdfDocumentType;

    readonly fileName: string;

    readonly mimeType: "application/pdf";

    readonly data: Buffer;

    readonly size: number;

    readonly status: PdfStatus;

    readonly metadata?: PdfDocumentMetadata;

    readonly generatedAt: Date;

    readonly checksum: string;

    readonly provider?: string;
}

/*
|--------------------------------------------------------------------------
| PDF Provider Context
|--------------------------------------------------------------------------
*/

export interface PdfProviderContext {
    readonly documentId: string;

    readonly documentType: PdfDocumentType;

    readonly data: unknown;

    readonly metadata?: PdfDocumentMetadata;
}

/*
|--------------------------------------------------------------------------
| PDF Provider Adapter
|--------------------------------------------------------------------------
|
| Future engines can implement this contract:
|
| - PDFKit
| - Puppeteer
| - Playwright
| - HTML → PDF service
|
| Business logic remains independent from the PDF engine.
|--------------------------------------------------------------------------
*/

export interface PdfProviderAdapter {
    readonly name: string;

    generate(
        context: PdfProviderContext
    ): Promise<Buffer>;
}

/*
|--------------------------------------------------------------------------
| PDF Service Configuration
|--------------------------------------------------------------------------
*/

export interface PdfServiceConfig {
    readonly defaultFilePrefix: string;
    readonly maxFileNameLength: number;
    readonly maxDocumentSizeBytes: number;
}

/*
|--------------------------------------------------------------------------
| Default Configuration
|--------------------------------------------------------------------------
*/

const DEFAULT_CONFIG: PdfServiceConfig = {
    defaultFilePrefix: "noptrix",
    maxFileNameLength: 180,
    maxDocumentSizeBytes:
        25 * 1024 * 1024,
};

let pdfConfig: PdfServiceConfig = {
    ...DEFAULT_CONFIG,
};

/*
|--------------------------------------------------------------------------
| Provider Registry
|--------------------------------------------------------------------------
*/

const providerRegistry = new Map<
    string,
    PdfProviderAdapter
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

const assertDocumentType = (
    value: unknown
): PdfDocumentType => {
    if (
        typeof value !== "string" ||
        !Object.values(
            PDF_DOCUMENT_TYPES
        ).includes(
            value as PdfDocumentType
        )
    ) {
        throw ApiError.badRequest(
            `Unsupported PDF document type: ${String(value)}.`,
            {
                code: "INVALID_PDF_DOCUMENT_TYPE",
            }
        );
    }

    return value as PdfDocumentType;
};

const normalizeFileName = (
    fileName?: string,
    documentType?: PdfDocumentType
): string => {
    const fallbackType =
        documentType ?? PDF_DOCUMENT_TYPES.GENERIC;

    if (
        fileName !== undefined &&
        !isNonEmptyString(fileName)
    ) {
        throw ApiError.badRequest(
            "PDF file name must be a non-empty string.",
            {
                code: "INVALID_PDF_FILE_NAME",
            }
        );
    }

    let normalized =
        fileName?.trim() ||
        `${pdfConfig.defaultFilePrefix}-${fallbackType}-${Date.now()}`;

    /*
    |--------------------------------------------------------------------------
    | Remove path traversal and unsafe filesystem characters.
    |--------------------------------------------------------------------------
    */

    normalized = normalized
        .replace(/[\/\\:*?"<>|]/g, "-")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    if (!normalized.toLowerCase().endsWith(".pdf")) {
        normalized += ".pdf";
    }

    if (
        normalized.length >
        pdfConfig.maxFileNameLength
    ) {
        const extension = ".pdf";

        normalized =
            normalized.slice(
                0,
                pdfConfig.maxFileNameLength -
                    extension.length
            ) + extension;
    }

    return normalized;
};

/*
|--------------------------------------------------------------------------
| PDF ID
|--------------------------------------------------------------------------
*/

const generatePdfId = (): string => {
    return `pdf_${crypto.randomUUID()}`;
};

/*
|--------------------------------------------------------------------------
| PDF Checksum
|--------------------------------------------------------------------------
*/

const calculatePdfChecksum = (
    data: Buffer
): string => {
    return crypto
        .createHash("sha256")
        .update(data)
        .digest("hex");
};

/*
|--------------------------------------------------------------------------
| Provider Registration
|--------------------------------------------------------------------------
*/

export const registerPdfProvider = (
    provider: PdfProviderAdapter
): void => {
    if (
        !provider ||
        typeof provider !== "object"
    ) {
        throw ApiError.badRequest(
            "PDF provider is required.",
            {
                code: "INVALID_PDF_PROVIDER",
            }
        );
    }

    if (
        !isNonEmptyString(
            provider.name
        )
    ) {
        throw ApiError.badRequest(
            "PDF provider name is required.",
            {
                code: "INVALID_PDF_PROVIDER_NAME",
            }
        );
    }

    if (
        typeof provider.generate !==
        "function"
    ) {
        throw ApiError.badRequest(
            "PDF provider must implement generate().",
            {
                code: "INVALID_PDF_PROVIDER",
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
        activeProviderName = name;
    }

    logger.info(
        `PDF provider registered: ${name}`
    );
};

/*
|--------------------------------------------------------------------------
| Provider Removal
|--------------------------------------------------------------------------
*/

export const unregisterPdfProvider = (
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
| Active PDF Provider
|--------------------------------------------------------------------------
*/

export const setActivePdfProvider = (
    providerName: string
): void => {
    const normalizedName =
        providerName.trim();

    if (!normalizedName) {
        throw ApiError.badRequest(
            "PDF provider name is required.",
            {
                code: "INVALID_PDF_PROVIDER_NAME",
            }
        );
    }

    if (
        !providerRegistry.has(
            normalizedName
        )
    ) {
        throw ApiError.notFound(
            `PDF provider "${normalizedName}" is not registered.`,
            {
                code: "PDF_PROVIDER_NOT_FOUND",
            }
        );
    }

    activeProviderName =
        normalizedName;

    logger.info(
        `Active PDF provider changed to: ${normalizedName}`
    );
};

/*
|--------------------------------------------------------------------------
| Get Active PDF Provider
|--------------------------------------------------------------------------
*/

export const getActivePdfProvider =
    (): PdfProviderAdapter => {
        if (!activeProviderName) {
            throw ApiError.internal(
                "No PDF provider is currently configured.",
                {
                    code: "PDF_PROVIDER_NOT_CONFIGURED",
                }
            );
        }

        const provider =
            providerRegistry.get(
                activeProviderName
            );

        if (!provider) {
            throw ApiError.internal(
                "The active PDF provider is unavailable.",
                {
                    code: "PDF_PROVIDER_UNAVAILABLE",
                }
            );
        }

        return provider;
    };

/*
|--------------------------------------------------------------------------
| Generate PDF
|--------------------------------------------------------------------------
*/

export const generatePdf = async (
    input: GeneratePdfInput
): Promise<PdfDocument> => {
    if (
        !input ||
        typeof input !== "object"
    ) {
        throw ApiError.badRequest(
            "PDF generation input is required.",
            {
                code: "INVALID_PDF_INPUT",
            }
        );
    }

    const documentType =
        assertDocumentType(
            input.documentType
        );

    if (
        input.data === undefined ||
        input.data === null
    ) {
        throw ApiError.badRequest(
            "PDF document data is required.",
            {
                code: "INVALID_PDF_DATA",
            }
        );
    }

    const fileName =
        normalizeFileName(
            input.fileName,
            documentType
        );

    const provider =
        getActivePdfProvider();

    const documentId =
        generatePdfId();

    const startedAt =
        Date.now();

    try {
        const data =
            await provider.generate({
                documentId,
                documentType,
                data: input.data,
                metadata: input.metadata,
            });

        if (!Buffer.isBuffer(data)) {
            throw ApiError.internal(
                "PDF provider returned an invalid result.",
                {
                    code: "INVALID_PDF_PROVIDER_RESULT",
                }
            );
        }

        if (data.length === 0) {
            throw ApiError.internal(
                "PDF provider returned an empty document.",
                {
                    code: "EMPTY_PDF_DOCUMENT",
                }
            );
        }

        if (
            data.length >
            pdfConfig.maxDocumentSizeBytes
        ) {
            throw ApiError.internal(
                "Generated PDF exceeds the configured size limit.",
                {
                    code: "PDF_DOCUMENT_TOO_LARGE",
                    details: {
                        maxSizeBytes:
                            pdfConfig.maxDocumentSizeBytes,
                        actualSizeBytes:
                            data.length,
                    },
                }
            );
        }

        const generatedAt =
            new Date();

        const checksum =
            calculatePdfChecksum(data);

        const pdfDocument: PdfDocument = {
            id: documentId,

            documentType,

            fileName,

            mimeType:
                "application/pdf",

            data,

            size: data.length,

            status:
                PDF_STATUSES.GENERATED,

            metadata:
                input.metadata,

            generatedAt,

            checksum,

            provider:
                provider.name,
        };

        logger.info(
            `PDF generated successfully. provider=${provider.name} type=${documentType} documentId=${documentId} size=${data.length} tookMs=${Date.now() - startedAt}`
        );

        return pdfDocument;
    } catch (error) {
        logger.error(
            `PDF generation failed. provider=${provider.name} type=${documentType} documentId=${documentId} tookMs=${Date.now() - startedAt}`
        );

        if (
            ApiError.isApiError(error)
        ) {
            throw error;
        }

        throw ApiError.internal(
            "PDF generation failed.",
            {
                code: "PDF_GENERATION_FAILED",
                cause: error,
                details: {
                    documentId,
                    documentType,
                    provider:
                        provider.name,
                },
            }
        );
    }
};

/*
|--------------------------------------------------------------------------
| PDF Configuration
|--------------------------------------------------------------------------
*/

export const configurePdfService = (
    config: Partial<PdfServiceConfig>
): PdfServiceConfig => {
    if (
        !config ||
        typeof config !== "object"
    ) {
        throw ApiError.badRequest(
            "PDF service configuration is required.",
            {
                code: "INVALID_PDF_CONFIG",
            }
        );
    }

    const nextConfig: PdfServiceConfig = {
        ...pdfConfig,
        ...config,
    };

    if (
        !isNonEmptyString(
            nextConfig.defaultFilePrefix
        )
    ) {
        throw ApiError.badRequest(
            "PDF default file prefix is required.",
            {
                code: "INVALID_PDF_DEFAULT_PREFIX",
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
            "PDF maximum file name length must be at least 20.",
            {
                code: "INVALID_PDF_MAX_FILE_NAME_LENGTH",
            }
        );
    }

    if (
        !Number.isInteger(
            nextConfig.maxDocumentSizeBytes
        ) ||
        nextConfig.maxDocumentSizeBytes <= 0
    ) {
        throw ApiError.badRequest(
            "PDF maximum document size must be a positive integer.",
            {
                code: "INVALID_PDF_MAX_DOCUMENT_SIZE",
            }
        );
    }

    pdfConfig = nextConfig;

    return {
        ...pdfConfig,
    };
};

/*
|--------------------------------------------------------------------------
| Get PDF Configuration
|--------------------------------------------------------------------------
*/

export const getPdfConfig =
    (): PdfServiceConfig => {
        return {
            ...pdfConfig,
        };
    };

/*
|--------------------------------------------------------------------------
| Registered Providers
|--------------------------------------------------------------------------
*/

export const getRegisteredPdfProviders =
    (): readonly string[] => {
        return [
            ...providerRegistry.keys(),
        ];
    };

/*
|--------------------------------------------------------------------------
| PDF Provider Health
|--------------------------------------------------------------------------
*/

export interface PdfProviderHealth {
    readonly provider: string;

    readonly healthy: boolean;

    readonly message?: string;

    readonly timestamp: Date;
}

/*
|--------------------------------------------------------------------------
| Check PDF Provider Health
|--------------------------------------------------------------------------
*/

export const checkPdfProviderHealth = async (
    providerName?: string
): Promise<PdfProviderHealth> => {
    const name =
        providerName?.trim() ||
        activeProviderName;

    if (!name) {
        return {
            provider: "none",
            healthy: false,
            message:
                "No active PDF provider is configured.",
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
                "PDF provider is not registered.",
            timestamp: new Date(),
        };
    }

    return {
        provider: name,
        healthy: true,
        message:
            "PDF provider is registered and available.",
        timestamp: new Date(),
    };
};

/*
|--------------------------------------------------------------------------
| PDF Service Health
|--------------------------------------------------------------------------
*/

export interface PdfServiceHealth {
    readonly service: "pdf";

    readonly healthy: boolean;

    readonly activeProvider?: string;

    readonly registeredProviders: readonly string[];

    readonly timestamp: Date;
};

/*
|--------------------------------------------------------------------------
| Check PDF Service
|--------------------------------------------------------------------------
*/

export const checkPdfService =
    async (): Promise<PdfServiceHealth> => {
        const registeredProviders =
            getRegisteredPdfProviders();

        if (!activeProviderName) {
            return {
                service: "pdf",
                healthy: false,
                registeredProviders,
                timestamp: new Date(),
            };
        }

        const providerHealth =
            await checkPdfProviderHealth(
                activeProviderName
            );

        return {
            service: "pdf",

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

export const initializePdfService =
    async (): Promise<PdfServiceHealth> => {
        const health =
            await checkPdfService();

        logger.info(
            `PDF service initialized. Active provider: ${
                health.activeProvider ??
                "none"
            }`
        );

        return health;
    };