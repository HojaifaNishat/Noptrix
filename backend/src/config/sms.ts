import { env } from "./env";
import { logger } from "../utils/logger";

/*
|--------------------------------------------------------------------------
| SMS Provider Types
|--------------------------------------------------------------------------
*/

export const SMS_PROVIDERS = {
    NONE: "none",
    TWILIO: "twilio",
    VONAGE: "vonage",
    MESSAGEBIRD: "messagebird",
    CUSTOM: "custom",
} as const;

export type SmsProvider =
    (typeof SMS_PROVIDERS)[keyof typeof SMS_PROVIDERS];

/*
|--------------------------------------------------------------------------
| SMS Configuration
|--------------------------------------------------------------------------
|
| Configuration layer only.
|
| Actual SMS sending will be handled later by:
|
| src/services/sms.service.ts
|
|--------------------------------------------------------------------------
*/

export interface SmsConfig {
    readonly provider: SmsProvider;
    readonly apiKey?: string;
    readonly apiSecret?: string;
    readonly from?: string;
}

/*
|--------------------------------------------------------------------------
| Safe SMS Configuration
|--------------------------------------------------------------------------
|
| Never expose provider secrets through the normal config getter.
|
|--------------------------------------------------------------------------
*/

export interface PublicSmsConfig {
    readonly provider: SmsProvider;
    readonly from?: string;
}

/*
|--------------------------------------------------------------------------
| SMS Runtime State
|--------------------------------------------------------------------------
*/

interface SmsRuntimeState {
    configured: boolean;
    healthy: boolean;
}

let smsConfig: SmsConfig =
    Object.freeze({
        provider:
            SMS_PROVIDERS.NONE,
    });

let smsRuntimeState: SmsRuntimeState = {
    configured: false,
    healthy: false,
};

/*
|--------------------------------------------------------------------------
| Normalize Provider
|--------------------------------------------------------------------------
*/

const normalizeProvider = (
    provider?: string
): SmsProvider => {
    if (!provider) {
        return SMS_PROVIDERS.NONE;
    }

    const normalized =
        provider
            .trim()
            .toLowerCase();

    switch (normalized) {
        case SMS_PROVIDERS.TWILIO:
            return SMS_PROVIDERS.TWILIO;

        case SMS_PROVIDERS.VONAGE:
            return SMS_PROVIDERS.VONAGE;

        case SMS_PROVIDERS.MESSAGEBIRD:
            return SMS_PROVIDERS.MESSAGEBIRD;

        case SMS_PROVIDERS.CUSTOM:
            return SMS_PROVIDERS.CUSTOM;

        case SMS_PROVIDERS.NONE:
            return SMS_PROVIDERS.NONE;

        default:
            throw new Error(
                `Unsupported SMS provider: ${provider}`
            );
    }
};

/*
|--------------------------------------------------------------------------
| Validate SMS Configuration
|--------------------------------------------------------------------------
*/

const validateSmsConfiguration =
    (
        provider: SmsProvider
    ): void => {
        if (
            provider ===
            SMS_PROVIDERS.NONE
        ) {
            return;
        }

        if (!env.SMS_API_KEY) {
            throw new Error(
                "SMS_API_KEY is required when SMS provider is configured."
            );
        }

        if (!env.SMS_API_SECRET) {
            throw new Error(
                "SMS_API_SECRET is required when SMS provider is configured."
            );
        }

        if (!env.SMS_FROM) {
            throw new Error(
                "SMS_FROM is required when SMS provider is configured."
            );
        }
    };

/*
|--------------------------------------------------------------------------
| Build SMS Configuration
|--------------------------------------------------------------------------
*/

