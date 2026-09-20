import {
    getSmsApiKey,
    getSmsApiSecret,
    getSmsProvider,
    getSmsSender,
    isSmsConfigured,
    isSmsHealthy,
    SMS_PROVIDERS,
    type SmsProvider,
} from "../config/sms";

import { logger } from "../utils/logger";

/*
|--------------------------------------------------------------------------
| SMS Types
|--------------------------------------------------------------------------
*/

export interface SendSmsInput {
    readonly to: string;
    readonly message: string;
}

export interface SmsSendResult {
    readonly success: boolean;
    readonly provider: SmsProvider;
    readonly messageId?: string;
    readonly to: string;
    readonly response?: unknown;
}

export interface BulkSmsItem {
    readonly to: string;
    readonly message: string;
}

export interface BulkSmsResult {
    readonly total: number;
    readonly successful: number;
    readonly failed: number;
    readonly results: readonly SmsSendResult[];
    readonly errors: readonly {
        readonly index: number;
        readonly to: string;
        readonly error: unknown;
    }[];
}

export interface SmsServiceHealth {
    readonly configured: boolean;
    readonly healthy: boolean;
    readonly provider: SmsProvider;
}

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const MAX_PHONE_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 1600;
const DEFAULT_BULK_CONCURRENCY = 3;

const REQUEST_TIMEOUT_MS = 15_000;

/*
|--------------------------------------------------------------------------
| Phone Number Validation
|--------------------------------------------------------------------------
|
| Backend accepts international/E.164-style numbers.
|
| Examples:
|
| +8801712345678
| +966501234567
| +14155552671
|
|--------------------------------------------------------------------------
*/

const normalizePhoneNumber = (
    phone: string
): string => {
    if (
        typeof phone !== "string" ||
        !phone.trim()
    ) {
        throw new TypeError(
            "Recipient phone number is required."
        );
    }

    const normalized =
        phone.trim().replace(
            /[\s()-]/g,
            ""
        );

    if (
        normalized.length >
        MAX_PHONE_LENGTH
    ) {
        throw new Error(
            "Recipient phone number is too long."
        );
    }

    if (
        !/^\+[1-9]\d{7,14}$/.test(
            normalized
        )
    ) {
        throw new Error(
            "Invalid phone number. Use international format, for example +8801712345678."
        );
    }

    return normalized;
};

/*
|--------------------------------------------------------------------------
| Message Validation
|--------------------------------------------------------------------------
*/

const validateMessage = (
    message: string
): string => {
    if (
        typeof message !== "string" ||
        !message.trim()
    ) {
        throw new TypeError(
            "SMS message is required."
        );
    }

    const normalized =
        message.trim();

    if (
        normalized.length >
        MAX_MESSAGE_LENGTH
    ) {
        throw new Error(
            `SMS message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`
        );
    }

    return normalized;
};

/*
|--------------------------------------------------------------------------
| Input Validation
|--------------------------------------------------------------------------
*/

const validateSmsInput = (
    input: SendSmsInput
): {
    to: string;
    message: string;
} => {
    if (!input) {
        throw new TypeError(
            "SMS input is required."
        );
    }

    return {
        to: normalizePhoneNumber(
            input.to
        ),
        message: validateMessage(
            input.message
        ),
    };
};

/*
|--------------------------------------------------------------------------
| Request Timeout
|--------------------------------------------------------------------------
*/

const fetchWithTimeout = async (
    url: string,
    options: RequestInit
): Promise<Response> => {
    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () =>
                controller.abort(),
            REQUEST_TIMEOUT_MS
        );

    try {
        return await fetch(
            url,
            {
                ...options,
                signal:
                    controller.signal,
            }
        );
    } finally {
        clearTimeout(timeout);
    }
};

/*
|--------------------------------------------------------------------------
| Safe Response Parser
|--------------------------------------------------------------------------
*/

const parseProviderResponse =
    async (
        response: Response
    ): Promise<unknown> => {
        const contentType =
            response.headers.get(
                "content-type"
            ) ?? "";

        if (
            contentType.includes(
                "application/json"
            )
        ) {
            try {
                return await response.json();
            } catch {
                return null;
            }
        }

        try {
            return await response.text();
        } catch {
            return null;
        }
    };

/*
|--------------------------------------------------------------------------
| Extract Message ID
|--------------------------------------------------------------------------
|
| Providers use different response structures.
|
|--------------------------------------------------------------------------
*/

