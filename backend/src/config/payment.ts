import { env } from "./env";
import { logger } from "../utils/logger";

/*
|--------------------------------------------------------------------------
| Payment Providers
|--------------------------------------------------------------------------
*/

export const PAYMENT_PROVIDERS = {
    NONE: "none",
    SSLCOMMERZ: "sslcommerz",
    STRIPE: "stripe",
    PAYPAL: "paypal",
    RAZORPAY: "razorpay",
    CUSTOM: "custom",
} as const;

export type PaymentProvider =
    (typeof PAYMENT_PROVIDERS)[keyof typeof PAYMENT_PROVIDERS];

/*
|--------------------------------------------------------------------------
| Payment Methods
|--------------------------------------------------------------------------
*/

export const PAYMENT_METHODS = {
    COD: "cod",
    ONLINE: "online",
} as const;

export type PaymentMethod =
    (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

/*
|--------------------------------------------------------------------------
| Payment Configuration
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Sensitive secrets are intentionally NOT exposed through the
| general payment configuration object.
|
|--------------------------------------------------------------------------
*/

export interface PaymentConfig {
    readonly provider: PaymentProvider;

    readonly currency: string;

    readonly requestTimeoutMs: number;

    readonly maxRetries: number;

    readonly idempotencyTtlSeconds: number;

    readonly webhookToleranceSeconds: number;

    readonly enableCod: boolean;

    readonly enableOnline: boolean;

    readonly successUrl?: string;

    readonly cancelUrl?: string;

    readonly failUrl?: string;

    readonly ipnUrl?: string;
}

/*
|--------------------------------------------------------------------------
| Payment Runtime State
|--------------------------------------------------------------------------
*/

interface PaymentRuntimeState {
    configured: boolean;
    healthy: boolean;
}

let paymentRuntimeState:
    PaymentRuntimeState = {
        configured: false,
        healthy: false,
    };

/*
|--------------------------------------------------------------------------
| Provider Normalization
|--------------------------------------------------------------------------
*/

const normalizeProvider = (
    provider?: string
): PaymentProvider => {
    if (!provider) {
        return PAYMENT_PROVIDERS.NONE;
    }

    const normalized =
        provider.trim().toLowerCase();

    switch (normalized) {
        case PAYMENT_PROVIDERS.SSLCOMMERZ:
            return PAYMENT_PROVIDERS.SSLCOMMERZ;

        case PAYMENT_PROVIDERS.STRIPE:
            return PAYMENT_PROVIDERS.STRIPE;

        case PAYMENT_PROVIDERS.PAYPAL:
            return PAYMENT_PROVIDERS.PAYPAL;

        case PAYMENT_PROVIDERS.RAZORPAY:
            return PAYMENT_PROVIDERS.RAZORPAY;

        case PAYMENT_PROVIDERS.CUSTOM:
            return PAYMENT_PROVIDERS.CUSTOM;

        case PAYMENT_PROVIDERS.NONE:
            return PAYMENT_PROVIDERS.NONE;

        default:
            throw new Error(
                `Unsupported payment provider: ${provider}`
            );
    }
};

/*
|--------------------------------------------------------------------------
| Provider Configuration Validation
|--------------------------------------------------------------------------
*/

const validateProviderConfiguration = (
    provider: PaymentProvider
): void => {
    /*
    |--------------------------------------------------------------------------
    | No Provider
    |--------------------------------------------------------------------------
    */

    if (
        provider ===
        PAYMENT_PROVIDERS.NONE
    ) {
        return;
    }

    /*
    |--------------------------------------------------------------------------
    | Webhook Secret
    |--------------------------------------------------------------------------
    */

    if (!env.PAYMENT_WEBHOOK_SECRET) {
        throw new Error(
            "PAYMENT_WEBHOOK_SECRET is required when online payment is enabled."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Webhook Secret Strength
    |--------------------------------------------------------------------------
    */

    if (
        env.PAYMENT_WEBHOOK_SECRET.length <
        16
    ) {
        throw new Error(
            "PAYMENT_WEBHOOK_SECRET must contain at least 16 characters."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Webhook Endpoint
    |--------------------------------------------------------------------------
    */

    if (!env.PAYMENT_IPN_URL) {
        throw new Error(
            "PAYMENT_IPN_URL is required when online payment is enabled."
        );
    }
};

/*
|--------------------------------------------------------------------------
| Build Payment Configuration
|--------------------------------------------------------------------------
*/

const buildPaymentConfig =
    (): PaymentConfig => {
        const provider =
            normalizeProvider(
                env.PAYMENT_PROVIDER
            );

        /*
        |--------------------------------------------------------------------------
        | Online Payment Safety
        |--------------------------------------------------------------------------
        */

        if (
            env.PAYMENT_ENABLE_ONLINE &&
            provider ===
                PAYMENT_PROVIDERS.NONE
        ) {
            throw new Error(
                "PAYMENT_ENABLE_ONLINE=true requires PAYMENT_PROVIDER."
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Provider Validation
        |--------------------------------------------------------------------------
        */

        if (
            env.PAYMENT_ENABLE_ONLINE
        ) {
            validateProviderConfiguration(
                provider
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Production URL Validation
        |--------------------------------------------------------------------------
        */

        if (
            env.NODE_ENV === "production" &&
            env.PAYMENT_ENABLE_ONLINE
        ) {
            if (
                !env.PAYMENT_SUCCESS_URL ||
                !env.PAYMENT_CANCEL_URL ||
                !env.PAYMENT_FAIL_URL
            ) {
                throw new Error(
                    "Production online payments require PAYMENT_SUCCESS_URL, PAYMENT_CANCEL_URL and PAYMENT_FAIL_URL."
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Build Immutable Configuration
        |--------------------------------------------------------------------------
        */

        return Object.freeze({
            provider,

            currency:
                env.PAYMENT_CURRENCY,

            requestTimeoutMs:
                env.PAYMENT_REQUEST_TIMEOUT_MS,

            maxRetries:
                env.PAYMENT_MAX_RETRIES,

            idempotencyTtlSeconds:
                env.PAYMENT_IDEMPOTENCY_TTL_SECONDS,

            webhookToleranceSeconds:
                env.PAYMENT_WEBHOOK_TOLERANCE_SECONDS,

            enableCod:
                env.PAYMENT_ENABLE_COD,

            enableOnline:
                env.PAYMENT_ENABLE_ONLINE,

            successUrl:
                env.PAYMENT_SUCCESS_URL,

            cancelUrl:
                env.PAYMENT_CANCEL_URL,

            failUrl:
                env.PAYMENT_FAIL_URL,

            ipnUrl:
                env.PAYMENT_IPN_URL,
        });
    };

/*
|--------------------------------------------------------------------------
| Runtime Configuration
|--------------------------------------------------------------------------
*/

let paymentConfig: PaymentConfig =
    Object.freeze({
        provider:
            PAYMENT_PROVIDERS.NONE,

        currency:
            env.PAYMENT_CURRENCY,

        requestTimeoutMs:
            env.PAYMENT_REQUEST_TIMEOUT_MS,

        maxRetries:
            env.PAYMENT_MAX_RETRIES,

        idempotencyTtlSeconds:
            env.PAYMENT_IDEMPOTENCY_TTL_SECONDS,

        webhookToleranceSeconds:
            env.PAYMENT_WEBHOOK_TOLERANCE_SECONDS,

        enableCod:
            env.PAYMENT_ENABLE_COD,

        enableOnline:
            env.PAYMENT_ENABLE_ONLINE,

        successUrl:
            env.PAYMENT_SUCCESS_URL,

        cancelUrl:
            env.PAYMENT_CANCEL_URL,

        failUrl:
            env.PAYMENT_FAIL_URL,

        ipnUrl:
            env.PAYMENT_IPN_URL,
    });

/*
|--------------------------------------------------------------------------
| Configure Payment
|--------------------------------------------------------------------------
*/

export const configurePayment =
    (): void => {
        paymentConfig =
            buildPaymentConfig();

        const onlineEnabled =
            paymentConfig.enableOnline;

        const providerConfigured =
            paymentConfig.provider !==
            PAYMENT_PROVIDERS.NONE;

        paymentRuntimeState = {
            configured:
                onlineEnabled
                    ? providerConfigured
                    : true,

            /*
            |--------------------------------------------------------------------------
            | Config health only.
            |
            | Actual provider connectivity will be verified later
            | by payment.service/provider adapters.
            |--------------------------------------------------------------------------
            */

            healthy:
                onlineEnabled
                    ? providerConfigured
                    : true,
        };

        /*
        |--------------------------------------------------------------------------
        | Logging
        |--------------------------------------------------------------------------
        |
        | NEVER log webhook secrets or provider credentials.
        |--------------------------------------------------------------------------
        */

        if (!onlineEnabled) {
            logger.info(
                {
                    provider:
                        paymentConfig.provider,

                    currency:
                        paymentConfig.currency,

                    cod:
                        paymentConfig.enableCod,
                },
                "Online payment processing is disabled."
            );

            return;
        }

        logger.info(
            {
                provider:
                    paymentConfig.provider,

                currency:
                    paymentConfig.currency,

                onlinePayment:
                    paymentConfig.enableOnline,

                cod:
                    paymentConfig.enableCod,
            },
            "Payment configuration initialized."
        );
    };

/*
|--------------------------------------------------------------------------
| Get Payment Configuration
|--------------------------------------------------------------------------
*/

export const getPaymentConfig =
    (): PaymentConfig => {
        return paymentConfig;
    };

/*
|--------------------------------------------------------------------------
| Get Payment Provider
|--------------------------------------------------------------------------
*/

export const getPaymentProvider =
    (): PaymentProvider => {
        return paymentConfig.provider;
    };

/*
|--------------------------------------------------------------------------
| Get Currency
|--------------------------------------------------------------------------
*/

export const getPaymentCurrency =
    (): string => {
        return paymentConfig.currency;
    };

/*
|--------------------------------------------------------------------------
| Provider Availability
|--------------------------------------------------------------------------
*/

export const isPaymentProviderConfigured =
    (): boolean => {
        return (
            paymentConfig.provider !==
            PAYMENT_PROVIDERS.NONE
        );
    };

/*
|--------------------------------------------------------------------------
| Online Payment Availability
|--------------------------------------------------------------------------
*/

export const isOnlinePaymentEnabled =
    (): boolean => {
        return (
            paymentConfig.enableOnline &&
            isPaymentProviderConfigured()
        );
    };

/*
|--------------------------------------------------------------------------
| Cash On Delivery Availability
|--------------------------------------------------------------------------
*/

export const isCodEnabled =
    (): boolean => {
        return paymentConfig.enableCod;
    };

/*
|--------------------------------------------------------------------------
| Payment Method Availability
|--------------------------------------------------------------------------
*/

export const isPaymentMethodEnabled = (
    method: PaymentMethod
): boolean => {
    switch (method) {
        case PAYMENT_METHODS.COD:
            return isCodEnabled();

        case PAYMENT_METHODS.ONLINE:
            return isOnlinePaymentEnabled();

        default:
            return false;
    }
};

/*
|--------------------------------------------------------------------------
| Payment Webhook Secret
|--------------------------------------------------------------------------
|
| Sensitive value.
| Only webhook verification infrastructure should use this.
|
|--------------------------------------------------------------------------
*/

export const getPaymentWebhookSecret =
    (): string => {
        if (
            !paymentConfig.enableOnline ||
            !env.PAYMENT_WEBHOOK_SECRET
        ) {
            throw new Error(
                "Payment webhook secret is not available."
            );
        }

        return env.PAYMENT_WEBHOOK_SECRET;
    };

/*
|--------------------------------------------------------------------------
| Payment URLs
|--------------------------------------------------------------------------
*/

export const getPaymentUrls = () => {
    return Object.freeze({
        successUrl:
            paymentConfig.successUrl,

        cancelUrl:
            paymentConfig.cancelUrl,

        failUrl:
            paymentConfig.failUrl,

        ipnUrl:
            paymentConfig.ipnUrl,
    });
};

/*
|--------------------------------------------------------------------------
| Payment Runtime State
|--------------------------------------------------------------------------
*/

export const getPaymentRuntimeState =
    (): Readonly<PaymentRuntimeState> => {
        return Object.freeze({
            ...paymentRuntimeState,
        });
    };

/*
|--------------------------------------------------------------------------
| Payment Health
|--------------------------------------------------------------------------
*/

export const isPaymentHealthy =
    (): boolean => {
        return paymentRuntimeState.healthy;
    };