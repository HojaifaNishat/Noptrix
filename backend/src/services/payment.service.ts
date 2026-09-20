import crypto from "node:crypto";

import {
    PAYMENT_METHODS,
    PAYMENT_PROVIDERS,
    getPaymentConfig,
    getPaymentCurrency,
    getPaymentProvider,
    getPaymentUrls,
    getPaymentWebhookSecret,
    isCodEnabled,
    isOnlinePaymentEnabled,
    isPaymentHealthy,
    isPaymentMethodEnabled,
    isPaymentProviderConfigured,
    type PaymentMethod,
    type PaymentProvider,
} from "../config/payment";

import {
    ApiError,
} from "../utils/ApiError";

import {
    logger,
} from "../utils/logger";


/*
|--------------------------------------------------------------------------
| Payment Service
|--------------------------------------------------------------------------
|
| This service is intentionally provider-independent.
|
| Controllers / modules should communicate with this service instead
| of directly communicating with SSLCommerz, Stripe, PayPal, etc.
|
| Architecture:
|
| Controller
|     ↓
| Payment Service
|     ↓
| Provider Adapter
|     ↓
| Payment Gateway
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

export const PAYMENT_TRANSACTION_STATUSES = {
    CREATED: "created",
    PENDING: "pending",
    PROCESSING: "processing",
    SUCCESS: "success",
    FAILED: "failed",
    CANCELLED: "cancelled",
    REFUNDED: "refunded",
    PARTIALLY_REFUNDED: "partially_refunded",
    EXPIRED: "expired",
} as const;

export type PaymentTransactionStatus =
    (typeof PAYMENT_TRANSACTION_STATUSES)[keyof typeof PAYMENT_TRANSACTION_STATUSES];


export const PAYMENT_EVENTS = {
    CREATED: "created",
    INITIATED: "initiated",
    SUCCESS: "success",
    FAILED: "failed",
    CANCELLED: "cancelled",
    REFUNDED: "refunded",
    WEBHOOK: "webhook",
} as const;

export type PaymentEvent =
    (typeof PAYMENT_EVENTS)[keyof typeof PAYMENT_EVENTS];


/*
|--------------------------------------------------------------------------
| Payment Amount
|--------------------------------------------------------------------------
*/

export interface PaymentAmount {
    readonly amount: number;
    readonly currency: string;
}


/*
|--------------------------------------------------------------------------
| Payment Customer
|--------------------------------------------------------------------------
*/

export interface PaymentCustomer {
    readonly name?: string;
    readonly email?: string;
    readonly phone?: string;
    readonly address?: string;
    readonly city?: string;
    readonly state?: string;
    readonly postalCode?: string;
    readonly country?: string;
}


/*
|--------------------------------------------------------------------------
| Payment Metadata
|--------------------------------------------------------------------------
*/

export type PaymentMetadataValue =
    string |
    number |
    boolean |
    null;

export type PaymentMetadata =
    Readonly<Record<
        string,
        PaymentMetadataValue
    >>;


/*
|--------------------------------------------------------------------------
| Create Payment Input
|--------------------------------------------------------------------------
*/

export interface CreatePaymentInput {
    readonly orderId: string;
    readonly amount: number;
    readonly currency?: string;
    readonly method: PaymentMethod;
    readonly customer?: PaymentCustomer;
    readonly description?: string;
    readonly metadata?: PaymentMetadata;
    readonly idempotencyKey?: string;
    readonly callbackData?: Readonly<Record<string, string>>;
}


/*
|--------------------------------------------------------------------------
| Provider Payment Request
|--------------------------------------------------------------------------
*/

export interface ProviderPaymentRequest {
    readonly transactionId: string;
    readonly orderId: string;
    readonly amount: number;
    readonly currency: string;
    readonly customer?: PaymentCustomer;
    readonly description?: string;
    readonly metadata?: PaymentMetadata;
    readonly callbackData?: Readonly<Record<string, string>>;
    readonly urls: ReturnType<typeof getPaymentUrls>;
}


/*
|--------------------------------------------------------------------------
| Provider Payment Response
|--------------------------------------------------------------------------
*/

export interface ProviderPaymentResponse {
    readonly providerTransactionId?: string;
    readonly redirectUrl?: string;
    readonly checkoutUrl?: string;
    readonly status?: PaymentTransactionStatus;
    readonly raw?: unknown;
    readonly metadata?: PaymentMetadata;
}