const extractMessageId = (
    response: unknown
): string | undefined => {
    if (
        !response ||
        typeof response !== "object"
    ) {
        return undefined;
    }

    const data =
        response as Record<
            string,
            unknown
        >;

    if (
        typeof data.message_uuid ===
        "string"
    ) {
        return data.message_uuid;
    }

    if (
        typeof data.messageId ===
        "string"
    ) {
        return data.messageId;
    }

    if (
        typeof data.message_id ===
        "string"
    ) {
        return data.message_id;
    }

    if (
        typeof data.id ===
        "string"
    ) {
        return data.id;
    }

    /*
    |--------------------------------------------------------------------------
    | Vonage response:
    |
    | messages: [
    |   {
    |       "message-id": "..."
    |   }
    | ]
    |--------------------------------------------------------------------------
    */

    if (
        Array.isArray(data.messages) &&
        data.messages.length > 0
    ) {
        const first =
            data.messages[0];

        if (
            first &&
            typeof first ===
                "object"
        ) {
            const message =
                first as Record<
                    string,
                    unknown
                >;

            if (
                typeof message[
                    "message-id"
                ] === "string"
            ) {
                return message[
                    "message-id"
                ] as string;
            }
        }
    }

    return undefined;
};

/*
|--------------------------------------------------------------------------
| Provider Error
|--------------------------------------------------------------------------
*/

const createProviderError =
    (
        provider: SmsProvider,
        status: number,
        response: unknown
    ): Error => {
        const error =
            new Error(
                `SMS provider "${provider}" rejected the request with HTTP ${status}.`
            );

        Object.assign(
            error,
            {
                provider,
                status,
                response,
            }
        );

        return error;
    };

/*
|--------------------------------------------------------------------------
| Twilio
|--------------------------------------------------------------------------
|
| Config mapping:
|
| SMS_API_KEY
|     -> Account SID
|
| SMS_API_SECRET
|     -> Auth Token
|
| SMS_FROM
|     -> Twilio phone number
|
|--------------------------------------------------------------------------
*/

const sendViaTwilio =
    async (
        to: string,
        message: string
    ): Promise<SmsSendResult> => {
        const accountSid =
            getSmsApiKey();

        const authToken =
            getSmsApiSecret();

        const from =
            getSmsSender();

        const endpoint =
            `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(
                accountSid
            )}/Messages.json`;

        const body =
            new URLSearchParams();

        body.set(
            "To",
            to
        );

        body.set(
            "From",
            from
        );

        body.set(
            "Body",
            message
        );

        const credentials =
            Buffer.from(
                `${accountSid}:${authToken}`
            ).toString(
                "base64"
            );

        const response =
            await fetchWithTimeout(
                endpoint,
                {
                    method: "POST",
                    headers: {
                        Authorization:
                            `Basic ${credentials}`,
                        "Content-Type":
                            "application/x-www-form-urlencoded",
                    },
                    body,
                }
            );

        const data =
            await parseProviderResponse(
                response
            );

        if (!response.ok) {
            throw createProviderError(
                SMS_PROVIDERS.TWILIO,
                response.status,
                data
            );
        }

        return {
            success: true,
            provider:
                SMS_PROVIDERS.TWILIO,
            messageId:
                extractMessageId(
                    data
                ),
            to,
            response: data,
        };
    };

/*
|--------------------------------------------------------------------------
| Vonage
|--------------------------------------------------------------------------
|
| Config mapping:
|
| SMS_API_KEY
|     -> Vonage API Key
|
| SMS_API_SECRET
|     -> Vonage API Secret
|
| SMS_FROM
|     -> Sender ID
|
|--------------------------------------------------------------------------
*/

