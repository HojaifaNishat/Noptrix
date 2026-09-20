import {
    getMessaging,
    type Message,
    type MulticastMessage,
    type SendResponse,
} from "firebase-admin/messaging";

import {
    getFirebaseApp,
    verifyFirebaseConnection,
    isFirebaseConfiguredStatus,
} from "../config/firebase";

import {
    getPushProvider,
    isPushConfigured,
    refreshPushHealth,
    PUSH_PROVIDERS,
} from "../config/push";

import { logger } from "../utils/logger";

/*
|--------------------------------------------------------------------------
| Push Types
|--------------------------------------------------------------------------
*/

export interface PushNotification {
    readonly title?: string;
    readonly body?: string;
    readonly imageUrl?: string;
}

export interface PushData {
    readonly [key: string]: string;
}

export interface SendPushInput {
    readonly token: string;
    readonly notification?: PushNotification;
    readonly data?: PushData;
}

export interface SendTopicPushInput {
    readonly topic: string;
    readonly notification?: PushNotification;
    readonly data?: PushData;
}

export interface SendMulticastPushInput {
    readonly tokens: readonly string[];
    readonly notification?: PushNotification;
    readonly data?: PushData;
}

export interface PushSendResult {
    readonly success: boolean;
    readonly provider: string;
    readonly messageId?: string;
    readonly token: string;
}

export interface PushMulticastResult {
    readonly success: boolean;
    readonly provider: string;
    readonly successCount: number;
    readonly failureCount: number;
    readonly responses: readonly PushTokenResult[];
}

export interface PushTokenResult {
    readonly token: string;
    readonly success: boolean;
    readonly messageId?: string;
    readonly errorCode?: string;
    readonly errorMessage?: string;
    readonly invalidToken?: boolean;
}

export interface PushTopicResult {
    readonly success: boolean;
    readonly provider: string;
    readonly messageId?: string;
    readonly topic: string;
}

export interface PushServiceHealth {
    readonly configured: boolean;
    readonly healthy: boolean;
    readonly provider: string;
}

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const MAX_TOKEN_LENGTH = 4096;

const MAX_TOPIC_LENGTH = 900;

const MAX_DATA_KEYS = 100;

const MAX_MULTICAST_TOKENS = 500;

/*
|--------------------------------------------------------------------------
| Token Validation
|--------------------------------------------------------------------------
*/

const normalizeToken = (
    token: string
): string => {
    if (
        typeof token !== "string" ||
        !token.trim()
    ) {
        throw new TypeError(
            "Push notification token is required."
        );
    }

    const normalized =
        token.trim();

    if (
        normalized.length >
        MAX_TOKEN_LENGTH
    ) {
        throw new Error(
            "Push notification token is too long."
        );
    }

    return normalized;
};

/*
|--------------------------------------------------------------------------
| Topic Validation
|--------------------------------------------------------------------------
*/