/*
|--------------------------------------------------------------------------
| Payment Provider Adapter
|--------------------------------------------------------------------------
|
| Every gateway implements this contract.
|
| Example future adapters:
|
| SSLCommerzAdapter
| StripeAdapter
| PayPalAdapter
| RazorpayAdapter
|
|--------------------------------------------------------------------------
*/

export interface PaymentProviderAdapter {
    readonly provider: PaymentProvider;

    createPayment(
        input: ProviderPaymentRequest
    ): Promise<ProviderPaymentResponse>;

    verifyPayment?(
        transactionId: string
    ): Promise<ProviderPaymentResponse>;

    refundPayment?(
        transactionId: string,
        amount?: number
    ): Promise<ProviderPaymentResponse>;

    verifyWebhook?(
        payload: unknown,
        signature?: string
    ): Promise<boolean>;

    parseWebhook?(
        payload: unknown
    ): Promise<ProviderPaymentResponse>;
}


/*
|--------------------------------------------------------------------------
| Provider Adapter Registry
|--------------------------------------------------------------------------
*/

const providerAdapters =
    new Map<
        PaymentProvider,
        PaymentProviderAdapter
    >();


/*
|--------------------------------------------------------------------------
| Register Provider Adapter
|--------------------------------------------------------------------------
*/

export const registerPaymentProviderAdapter = (
    adapter: PaymentProviderAdapter
): void => {
    if (!adapter) {
        throw ApiError.internal(
            "Payment provider adapter is required.",
            {
                code: "PAYMENT_ADAPTER_REQUIRED",
            }
        );
    }

    providerAdapters.set(
        adapter.provider,
        adapter
    );

    logger.info(
        {
            provider: adapter.provider,
        },
        "Payment provider adapter registered."
    );
};


/*
|--------------------------------------------------------------------------
| Remove Provider Adapter
|--------------------------------------------------------------------------
*/

export const unregisterPaymentProviderAdapter = (
    provider: PaymentProvider
): boolean => {
    return providerAdapters.delete(
        provider
    );
};


/*
|--------------------------------------------------------------------------
| Get Provider Adapter
|--------------------------------------------------------------------------
*/

export const getPaymentProviderAdapter = (
    provider: PaymentProvider =
        getPaymentProvider()
): PaymentProviderAdapter => {
    const adapter =
        providerAdapters.get(
            provider
        );

    if (!adapter) {
        throw ApiError.internal(
            `Payment provider adapter is not registered: ${provider}`,
            {
                code: "PAYMENT_ADAPTER_NOT_REGISTERED",
                details: {
                    provider,
                },
            }
        );
    }

    return adapter;
};


/*
|--------------------------------------------------------------------------
| Provider Adapter Availability
|--------------------------------------------------------------------------
*/

export const isPaymentProviderAdapterAvailable = (
    provider: PaymentProvider
): boolean => {
    return providerAdapters.has(
        provider
    );
};


/*
|--------------------------------------------------------------------------
| Validation Helpers
|--------------------------------------------------------------------------
*/

const normalizeString = (
    value: string
): string => {
    return value.trim();
};


const validateOrderId = (
    orderId: string
): string => {
    const normalized =
        normalizeString(orderId);

    if (!normalized) {
        throw ApiError.badRequest(
            "Order ID is required.",
            {
                code: "PAYMENT_ORDER_ID_REQUIRED",
            }
        );
    }

    if (normalized.length > 128) {
        throw ApiError.badRequest(
            "Order ID is too long.",
            {
                code: "PAYMENT_ORDER_ID_TOO_LONG",
            }
        );
    }

    return normalized;
};


const validateAmount = (
    amount: number
): number => {
    if (
        typeof amount !== "number" ||
        !Number.isFinite(amount)
    ) {
        throw ApiError.badRequest(
            "Payment amount must be a valid number.",
            {
                code: "INVALID_PAYMENT_AMOUNT",
            }
        );
    }

    if (amount <= 0) {
        throw ApiError.badRequest(
            "Payment amount must be greater than zero.",
            {
                code: "INVALID_PAYMENT_AMOUNT",
            }
        );
    }

    /*
     * Money should never be represented with arbitrary
     * floating-point precision.
     */
    const normalized =
        Math.round(
            (amount + Number.EPSILON) *
                100
        ) / 100;

    if (
        normalized <= 0
    ) {
        throw ApiError.badRequest(
            "Payment amount must be greater than zero.",
            {
                code: "INVALID_PAYMENT_AMOUNT",
            }
        );
    }

    return normalized;
};