const sendViaVonage =
    async (
        to: string,
        message: string
    ): Promise<SmsSendResult> => {
        const apiKey =
            getSmsApiKey();

        const apiSecret =
            getSmsApiSecret();

        const from =
            getSmsSender();

        const body =
            new URLSearchParams();

        body.set(
            "api_key",
            apiKey
        );

        body.set(
            "api_secret",
            apiSecret
        );

        body.set(
            "from",
            from
        );

        body.set(
            "to",
            to
        );

        body.set(
            "text",
            message
        );

        const response =
            await fetchWithTimeout(
                "https://rest.nexmo.com/sms/json",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded",
                    },
                    body,
                }
            );

        const data =
            await parseProviderResponse(
                response
            );

        if (!response.ok) {
            throw createProviderError(
                SMS_PROVIDERS.VONAGE,
                response.status,
                data
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Vonage can return HTTP 200 while
        | an individual message failed.
        |--------------------------------------------------------------------------
        */

        if (
            data &&
            typeof data ===
                "object"
        ) {
            const payload =
                data as Record<
                    string,
                    unknown
                >;

            if (
                Array.isArray(
                    payload.messages
                )
            ) {
                const first =
                    payload.messages[0];

                if (
                    first &&
                    typeof first ===
                        "object"
                ) {
                    const messageData =
                        first as Record<
                            string,
                            unknown
                        >;

                    const status =
                        String(
                            messageData.status ??
                                "0"
                        );

                    if (
                        status !== "0"
                    ) {
                        throw createProviderError(
                            SMS_PROVIDERS.VONAGE,
                            response.status,
                            data
                        );
                    }
                }
            }
        }

        return {
            success: true,
            provider:
                SMS_PROVIDERS.VONAGE,
            messageId:
                extractMessageId(
                    data
                ),
            to,
            response: data,
        };
    };

/*
|--------------------------------------------------------------------------
| MessageBird
|--------------------------------------------------------------------------
|
| Config mapping:
|
| SMS_API_KEY
|     -> Access Key
|
| SMS_API_SECRET
|     -> Reserved by shared config contract
|
| SMS_FROM
|     -> Originator
|
|--------------------------------------------------------------------------
*/

const sendViaMessageBird =
    async (
        to: string,
        message: string
    ): Promise<SmsSendResult> => {
        const accessKey =
            getSmsApiKey();

        const originator =
            getSmsSender();

        const response =
            await fetchWithTimeout(
                "https://rest.messagebird.com/messages",
                {
                    method: "POST",
                    headers: {
                        Authorization:
                            `AccessKey ${accessKey}`,
                        "Content-Type":
                            "application/json",
                        Accept:
                            "application/json",
                    },
                    body:
                        JSON.stringify({
                            originator,
                            recipients: [
                                to,
                            ],
                            body: message,
                        }),
                }
            );

        const data =
            await parseProviderResponse(
                response
            );

        if (!response.ok) {
            throw createProviderError(
                SMS_PROVIDERS.MESSAGEBIRD,
                response.status,
                data
            );
        }

        return {
            success: true,
            provider:
                SMS_PROVIDERS.MESSAGEBIRD,
            messageId:
                extractMessageId(
                    data
                ),
            to,
            response: data,
        };
    };

/*
|--------------------------------------------------------------------------
| Provider Dispatcher
|--------------------------------------------------------------------------
*/

const sendThroughProvider =
    async (
        provider: SmsProvider,
        to: string,
        message: string
    ): Promise<SmsSendResult> => {
        switch (provider) {
            case SMS_PROVIDERS.TWILIO:
                return sendViaTwilio(
                    to,
                    message
                );

            case SMS_PROVIDERS.VONAGE:
                return sendViaVonage(
                    to,
                    message
                );

            case SMS_PROVIDERS.MESSAGEBIRD:
                return sendViaMessageBird(
                    to,
                    message
                );

            case SMS_PROVIDERS.CUSTOM:
                throw new Error(
                    "Custom SMS provider is configured but no custom transport implementation has been registered."
                );

            case SMS_PROVIDERS.NONE:
            default:
                throw new Error(
                    "SMS provider is not configured."
                );
        }
    };

/*
|--------------------------------------------------------------------------
| Send SMS
|--------------------------------------------------------------------------
*/

export const sendSms = async (
    input: SendSmsInput
): Promise<SmsSendResult> => {
    if (!isSmsConfigured()) {
        throw new Error(
            "SMS service is not configured."
        );
    }

    const {
        to,
        message,
    } = validateSmsInput(input);

    const provider =
        getSmsProvider();

    try {
        const result =
            await sendThroughProvider(
                provider,
                to,
                message
            );

        logger.info(
            {
                provider,
                to,
                messageId:
                    result.messageId,
            },
            "SMS sent successfully."
        );

        return result;
    } catch (error) {
        logger.error(
            {
                provider,
                to,
                error,
            },
            "SMS delivery failed."
        );

        throw error;
    }
};

/*
|--------------------------------------------------------------------------
| Simple SMS Helper
|--------------------------------------------------------------------------
*/

export const sendTextSms = async (
    to: string,
    message: string
): Promise<SmsSendResult> => {
    return sendSms({
        to,
        message,
    });
};

/*
|--------------------------------------------------------------------------
| OTP SMS Helper
|--------------------------------------------------------------------------
|
| OTP generation/storage belongs to otp.service.ts.
|
| This function only handles the delivery.
|
|--------------------------------------------------------------------------
*/

export const sendOtpSms = async (
    to: string,
    otp: string,
    expiresInMinutes = 5
): Promise<SmsSendResult> => {
    if (
        typeof otp !== "string" ||
        !/^\d{4,8}$/.test(
            otp.trim()
        )
    ) {
        throw new Error(
            "OTP must contain 4 to 8 digits."
        );
    }

    if (
        !Number.isInteger(
            expiresInMinutes
        ) ||
        expiresInMinutes < 1 ||
        expiresInMinutes > 60
    ) {
        throw new RangeError(
            "OTP expiration must be between 1 and 60 minutes."
        );
    }

    const message =
        `Your NOPTRIX verification code is ${otp.trim()}. It expires in ${expiresInMinutes} minutes. Do not share this code with anyone.`;

    return sendSms({
        to,
        message,
    });
};

/*
|--------------------------------------------------------------------------
| Bulk SMS
|--------------------------------------------------------------------------
*/

export const sendBulkSms = async (
    messages: readonly BulkSmsItem[],
    concurrency =
        DEFAULT_BULK_CONCURRENCY
): Promise<BulkSmsResult> => {
    if (!Array.isArray(messages)) {
        throw new TypeError(
            "Bulk SMS input must be an array."
        );
    }

    if (messages.length === 0) {
        return {
            total: 0,
            successful: 0,
            failed: 0,
            results: [],
            errors: [],
        };
    }

    if (
        !Number.isInteger(
            concurrency
        ) ||
        concurrency < 1 ||
        concurrency > 10
    ) {
        throw new RangeError(
            "SMS bulk concurrency must be between 1 and 10."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Validate everything before starting
    | delivery.
    |--------------------------------------------------------------------------
    */

    const normalizedMessages =
        messages.map(
            (item) => ({
                ...item,
                to:
                    normalizePhoneNumber(
                        item.to
                    ),
                message:
                    validateMessage(
                        item.message
                    ),
            })
        );

    const results: SmsSendResult[] =
        [];

    const errors: {
        index: number;
        to: string;
        error: unknown;
    }[] = [];

    let nextIndex = 0;

    const worker =
        async (): Promise<void> => {
            while (true) {
                const index =
                    nextIndex++;

                if (
                    index >=
                    normalizedMessages.length
                ) {
                    return;
                }

                const item =
                    normalizedMessages[
                        index
                    ];

                try {
                    const result =
                        await sendSms(
                            item
                        );

                    results.push(
                        result
                    );
                } catch (error) {
                    errors.push({
                        index,
                        to: item.to,
                        error,
                    });
                }
            }
        };

    const workerCount =
        Math.min(
            concurrency,
            normalizedMessages.length
        );

    await Promise.all(
        Array.from(
            {
                length:
                    workerCount,
            },
            () => worker()
        )
    );

    logger.info(
        {
            total:
                normalizedMessages.length,
            successful:
                results.length,
            failed:
                errors.length,
        },
        "Bulk SMS operation completed."
    );

    return {
        total:
            normalizedMessages.length,
        successful:
            results.length,
        failed:
            errors.length,
        results,
        errors,
    };
};

/*
|--------------------------------------------------------------------------
| Verify SMS Service
|--------------------------------------------------------------------------
|
| The current config layer does not expose a
| provider-specific ping operation.
|
| Therefore this function validates runtime
| configuration rather than sending a real SMS.
|
| A real provider health-check can be added
| later without changing sendSms().
|--------------------------------------------------------------------------
*/

export const verifySmsService =
    async (): Promise<boolean> => {
        const configured =
            isSmsConfigured();

        if (!configured) {
            logger.warn(
                "SMS service verification skipped because SMS provider is not configured."
            );

            return false;
        }

        return isSmsHealthy();
    };

/*
|--------------------------------------------------------------------------
| Service Health
|--------------------------------------------------------------------------
*/

export const checkSmsService =
    async (): Promise<SmsServiceHealth> => {
        const configured =
            isSmsConfigured();

        if (!configured) {
            return {
                configured: false,
                healthy: false,
                provider:
                    SMS_PROVIDERS.NONE,
            };
        }

        const healthy =
            await verifySmsService();

        return {
            configured: true,
            healthy,
            provider:
                getSmsProvider(),
        };
    };