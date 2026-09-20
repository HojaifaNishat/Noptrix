import {
    getFirebasePublicConfig,
    isFirebaseConfiguredStatus,
    isFirebaseHealthy,
} from "./firebase";

import { logger } from "../utils/logger";

/*
|--------------------------------------------------------------------------
| Push Providers
|--------------------------------------------------------------------------
*/

export const PUSH_PROVIDERS = {
    NONE: "none",
    FIREBASE: "firebase",
    CUSTOM: "custom",
} as const;

export type PushProvider =
    (typeof PUSH_PROVIDERS)[keyof typeof PUSH_PROVIDERS];

/*
|--------------------------------------------------------------------------
| Push Configuration
|--------------------------------------------------------------------------
*/

export interface PushConfig {
    readonly provider: PushProvider;
}

/*
|--------------------------------------------------------------------------
| Public Push Configuration
|--------------------------------------------------------------------------
*/

export interface PublicPushConfig {
    readonly provider: PushProvider;
    readonly firebase:
        ReturnType<
            typeof getFirebasePublicConfig
        >;
}

/*
|--------------------------------------------------------------------------
| Runtime State
|--------------------------------------------------------------------------
*/

interface PushRuntimeState {
    configured: boolean;
    healthy: boolean;
}

/*
|--------------------------------------------------------------------------
| Internal State
|--------------------------------------------------------------------------
*/

let pushConfig: PushConfig =
    Object.freeze({
        provider:
            PUSH_PROVIDERS.NONE,
    });

let pushRuntimeState: PushRuntimeState = {
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
): PushProvider => {
    if (!provider) {
        return PUSH_PROVIDERS.NONE;
    }

    const normalized =
        provider
            .trim()
            .toLowerCase();

    switch (normalized) {
        case PUSH_PROVIDERS.FIREBASE:
            return PUSH_PROVIDERS.FIREBASE;

        case PUSH_PROVIDERS.CUSTOM:
            return PUSH_PROVIDERS.CUSTOM;

        case PUSH_PROVIDERS.NONE:
            return PUSH_PROVIDERS.NONE;

        default:
            throw new Error(
                `Unsupported push provider: ${provider}`
            );
    }
};

/*
|--------------------------------------------------------------------------
| Build Push Configuration
|--------------------------------------------------------------------------
*/

const buildPushConfig =
    (): PushConfig => {
        /*
        |--------------------------------------------------------------------------
        | NOPTRIX currently uses Firebase
        |--------------------------------------------------------------------------
        |
        | Firebase credentials are managed exclusively by
        | config/firebase.ts.
        |
        |--------------------------------------------------------------------------
        */

        const firebaseConfigured =
            isFirebaseConfiguredStatus();

        if (
            firebaseConfigured
        ) {
            return Object.freeze({
                provider:
                    PUSH_PROVIDERS.FIREBASE,
            });
        }

        return Object.freeze({
            provider:
                PUSH_PROVIDERS.NONE,
        });
    };

/*
|--------------------------------------------------------------------------
| Configure Push
|--------------------------------------------------------------------------
*/

export const configurePush =
    (): void => {
        const config =
            buildPushConfig();

        pushConfig = config;

        const configured =
            config.provider !==
            PUSH_PROVIDERS.NONE;

        pushRuntimeState = {
            configured,

            /*
            |--------------------------------------------------------------------------
            | This represents configuration health only.
            |
            | Real Firebase connectivity verification is performed
            | by push.service.ts.
            |--------------------------------------------------------------------------
            */

            healthy:
                configured &&
                isFirebaseHealthy(),
        };

        if (!configured) {
            logger.warn(
                "Push notification provider is not configured. Push delivery is unavailable."
            );

            return;
        }

        logger.info(
            {
                provider:
                    config.provider,
            },
            "Push notification provider configured successfully."
        );
    };

/*
|--------------------------------------------------------------------------
| Get Internal Push Configuration
|--------------------------------------------------------------------------
*/

export const getPushConfig =
    (): PushConfig => {
        return pushConfig;
    };

/*
|--------------------------------------------------------------------------
| Get Public Push Configuration
|--------------------------------------------------------------------------
*/

export const getPublicPushConfig =
    (): PublicPushConfig => {
        return Object.freeze({
            provider:
                pushConfig.provider,

            firebase:
                getFirebasePublicConfig(),
        });
    };

/*
|--------------------------------------------------------------------------
| Get Push Provider
|--------------------------------------------------------------------------
*/

export const getPushProvider =
    (): PushProvider => {
        return pushConfig.provider;
    };

/*
|--------------------------------------------------------------------------
| Push Availability
|--------------------------------------------------------------------------
*/

export const isPushConfigured =
    (): boolean => {
        return (
            pushRuntimeState.configured
        );
    };

/*
|--------------------------------------------------------------------------
| Push Health
|--------------------------------------------------------------------------
*/

export const isPushHealthy =
    (): boolean => {
        return (
            pushRuntimeState.healthy
        );
    };

/*
|--------------------------------------------------------------------------
| Push Runtime State
|--------------------------------------------------------------------------
*/

export const getPushRuntimeState =
    () => {
        return Object.freeze({
            ...pushRuntimeState,
        });
    };

/*
|--------------------------------------------------------------------------
| Provider Check
|--------------------------------------------------------------------------
*/

export const isPushProvider =
    (
        provider: PushProvider
    ): boolean => {
        return (
            pushConfig.provider ===
            provider
        );
    };

/*
|--------------------------------------------------------------------------
| Firebase Availability
|--------------------------------------------------------------------------
*/

export const isFirebasePushConfigured =
    (): boolean => {
        return (
            pushConfig.provider ===
                PUSH_PROVIDERS.FIREBASE &&
            isFirebaseConfiguredStatus()
        );
    };

/*
|--------------------------------------------------------------------------
| Refresh Runtime Health
|--------------------------------------------------------------------------
|
| Useful after Firebase connection verification.
|
|--------------------------------------------------------------------------
*/

export const refreshPushHealth =
    (): void => {
        if (
            pushConfig.provider !==
            PUSH_PROVIDERS.FIREBASE
        ) {
            pushRuntimeState = {
                configured: false,
                healthy: false,
            };

            return;
        }

        pushRuntimeState = {
            configured:
                isFirebaseConfiguredStatus(),

            healthy:
                isFirebaseHealthy(),
        };
    };

/*
|--------------------------------------------------------------------------
| Normalize Provider Export
|--------------------------------------------------------------------------
|
| Kept exported for future provider-aware
| initialization logic.
|
|--------------------------------------------------------------------------
*/

export const resolvePushProvider =
    (
        provider?: string
    ): PushProvider => {
        return normalizeProvider(
            provider
        );
    };