const validateCurrency = (
    currency?: string
): string => {
    const resolved =
        normalizeString(
            currency ||
            getPaymentCurrency()
        ).toUpperCase();

    if (
        !/^[A-Z]{3}$/.test(
            resolved
        )
    ) {
        throw ApiError.badRequest(
            "Payment currency must be a valid ISO 4217 currency code.",
            {
                code: "INVALID_PAYMENT_CURRENCY",
            }
        );
    }

    return resolved;
};


const validateIdempotencyKey = (
    key?: string
): string | undefined => {
    if (
        key === undefined
    ) {
        return undefined;
    }

    const normalized =
        normalizeString(key);

    if (!normalized) {
        return undefined;
    }

    if (
        normalized.length < 8
    ) {
        throw ApiError.badRequest(
            "Idempotency key is too short.",
            {
                code: "INVALID_IDEMPOTENCY_KEY",
            }
        );
    }

    if (
        normalized.length > 255
    ) {
        throw ApiError.badRequest(
            "Idempotency key is too long.",
            {
                code: "INVALID_IDEMPOTENCY_KEY",
            }
        );
    }

    return normalized;
};


/*
|--------------------------------------------------------------------------
| Payment Method Validation
|--------------------------------------------------------------------------
*/

export const validatePaymentMethod = (
    method: PaymentMethod | string
): PaymentMethod => {
    const normalized =
        normalizeString(
            method
        ).toLowerCase();

    if (
        !Object.values(
            PAYMENT_METHODS
        ).includes(
            normalized as PaymentMethod
        )
    ) {
        throw ApiError.badRequest(
            `Unsupported payment method: ${method}`,
            {
                code: "UNSUPPORTED_PAYMENT_METHOD",
            }
        );
    }

    return normalized as PaymentMethod;
};


/*
|--------------------------------------------------------------------------
| Payment Provider Validation
|--------------------------------------------------------------------------
*/

export const validatePaymentProvider = (
    provider: PaymentProvider | string
): PaymentProvider => {
    const normalized =
        normalizeString(
            provider
        ).toLowerCase();

    if (
        !Object.values(
            PAYMENT_PROVIDERS
        ).includes(
            normalized as PaymentProvider
        )
    ) {
        throw ApiError.badRequest(
            `Unsupported payment provider: ${provider}`,
            {
                code: "UNSUPPORTED_PAYMENT_PROVIDER",
            }
        );
    }

    return normalized as PaymentProvider;
};


/*
|--------------------------------------------------------------------------
| Payment Method Availability Guard
|--------------------------------------------------------------------------
*/

export const assertPaymentMethodAvailable = (
    method: PaymentMethod
): void => {
    if (
        !isPaymentMethodEnabled(
            method
        )
    ) {
        throw ApiError.badRequest(
            `Payment method is currently unavailable: ${method}`,
            {
                code: "PAYMENT_METHOD_UNAVAILABLE",
                details: {
                    method,
                },
            }
        );
    }
};


/*
|--------------------------------------------------------------------------
| Online Payment Guard
|--------------------------------------------------------------------------
*/

export const assertOnlinePaymentAvailable =
    (): void => {
        if (
            !isOnlinePaymentEnabled()
        ) {
            throw ApiError.badRequest(
                "Online payment is currently unavailable.",
                {
                    code: "ONLINE_PAYMENT_UNAVAILABLE",
                }
            );
        }

        if (
            !isPaymentProviderConfigured()
        ) {
            throw ApiError.internal(
                "No online payment provider is configured.",
                {
                    code: "PAYMENT_PROVIDER_NOT_CONFIGURED",
                }
            );
        }

        if (
            !isPaymentHealthy()
        ) {
            throw ApiError.internal(
                "Payment service is currently unhealthy.",
                {
                    code: "PAYMENT_SERVICE_UNHEALTHY",
                }
            );
        }
    };


/*
|--------------------------------------------------------------------------
| Transaction ID
|--------------------------------------------------------------------------
*/

export const generatePaymentTransactionId = (
    orderId: string
): string => {
    const safeOrderId =
        validateOrderId(
            orderId
        );

    const timestamp =
        Date.now().toString(36);

    const randomPart =
        crypto
            .randomBytes(8)
            .toString("hex");

    return [
        "NPX",
        timestamp,
        randomPart,
        safeOrderId
            .replace(
                /[^a-zA-Z0-9]/g,
                ""
            )
            .slice(-24),
    ]
        .filter(Boolean)
        .join("-");
};