const normalizeTopic = (
    topic: string
): string => {
    if (
        typeof topic !== "string" ||
        !topic.trim()
    ) {
        throw new TypeError(
            "Push notification topic is required."
        );
    }

    const normalized =
        topic.trim();

    if (
        normalized.length >
        MAX_TOPIC_LENGTH
    ) {
        throw new Error(
            "Push notification topic is too long."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Firebase topic names should not contain
    | whitespace or unsupported characters.
    |--------------------------------------------------------------------------
    */

    if (
        !/^[a-zA-Z0-9-_.~%]+$/.test(
            normalized
        )
    ) {
        throw new Error(
            "Invalid Firebase topic name."
        );
    }

    return normalized;
};

/*
|--------------------------------------------------------------------------
| Notification Validation
|--------------------------------------------------------------------------
*/

const normalizeNotification =
    (
        notification?: PushNotification
    ) => {
        if (!notification) {
            return undefined;
        }

        const normalized: {
            title?: string;
            body?: string;
            imageUrl?: string;
        } = {};

        if (
            notification.title !==
            undefined
        ) {
            const title =
                notification.title.trim();

            if (!title) {
                throw new Error(
                    "Push notification title cannot be empty."
                );
            }

            normalized.title =
                title;
        }

        if (
            notification.body !==
            undefined
        ) {
            const body =
                notification.body.trim();

            if (!body) {
                throw new Error(
                    "Push notification body cannot be empty."
                );
            }

            normalized.body =
                body;
        }

        if (
            notification.imageUrl !==
            undefined
        ) {
            const imageUrl =
                notification.imageUrl.trim();

            if (!imageUrl) {
                throw new Error(
                    "Push notification image URL cannot be empty."
                );
            }

            try {
                new URL(imageUrl);
            } catch {
                throw new Error(
                    "Invalid push notification image URL."
                );
            }

            normalized.imageUrl =
                imageUrl;
        }

        return normalized;
    };

/*
|--------------------------------------------------------------------------
| Data Validation
|--------------------------------------------------------------------------
*/

const normalizeData = (
    data?: PushData
): PushData | undefined => {
    if (!data) {
        return undefined;
    }

    const entries =
        Object.entries(data);

    if (
        entries.length >
        MAX_DATA_KEYS
    ) {
        throw new Error(
            `Push data cannot contain more than ${MAX_DATA_KEYS} keys.`
        );
    }

    const normalized: Record<
        string,
        string
    > = {};

    for (
        const [key, value] of entries
    ) {
        if (
            typeof key !== "string" ||
            !key.trim()
        ) {
            throw new Error(
                "Push data keys cannot be empty."
            );
        }

        if (
            typeof value !==
            "string"
        ) {
            throw new TypeError(
                `Push data value for "${key}" must be a string.`
            );
        }

        normalized[key] =
            value;
    }

    return normalized;
};

/*
|--------------------------------------------------------------------------
| Firebase Notification Builder
|--------------------------------------------------------------------------
*/

const buildNotification =
    (
        notification?: PushNotification
    ): Message["notification"] => {
        const normalized =
            normalizeNotification(
                notification
            );

        if (!normalized) {
            return undefined;
        }

        return {
            title:
                normalized.title,
            body:
                normalized.body,
            imageUrl:
                normalized.imageUrl,
        };
    };

/*
|--------------------------------------------------------------------------
| Firebase App Guard
|--------------------------------------------------------------------------
*/

const ensureFirebase =
    async (): Promise<void> => {
        if (
            !isPushConfigured() ||
            getPushProvider() !==
                PUSH_PROVIDERS.FIREBASE
        ) {
            throw new Error(
                "Firebase push notification service is not configured."
            );
        }

        if (
            !isFirebaseConfiguredStatus()
        ) {
            throw new Error(
                "Firebase Admin is not configured."
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Calling this also guarantees Firebase credentials
        | can authenticate successfully.
        |--------------------------------------------------------------------------
        */

        const verified =
            await verifyFirebaseConnection();

        refreshPushHealth();

        if (!verified) {
            throw new Error(
                "Firebase Admin connection could not be verified."
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Ensure application exists.
        |--------------------------------------------------------------------------
        */

        getFirebaseApp();
    };

/*
|--------------------------------------------------------------------------
| Firebase Error Helpers
|--------------------------------------------------------------------------
*/

const getFirebaseErrorCode = (
    error: unknown
): string | undefined => {
    if (
        error &&
        typeof error === "object"
    ) {
        const data =
            error as {
                code?: unknown;
            };

        if (
            typeof data.code ===
            "string"
        ) {
            return data.code;
        }
    }

    return undefined;
};

const getFirebaseErrorMessage = (
    error: unknown
): string => {
    if (
        error instanceof Error
    ) {
        return error.message;
    }

    return String(error);
};

/*
|--------------------------------------------------------------------------
| Invalid Token Detection
|--------------------------------------------------------------------------
*/

const isInvalidTokenError = (
    error: unknown
): boolean => {
    const code =
        getFirebaseErrorCode(
            error
        );

    return (
        code ===
            "messaging/registration-token-not-registered" ||
        code ===
            "messaging/invalid-registration-token"
    );
};

/*
|--------------------------------------------------------------------------
| Send Single Push Notification
|--------------------------------------------------------------------------
*/

export const sendPushNotification =
    async (
        input: SendPushInput
    ): Promise<PushSendResult> => {
        await ensureFirebase();

        if (!input) {
            throw new TypeError(
                "Push notification input is required."
            );
        }

        const token =
            normalizeToken(
                input.token
            );

        const data =
            normalizeData(
                input.data
            );

        const notification =
            buildNotification(
                input.notification
            );

        if (
            !notification &&
            !data
        ) {
            throw new Error(
                "Push notification must contain notification data or custom data."
            );
        }

        const message: Message = {
            token,
            notification,
            data,
        };

        try {
            const messaging =
                getMessaging(
                    getFirebaseApp()
                );

            const messageId =
                await messaging.send(
                    message
                );

            logger.info(
                {
                    provider:
                        PUSH_PROVIDERS.FIREBASE,
                    messageId,
                },
                "Push notification sent successfully."
            );

            return {
                success: true,
                provider:
                    PUSH_PROVIDERS.FIREBASE,
                messageId,
                token,
            };
        } catch (error) {
            logger.error(
                {
                    provider:
                        PUSH_PROVIDERS.FIREBASE,
                    error,
                },
                "Push notification delivery failed."
            );

            throw error;
        }
    };

/*
|--------------------------------------------------------------------------
| Send Data Push
|--------------------------------------------------------------------------
*/

export const sendDataPush =
    async (
        token: string,
        data: PushData
    ): Promise<PushSendResult> => {
        return sendPushNotification({
            token,
            data,
        });
    };

/*
|--------------------------------------------------------------------------
| Send Notification Push
|--------------------------------------------------------------------------
*/

export const sendNotificationPush =
    async (
        token: string,
        notification: PushNotification
    ): Promise<PushSendResult> => {
        return sendPushNotification({
            token,
            notification,
        });
    };

/*
|--------------------------------------------------------------------------
| Send Notification + Data
|--------------------------------------------------------------------------
*/

export const sendNotificationWithData =
    async (
        token: string,
        notification: PushNotification,
        data: PushData
    ): Promise<PushSendResult> => {
        return sendPushNotification({
            token,
            notification,
            data,
        });
    };

/*
|--------------------------------------------------------------------------
| Send Topic Notification
|--------------------------------------------------------------------------
*/

export const sendTopicPush =
    async (
        input: SendTopicPushInput
    ): Promise<PushTopicResult> => {
        await ensureFirebase();

        if (!input) {
            throw new TypeError(
                "Topic push input is required."
            );
        }

        const topic =
            normalizeTopic(
                input.topic
            );

        const data =
            normalizeData(
                input.data
            );

        const notification =
            buildNotification(
                input.notification
            );

        if (
            !notification &&
            !data
        ) {
            throw new Error(
                "Topic push must contain notification data or custom data."
            );
        }

        const message: Message = {
            topic,
            notification,
            data,
        };

        try {
            const messaging =
                getMessaging(
                    getFirebaseApp()
                );

            const messageId =
                await messaging.send(
                    message
                );

            logger.info(
                {
                    topic,
                    messageId,
                },
                "Topic push notification sent successfully."
            );

            return {
                success: true,
                provider:
                    PUSH_PROVIDERS.FIREBASE,
                messageId,
                topic,
            };
        } catch (error) {
            logger.error(
                {
                    topic,
                    error,
                },
                "Topic push notification failed."
            );

            throw error;
        }
    };

/*
|--------------------------------------------------------------------------
| Send Multicast Push
|--------------------------------------------------------------------------
|
| Firebase Admin supports up to 500 registration tokens
| per multicast request.
|
|--------------------------------------------------------------------------
*/

export const sendMulticastPush =
    async (
        input: SendMulticastPushInput
    ): Promise<PushMulticastResult> => {
        await ensureFirebase();

        if (!input) {
            throw new TypeError(
                "Multicast push input is required."
            );
        }

        if (
            !Array.isArray(
                input.tokens
            ) ||
            input.tokens.length === 0
        ) {
            throw new Error(
                "At least one push token is required."
            );
        }

        if (
            input.tokens.length >
            MAX_MULTICAST_TOKENS
        ) {
            throw new Error(
                `A maximum of ${MAX_MULTICAST_TOKENS} tokens can be sent in one multicast request.`
            );
        }

        const tokens =
            input.tokens.map(
                normalizeToken
            );

        const uniqueTokens =
            [
                ...new Set(tokens),
            ];

        const data =
            normalizeData(
                input.data
            );

        const notification =
            buildNotification(
                input.notification
            );

        if (
            !notification &&
            !data
        ) {
            throw new Error(
                "Multicast push must contain notification data or custom data."
            );
        }

        const message: MulticastMessage =
            {
                tokens:
                    uniqueTokens,
                notification,
                data,
            };

        try {
            const messaging =
                getMessaging(
                    getFirebaseApp()
                );

            const response =
                await messaging.sendEachForMulticast(
                    message
                );

            const responses =
                response.responses.map(
                    (
                        result: SendResponse,
                        index: number
                    ): PushTokenResult => {
                        const token =
                            uniqueTokens[
                                index
                            ];

                        if (
                            result.success
                        ) {
                            return {
                                token,
                                success:
                                    true,
                                messageId:
                                    result.messageId,
                            };
                        }

                        const error =
                            result.error;

                        return {
                            token,
                            success:
                                false,
                            errorCode:
                                getFirebaseErrorCode(
                                    error
                                ),
                            errorMessage:
                                getFirebaseErrorMessage(
                                    error
                                ),
                            invalidToken:
                                isInvalidTokenError(
                                    error
                                ),
                        };
                    }
                );

            logger.info(
                {
                    total:
                        uniqueTokens.length,
                    successCount:
                        response.successCount,
                    failureCount:
                        response.failureCount,
                },
                "Multicast push operation completed."
            );

            return {
                success:
                    response.successCount >
                    0,
                provider:
                    PUSH_PROVIDERS.FIREBASE,
                successCount:
                    response.successCount,
                failureCount:
                    response.failureCount,
                responses,
            };
        } catch (error) {
            logger.error(
                {
                    error,
                },
                "Multicast push operation failed."
            );

            throw error;
        }
    };

/*
|--------------------------------------------------------------------------
| Send To Multiple Tokens
|--------------------------------------------------------------------------
|
| Automatically chunks tokens into Firebase's 500-token
| multicast limit.
|
|--------------------------------------------------------------------------
*/

export const sendPushToMany =
    async (
        tokens: readonly string[],
        notification?: PushNotification,
        data?: PushData
    ): Promise<PushMulticastResult[]> => {
        if (
            !Array.isArray(tokens) ||
            tokens.length === 0
        ) {
            throw new Error(
                "At least one push token is required."
            );
        }

        const normalizedTokens =
            [
                ...new Set(
                    tokens.map(
                        normalizeToken
                    )
                ),
            ];

        const results: PushMulticastResult[] =
            [];

        for (
            let index = 0;
            index <
            normalizedTokens.length;
            index += MAX_MULTICAST_TOKENS
        ) {
            const chunk =
                normalizedTokens.slice(
                    index,
                    index +
                        MAX_MULTICAST_TOKENS
                );

            const result =
                await sendMulticastPush({
                    tokens: chunk,
                    notification,
                    data,
                });

            results.push(
                result
            );
        }

        return results;
    };

/*
|--------------------------------------------------------------------------
| Send Order Notification
|--------------------------------------------------------------------------
|
| Reusable application-level helper.
|--------------------------------------------------------------------------
*/

export const sendOrderPush =
    async (
        token: string,
        title: string,
        body: string,
        orderId: string,
        status: string
    ): Promise<PushSendResult> => {
        return sendNotificationWithData(
            token,
            {
                title,
                body,
            },
            {
                type: "order",
                orderId,
                status,
            }
        );
    };

/*
|--------------------------------------------------------------------------
| Send Generic Application Notification
|--------------------------------------------------------------------------
*/

export const sendAppPush =
    async (
        token: string,
        title: string,
        body: string,
        data?: PushData
    ): Promise<PushSendResult> => {
        return sendPushNotification({
            token,
            notification: {
                title,
                body,
            },
            data,
        });
    };

/*
|--------------------------------------------------------------------------
| Verify Push Service
|--------------------------------------------------------------------------
*/

export const verifyPushService =
    async (): Promise<boolean> => {
        if (
            !isPushConfigured()
        ) {
            logger.warn(
                "Push service verification skipped because push provider is not configured."
            );

            return false;
        }

        if (
            getPushProvider() !==
            PUSH_PROVIDERS.FIREBASE
        ) {
            return false;
        }

        const verified =
            await verifyFirebaseConnection();

        refreshPushHealth();

        return verified;
    };

/*
|--------------------------------------------------------------------------
| Push Service Health
|--------------------------------------------------------------------------
*/

export const checkPushService =
    async (): Promise<PushServiceHealth> => {
        const configured =
            isPushConfigured();

        if (!configured) {
            return {
                configured: false,
                healthy: false,
                provider:
                    PUSH_PROVIDERS.NONE,
            };
        }

        const healthy =
            await verifyPushService();

        return {
            configured: true,
            healthy,
            provider:
                getPushProvider(),
        };
    };