const buildSmsConfig =
    (): SmsConfig => {
        const provider =
            normalizeProvider(
                env.SMS_PROVIDER
            );

        validateSmsConfiguration(
            provider
        );

        if (
            provider ===
            SMS_PROVIDERS.NONE
        ) {
            return Object.freeze({
                provider:
                    SMS_PROVIDERS.NONE,
            });
        }

        return Object.freeze({
            provider,

            apiKey:
                env.SMS_API_KEY,

            apiSecret:
                env.SMS_API_SECRET,

            from:
                env.SMS_FROM,
        });
    };

/*
|--------------------------------------------------------------------------
| Configure SMS
|--------------------------------------------------------------------------
*/

export const configureSms =
    (): void => {
        const config =
            buildSmsConfig();

        smsConfig = config;

        const configured =
            config.provider !==
            SMS_PROVIDERS.NONE;

        smsRuntimeState = {
            configured,
            /*
            |--------------------------------------------------------------------------
            | Configuration health only.
            |
            | Real provider connectivity verification
            | belongs to sms.service.ts.
            |--------------------------------------------------------------------------
            */

            healthy:
                configured,
        };

        if (!configured) {
            logger.warn(
                "SMS provider is not configured. SMS delivery is unavailable."
            );

            return;
        }

        logger.info(
            {
                provider:
                    config.provider,
                from:
                    config.from,
            },
            "SMS provider configured successfully."
        );
    };

/*
|--------------------------------------------------------------------------
| Get Internal SMS Configuration
|--------------------------------------------------------------------------
|
| Use this only from trusted backend provider/service code.
|
|--------------------------------------------------------------------------
*/

export const getSmsConfig =
    (): SmsConfig => {
        return smsConfig;
    };

/*
|--------------------------------------------------------------------------
| Get Public SMS Configuration
|--------------------------------------------------------------------------
|
| Never exposes:
|
| - apiKey
| - apiSecret
|
|--------------------------------------------------------------------------
*/

export const getPublicSmsConfig =
    (): PublicSmsConfig => {
        return Object.freeze({
            provider:
                smsConfig.provider,

            from:
                smsConfig.from,
        });
    };

/*
|--------------------------------------------------------------------------
| SMS Provider
|--------------------------------------------------------------------------
*/

export const getSmsProvider =
    (): SmsProvider => {
        return smsConfig.provider;
    };

/*
|--------------------------------------------------------------------------
| SMS Availability
|--------------------------------------------------------------------------
*/

export const isSmsConfigured =
    (): boolean => {
        return (
            smsRuntimeState.configured
        );
    };

/*
|--------------------------------------------------------------------------
| SMS Health
|--------------------------------------------------------------------------
*/

export const isSmsHealthy =
    (): boolean => {
        return (
            smsRuntimeState.healthy
        );
    };

/*
|--------------------------------------------------------------------------
| SMS Runtime State
|--------------------------------------------------------------------------
*/

export const getSmsRuntimeState =
    () => {
        return Object.freeze({
            ...smsRuntimeState,
        });
    };

/*
|--------------------------------------------------------------------------
| SMS Provider Checks
|--------------------------------------------------------------------------
*/

export const isSmsProvider =
    (
        provider: SmsProvider
    ): boolean => {
        return (
            smsConfig.provider ===
            provider
        );
    };

/*
|--------------------------------------------------------------------------
| SMS API Credentials
|--------------------------------------------------------------------------
|
| These are intentionally exposed through
| dedicated getters instead of the public
| configuration object.
|
|--------------------------------------------------------------------------
*/

export const getSmsApiKey =
    (): string => {
        if (
            !smsConfig.apiKey
        ) {
            throw new Error(
                "SMS API key is not configured."
            );
        }

        return smsConfig.apiKey;
    };

export const getSmsApiSecret =
    (): string => {
        if (
            !smsConfig.apiSecret
        ) {
            throw new Error(
                "SMS API secret is not configured."
            );
        }

        return smsConfig.apiSecret;
    };

export const getSmsSender =
    (): string => {
        if (!smsConfig.from) {
            throw new Error(
                "SMS sender is not configured."
            );
        }

        return smsConfig.from;
    };