/*
|--------------------------------------------------------------------------
| Payment Reference
|--------------------------------------------------------------------------
*/

export const generatePaymentReference = (): string => {
    return [
        "NPREF",
        Date.now().toString(36),
        crypto
            .randomBytes(6)
            .toString("hex"),
    ].join("-");
};


/*
|--------------------------------------------------------------------------
| Initial Transaction State
|--------------------------------------------------------------------------
*/

export interface PaymentTransaction {
    readonly transactionId: string;
    readonly referenceId: string;
    readonly orderId: string;
    readonly amount: number;
    readonly currency: string;
    readonly method: PaymentMethod;
    readonly provider: PaymentProvider;
    readonly status: PaymentTransactionStatus;
    readonly customer?: PaymentCustomer;
    readonly description?: string;
    readonly metadata?: PaymentMetadata;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly providerTransactionId?: string;
    readonly redirectUrl?: string;
    readonly checkoutUrl?: string;
}


/*
|--------------------------------------------------------------------------
| Create Transaction
|--------------------------------------------------------------------------
*/

export const createPaymentTransaction = (
    input: CreatePaymentInput
): PaymentTransaction => {
    const orderId =
        validateOrderId(
            input.orderId
        );

    const amount =
        validateAmount(
            input.amount
        );

    const currency =
        validateCurrency(
            input.currency
        );

    const method =
        validatePaymentMethod(
            input.method
        );

    assertPaymentMethodAvailable(
        method
    );

    const provider =
        method === PAYMENT_METHODS.COD
            ? PAYMENT_PROVIDERS.NONE
            : getPaymentProvider();

    if (
        method === PAYMENT_METHODS.ONLINE
    ) {
        assertOnlinePaymentAvailable();
    }

    const now =
        new Date();

    return {
        transactionId:
            generatePaymentTransactionId(
                orderId
            ),

        referenceId:
            generatePaymentReference(),

        orderId,

        amount,

        currency,

        method,

        provider,

        status:
            method === PAYMENT_METHODS.COD
                ? PAYMENT_TRANSACTION_STATUSES.PENDING
                : PAYMENT_TRANSACTION_STATUSES.CREATED,

        customer:
            input.customer,

        description:
            input.description,

        metadata:
            input.metadata,

        createdAt:
            now,

        updatedAt:
            now,
    };
};


/*
|--------------------------------------------------------------------------
| Payment Creation Result
|--------------------------------------------------------------------------
*/

export interface CreatePaymentResult {
    readonly transaction: PaymentTransaction;
    readonly providerResponse?: ProviderPaymentResponse;
}


/*
|--------------------------------------------------------------------------
| Create Payment
|--------------------------------------------------------------------------
*/

export const createPayment = async (
    input: CreatePaymentInput
): Promise<CreatePaymentResult> => {
    const transaction =
        createPaymentTransaction(
            input
        );

    /*
     * COD does not require a gateway.
     */
    if (
        transaction.method ===
        PAYMENT_METHODS.COD
    ) {
        logger.info(
            {
                transactionId:
                    transaction.transactionId,

                orderId:
                    transaction.orderId,

                amount:
                    transaction.amount,

                method:
                    transaction.method,
            },
            "COD payment transaction created."
        );

        return {
            transaction,
        };
    }

    /*
     * Online gateway payment.
     */
    const adapter =
        getPaymentProviderAdapter(
            transaction.provider
        );

    const providerRequest:
        ProviderPaymentRequest = {
            transactionId:
                transaction.transactionId,

            orderId:
                transaction.orderId,

            amount:
                transaction.amount,

            currency:
                transaction.currency,

            customer:
                transaction.customer,

            description:
                transaction.description,

            metadata:
                transaction.metadata,

            callbackData:
                input.callbackData,

            urls:
                getPaymentUrls(),
        };

    try {
        const providerResponse =
            await adapter.createPayment(
                providerRequest
            );

        logger.info(
            {
                transactionId:
                    transaction.transactionId,

                orderId:
                    transaction.orderId,

                provider:
                    transaction.provider,

                status:
                    providerResponse.status,
            },
            "Online payment transaction created."
        );

        return {
            transaction: {
                ...transaction,

                status:
                    providerResponse.status ??
                    PAYMENT_TRANSACTION_STATUSES.PENDING,

                updatedAt:
                    new Date(),

                providerTransactionId:
                    providerResponse
                        .providerTransactionId,

                redirectUrl:
                    providerResponse
                        .redirectUrl,

                checkoutUrl:
                    providerResponse
                        .checkoutUrl,
            },

            providerResponse,
        };
    } catch (error) {
        logger.error(
            {
                transactionId:
                    transaction.transactionId,

                orderId:
                    transaction.orderId,

                provider:
                    transaction.provider,

                error,
            },
            "Online payment creation failed."
        );

        throw ApiError.internal(
            "Unable to initialize payment.",
            {
                code: "PAYMENT_INITIALIZATION_FAILED",
                cause: error,
            }
        );
    }
};


/*
|--------------------------------------------------------------------------
| Verify Payment Input
|--------------------------------------------------------------------------
*/

export interface VerifyPaymentInput {
    readonly transactionId: string;
    readonly provider?: PaymentProvider;
}


/*
|--------------------------------------------------------------------------
| Verify Payment Result
|--------------------------------------------------------------------------
*/

export interface VerifyPaymentResult {
    readonly transactionId: string;
    readonly status: PaymentTransactionStatus;
    readonly providerResponse: ProviderPaymentResponse;
}


/*
|--------------------------------------------------------------------------
| Verify Payment
|--------------------------------------------------------------------------
*/

export const verifyPayment = async (
    input: VerifyPaymentInput
): Promise<VerifyPaymentResult> => {
    const transactionId =
        normalizeString(
            input.transactionId
        );

    if (!transactionId) {
        throw ApiError.badRequest(
            "Payment transaction ID is required.",
            {
                code: "PAYMENT_TRANSACTION_ID_REQUIRED",
            }
        );
    }

    const provider =
        input.provider ??
        getPaymentProvider();

    const normalizedProvider =
        validatePaymentProvider(
            provider
        );

    if (
        normalizedProvider ===
        PAYMENT_PROVIDERS.NONE
    ) {
        throw ApiError.badRequest(
            "A payment provider is required for online payment verification.",
            {
                code: "PAYMENT_PROVIDER_REQUIRED",
            }
        );
    }

    const adapter =
        getPaymentProviderAdapter(
            normalizedProvider
        );

    if (
        !adapter.verifyPayment
    ) {
        throw ApiError.internal(
            `Payment verification is not supported by provider: ${normalizedProvider}`,
            {
                code: "PAYMENT_VERIFICATION_UNSUPPORTED",
            }
        );
    }

    try {
        const providerResponse =
            await adapter.verifyPayment(
                transactionId
            );

        return {
            transactionId,

            status:
                providerResponse.status ??
                PAYMENT_TRANSACTION_STATUSES.PENDING,

            providerResponse,
        };
    } catch (error) {
        logger.error(
            {
                transactionId,
                provider:
                    normalizedProvider,
                error,
            },
            "Payment verification failed."
        );

        throw ApiError.internal(
            "Unable to verify payment.",
            {
                code: "PAYMENT_VERIFICATION_FAILED",
                cause: error,
            }
        );
    }
};


/*
|--------------------------------------------------------------------------
| Refund
|--------------------------------------------------------------------------
*/

export interface RefundPaymentInput {
    readonly transactionId: string;
    readonly amount?: number;
    readonly provider?: PaymentProvider;
}


export interface RefundPaymentResult {
    readonly transactionId: string;
    readonly amount?: number;
    readonly status: PaymentTransactionStatus;
    readonly providerResponse:
        ProviderPaymentResponse;
}


export const refundPayment = async (
    input: RefundPaymentInput
): Promise<RefundPaymentResult> => {
    const transactionId =
        normalizeString(
            input.transactionId
        );

    if (!transactionId) {
        throw ApiError.badRequest(
            "Payment transaction ID is required.",
            {
                code: "PAYMENT_TRANSACTION_ID_REQUIRED",
            }
        );
    }

    let amount:
        number | undefined;

    if (
        input.amount !== undefined
    ) {
        amount =
            validateAmount(
                input.amount
            );
    }

    const provider =
        input.provider ??
        getPaymentProvider();

    const normalizedProvider =
        validatePaymentProvider(
            provider
        );

    if (
        normalizedProvider ===
        PAYMENT_PROVIDERS.NONE
    ) {
        throw ApiError.badRequest(
            "A payment provider is required for refunds.",
            {
                code: "PAYMENT_PROVIDER_REQUIRED",
            }
        );
    }

    const adapter =
        getPaymentProviderAdapter(
            normalizedProvider
        );

    if (
        !adapter.refundPayment
    ) {
        throw ApiError.internal(
            `Refunds are not supported by provider: ${normalizedProvider}`,
            {
                code: "PAYMENT_REFUND_UNSUPPORTED",
            }
        );
    }

    try {
        const providerResponse =
            await adapter.refundPayment(
                transactionId,
                amount
            );

        return {
            transactionId,

            amount,

            status:
                providerResponse.status ??
                PAYMENT_TRANSACTION_STATUSES.REFUNDED,

            providerResponse,
        };
    } catch (error) {
        logger.error(
            {
                transactionId,
                provider:
                    normalizedProvider,
                amount,
                error,
            },
            "Payment refund failed."
        );

        throw ApiError.internal(
            "Unable to process payment refund.",
            {
                code: "PAYMENT_REFUND_FAILED",
                cause: error,
            }
        );
    }
};


/*
|--------------------------------------------------------------------------
| Webhook Verification
|--------------------------------------------------------------------------
*/

export interface VerifyWebhookInput {
    readonly provider: PaymentProvider;
    readonly payload: unknown;
    readonly signature?: string;
}


/*
|--------------------------------------------------------------------------
| Generic HMAC Webhook Verification
|--------------------------------------------------------------------------
|
| This helper is intentionally available for providers that use
| HMAC-SHA256 signatures.
|
| Provider-specific verification should still live inside the
| provider adapter whenever the gateway has its own signature
| scheme.
|
|--------------------------------------------------------------------------
*/

export const verifyHmacWebhookSignature = (
    payload: string | Buffer,
    signature: string,
    secret: string
): boolean => {
    if (
        !signature ||
        !secret
    ) {
        return false;
    }

    const expectedSignature =
        crypto
            .createHmac(
                "sha256",
                secret
            )
            .update(payload)
            .digest("hex");

    const receivedBuffer =
        Buffer.from(
            signature,
            "utf8"
        );

    const expectedBuffer =
        Buffer.from(
            expectedSignature,
            "utf8"
        );

    if (
        receivedBuffer.length !==
        expectedBuffer.length
    ) {
        return false;
    }

    return crypto.timingSafeEqual(
        receivedBuffer,
        expectedBuffer
    );
};


/*
|--------------------------------------------------------------------------
| Verify Webhook
|--------------------------------------------------------------------------
*/

export const verifyPaymentWebhook = async (
    input: VerifyWebhookInput
): Promise<boolean> => {
    const provider =
        validatePaymentProvider(
            input.provider
        );

    if (
        provider ===
        PAYMENT_PROVIDERS.NONE
    ) {
        return false;
    }

    const adapter =
        getPaymentProviderAdapter(
            provider
        );

    /*
     * Provider-specific verification takes priority.
     */
    if (
        adapter.verifyWebhook
    ) {
        try {
            return await adapter.verifyWebhook(
                input.payload,
                input.signature
            );
        } catch (error) {
            logger.error(
                {
                    provider,
                    error,
                },
                "Provider webhook verification failed."
            );

            return false;
        }
    }

    /*
     * Generic HMAC fallback.
     */
    if (
        input.signature === undefined
    ) {
        return false;
    }

    let serializedPayload: string;

    if (
        typeof input.payload ===
        "string"
    ) {
        serializedPayload =
            input.payload;
    } else {
        serializedPayload =
            JSON.stringify(
                input.payload
            );
    }

    try {
        const secret =
            getPaymentWebhookSecret();

        return verifyHmacWebhookSignature(
            serializedPayload,
            input.signature,
            secret
        );
    } catch {
        return false;
    }
};


/*
|--------------------------------------------------------------------------
| Webhook Processing
|--------------------------------------------------------------------------
*/

export interface ProcessPaymentWebhookInput {
    readonly provider: PaymentProvider;
    readonly payload: unknown;
    readonly signature?: string;
}


export interface ProcessPaymentWebhookResult {
    readonly verified: boolean;
    readonly provider: PaymentProvider;
    readonly response?: ProviderPaymentResponse;
}


export const processPaymentWebhook = async (
    input: ProcessPaymentWebhookInput
): Promise<ProcessPaymentWebhookResult> => {
    const provider =
        validatePaymentProvider(
            input.provider
        );

    const verified =
        await verifyPaymentWebhook({
            provider,
            payload:
                input.payload,
            signature:
                input.signature,
        });

    if (!verified) {
        throw ApiError.unauthorized(
            "Invalid payment webhook signature.",
            {
                code: "INVALID_PAYMENT_WEBHOOK_SIGNATURE",
            }
        );
    }

    const adapter =
        getPaymentProviderAdapter(
            provider
        );

    if (
        !adapter.parseWebhook
    ) {
        throw ApiError.internal(
            `Webhook parsing is not supported by provider: ${provider}`,
            {
                code: "PAYMENT_WEBHOOK_PARSING_UNSUPPORTED",
            }
        );
    }

    try {
        const response =
            await adapter.parseWebhook(
                input.payload
            );

        logger.info(
            {
                provider,
                status:
                    response.status,
                providerTransactionId:
                    response.providerTransactionId,
            },
            "Payment webhook processed."
        );

        return {
            verified: true,
            provider,
            response,
        };
    } catch (error) {
        logger.error(
            {
                provider,
                error,
            },
            "Payment webhook processing failed."
        );

        throw ApiError.internal(
            "Unable to process payment webhook.",
            {
                code: "PAYMENT_WEBHOOK_PROCESSING_FAILED",
                cause: error,
            }
        );
    }
};


/*
|--------------------------------------------------------------------------
| Payment Status Transition Rules
|--------------------------------------------------------------------------
*/

const PAYMENT_STATUS_TRANSITIONS:
    Readonly<
        Record<
            PaymentTransactionStatus,
            readonly PaymentTransactionStatus[]
        >
    > = {
        [PAYMENT_TRANSACTION_STATUSES.CREATED]: [
            PAYMENT_TRANSACTION_STATUSES.PENDING,
            PAYMENT_TRANSACTION_STATUSES.PROCESSING,
            PAYMENT_TRANSACTION_STATUSES.FAILED,
            PAYMENT_TRANSACTION_STATUSES.CANCELLED,
            PAYMENT_TRANSACTION_STATUSES.EXPIRED,
        ],

        [PAYMENT_TRANSACTION_STATUSES.PENDING]: [
            PAYMENT_TRANSACTION_STATUSES.PROCESSING,
            PAYMENT_TRANSACTION_STATUSES.SUCCESS,
            PAYMENT_TRANSACTION_STATUSES.FAILED,
            PAYMENT_TRANSACTION_STATUSES.CANCELLED,
            PAYMENT_TRANSACTION_STATUSES.EXPIRED,
        ],

        [PAYMENT_TRANSACTION_STATUSES.PROCESSING]: [
            PAYMENT_TRANSACTION_STATUSES.SUCCESS,
            PAYMENT_TRANSACTION_STATUSES.FAILED,
            PAYMENT_TRANSACTION_STATUSES.CANCELLED,
        ],

        [PAYMENT_TRANSACTION_STATUSES.SUCCESS]: [
            PAYMENT_TRANSACTION_STATUSES.REFUNDED,
            PAYMENT_TRANSACTION_STATUSES.PARTIALLY_REFUNDED,
        ],

        [PAYMENT_TRANSACTION_STATUSES.PARTIALLY_REFUNDED]: [
            PAYMENT_TRANSACTION_STATUSES.REFUNDED,
        ],

        [PAYMENT_TRANSACTION_STATUSES.FAILED]: [],

        [PAYMENT_TRANSACTION_STATUSES.CANCELLED]: [],

        [PAYMENT_TRANSACTION_STATUSES.REFUNDED]: [],

        [PAYMENT_TRANSACTION_STATUSES.EXPIRED]: [],
    };


/*
|--------------------------------------------------------------------------
| Validate Status Transition
|--------------------------------------------------------------------------
*/

export const canTransitionPaymentStatus = (
    currentStatus: PaymentTransactionStatus,
    nextStatus: PaymentTransactionStatus
): boolean => {
    return PAYMENT_STATUS_TRANSITIONS[
        currentStatus
    ].includes(
        nextStatus
    );
};


export const assertPaymentStatusTransition = (
    currentStatus: PaymentTransactionStatus,
    nextStatus: PaymentTransactionStatus
): void => {
    if (
        currentStatus === nextStatus
    ) {
        return;
    }

    if (
        !canTransitionPaymentStatus(
            currentStatus,
            nextStatus
        )
    ) {
        throw ApiError.conflict(
            `Invalid payment status transition: ${currentStatus} → ${nextStatus}`,
            {
                code: "INVALID_PAYMENT_STATUS_TRANSITION",
                details: {
                    currentStatus,
                    nextStatus,
                },
            }
        );
    }
};


/*
|--------------------------------------------------------------------------
| Idempotency Fingerprint
|--------------------------------------------------------------------------
|
| Database-backed idempotency will be implemented later.
| This deterministic fingerprint gives the payment module a stable
| foundation for Redis/database idempotency.
|
|--------------------------------------------------------------------------
*/

export const createPaymentIdempotencyFingerprint = (
    input: CreatePaymentInput
): string => {
    const orderId =
        validateOrderId(
            input.orderId
        );

    const amount =
        validateAmount(
            input.amount
        );

    const currency =
        validateCurrency(
            input.currency
        );

    const method =
        validatePaymentMethod(
            input.method
        );

    const idempotencyKey =
        validateIdempotencyKey(
            input.idempotencyKey
        );

    const payload = JSON.stringify({
        orderId,
        amount,
        currency,
        method,
        idempotencyKey:
            idempotencyKey ?? null,
    });

    return crypto
        .createHash("sha256")
        .update(
            payload,
            "utf8"
        )
        .digest("hex");
};


/*
|--------------------------------------------------------------------------
| Payment Service Health
|--------------------------------------------------------------------------
*/

export interface PaymentServiceHealth {
    readonly configured: boolean;
    readonly healthy: boolean;
    readonly provider: PaymentProvider;
    readonly onlineEnabled: boolean;
    readonly codEnabled: boolean;
    readonly registeredAdapters: readonly PaymentProvider[];
}


export const getPaymentServiceHealth =
    (): PaymentServiceHealth => {
        return {
            configured:
                isPaymentProviderConfigured(),

            healthy:
                isPaymentHealthy(),

            provider:
                getPaymentProvider(),

            onlineEnabled:
                isOnlinePaymentEnabled(),

            codEnabled:
                isCodEnabled(),

            registeredAdapters:
                Array.from(
                    providerAdapters.keys()
                ),
        };
    };


/*
|--------------------------------------------------------------------------
| Payment Configuration Snapshot
|--------------------------------------------------------------------------
*/

export const getPaymentServiceConfig = () => {
    const config =
        getPaymentConfig();

    return Object.freeze({
        provider:
            config.provider,

        currency:
            config.currency,

        requestTimeoutMs:
            config.requestTimeoutMs,

        maxRetries:
            config.maxRetries,

        idempotencyTtlSeconds:
            config.idempotencyTtlSeconds,

        webhookToleranceSeconds:
            config.webhookToleranceSeconds,

        enableCod:
            config.enableCod,

        enableOnline:
            config.enableOnline,

        urls:
            getPaymentUrls(),
    });
};


/*
|--------------------------------------------------------------------------
| Payment Method Snapshot
|--------------------------------------------------------------------------
*/

export const getPaymentMethodAvailability = () => {
    return Object.freeze({
        cod:
            isCodEnabled(),

        online:
            isOnlinePaymentEnabled(),
    });
};


/*
|--------------------------------------------------------------------------
| Payment Provider Snapshot
|--------------------------------------------------------------------------
*/

export const getRegisteredPaymentProviders =
    (): readonly PaymentProvider[] => {
        return Object.freeze(
            Array.from(
                providerAdapters.keys()
            )
        );
    };


/*
|--------------------------------------------------------------------------
| Payment Service Check
|--------------------------------------------------------------------------
*/

export const checkPaymentService = async (): Promise<{
    readonly configured: boolean;
    readonly healthy: boolean;
    readonly provider: PaymentProvider;
    readonly onlineEnabled: boolean;
    readonly codEnabled: boolean;
    readonly adapterAvailable: boolean;
}> => {
    const provider =
        getPaymentProvider();

    const onlineEnabled =
        isOnlinePaymentEnabled();

    const adapterAvailable =
        provider ===
            PAYMENT_PROVIDERS.NONE
            ? true
            : isPaymentProviderAdapterAvailable(
                provider
            );

    return {
        configured:
            isPaymentProviderConfigured(),

        healthy:
            isPaymentHealthy(),

        provider,

        onlineEnabled,

        codEnabled:
            isCodEnabled(),

        adapterAvailable,
    };
};


/*
|--------------------------------------------------------------------------
| Payment Service Initialization
|--------------------------------------------------------------------------
|
| The service itself does not automatically register a gateway adapter.
| Provider adapters can be registered during application bootstrap.
|
|--------------------------------------------------------------------------
*/

export const initializePaymentService =
    (): void => {
        const config =
            getPaymentConfig();

        logger.info(
            {
                provider:
                    config.provider,

                currency:
                    config.currency,

                onlineEnabled:
                    config.enableOnline,

                codEnabled:
                    config.enableCod,

                registeredAdapters:
                    providerAdapters.size,
            },
            "Payment service initialized."
        );
    };