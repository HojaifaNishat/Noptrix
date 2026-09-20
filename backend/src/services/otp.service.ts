import crypto from "node:crypto";

import {
    OTP_CHANNELS,
    OTP_EXPIRY_SECONDS,
    OTP_LENGTH,
    OTP_MAX_ATTEMPTS,
    OTP_MIN_VALUE,
    OTP_MAX_VALUE,
    OTP_PURPOSES,
    OTP_RESEND_COOLDOWN_SECONDS,
    OTP_RETENTION_SECONDS,
    getOtpConfig,
    isOtpConfigured,
    resolveOtpChannel,
    resolveOtpPurpose,
    type OtpChannel,
    type OtpPurpose,
} from "../config/otp";

import {
    sendTextEmail,
} from "./email.service";

import {
    sendSms,
} from "./sms.service";

import {
    ApiError,
} from "../utils/ApiError";

import {
    logger,
} from "../utils/logger";


/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const OTP_HASH_ALGORITHM = "sha256";

const OTP_EMAIL_DEFAULT_SUBJECT =
    "Your NOPTRIX verification code";


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface GenerateOtpResult {
    readonly code: string;
    readonly hash: string;
    readonly expiresAt: Date;
    readonly resendAvailableAt: Date;
    readonly maxAttempts: number;
    readonly retentionExpiresAt: Date;
}

export interface OtpVerificationInput {
    readonly code: string;
    readonly expectedHash: string;
}

export interface OtpVerificationResult {
    readonly valid: boolean;
    readonly expired: boolean;
    readonly attemptsExceeded: boolean;
    readonly remainingAttempts: number;
}

export interface OtpDeliveryInput {
    readonly channel: OtpChannel | string;
    readonly destination: string;
    readonly code: string;
    readonly purpose?: OtpPurpose | string;
    readonly subject?: string;
}

export interface OtpDeliveryResult {
    readonly channel: OtpChannel;
    readonly destination: string;
    readonly delivered: boolean;
}

export interface OtpPolicy {
    readonly length: number;
    readonly expirySeconds: number;
    readonly resendCooldownSeconds: number;
    readonly maxAttempts: number;
    readonly retentionSeconds: number;
}

export interface GenerateAndDeliverOtpInput {
    readonly channel: OtpChannel | string;
    readonly destination: string;
    readonly purpose: OtpPurpose | string;
    readonly subject?: string;
}

export interface GenerateAndDeliverOtpResult
    extends GenerateOtpResult {
    readonly delivery: OtpDeliveryResult;
}


/*
|--------------------------------------------------------------------------
| Internal Helpers
|--------------------------------------------------------------------------
*/

const normalizeString = (
    value: string
): string => {
    return value.trim();
};


const normalizeDestination = (
    destination: string
): string => {
    return normalizeString(destination);
};


const validateOtpCode = (
    code: string
): string => {
    const normalizedCode =
        normalizeString(code);

    if (
        !/^\d{6}$/.test(normalizedCode)
    ) {
        throw ApiError.badRequest(
            "OTP must be a valid 6-digit code.",
            {
                code: "INVALID_OTP_FORMAT",
            }
        );
    }

    return normalizedCode;
};


const validateOtpHash = (
    hash: string
): string => {
    const normalizedHash =
        normalizeString(hash);

    if (
        !/^[a-f0-9]{64}$/i.test(
            normalizedHash
        )
    ) {
        throw ApiError.badRequest(
            "Invalid OTP hash.",
            {
                code: "INVALID_OTP_HASH",
            }
        );
    }

    return normalizedHash.toLowerCase();
};


/*
|--------------------------------------------------------------------------
| OTP Generation
|--------------------------------------------------------------------------
*/

export const generateOtpCode = (): string => {
    const value = crypto.randomInt(
        OTP_MIN_VALUE,
        OTP_MAX_VALUE + 1
    );

    return String(value).padStart(
        OTP_LENGTH,
        "0"
    );
};


/*
|--------------------------------------------------------------------------
| OTP Hashing
|--------------------------------------------------------------------------
*/

export const hashOtp = (
    code: string
): string => {
    const normalizedCode =
        validateOtpCode(code);

    return crypto
        .createHash(OTP_HASH_ALGORITHM)
        .update(normalizedCode, "utf8")
        .digest("hex");
};


/*
|--------------------------------------------------------------------------
| Constant-Time OTP Comparison
|--------------------------------------------------------------------------
*/

export const compareOtp = (
    code: string,
    expectedHash: string
): boolean => {
    const normalizedCode =
        validateOtpCode(code);

    const normalizedHash =
        validateOtpHash(expectedHash);

    const actualHash =
        hashOtp(normalizedCode);

    const actualBuffer =
        Buffer.from(
            actualHash,
            "hex"
        );

    const expectedBuffer =
        Buffer.from(
            normalizedHash,
            "hex"
        );

    if (
        actualBuffer.length !==
        expectedBuffer.length
    ) {
        return false;
    }

    return crypto.timingSafeEqual(
        actualBuffer,
        expectedBuffer
    );
};


/*
|--------------------------------------------------------------------------
| OTP Creation
|--------------------------------------------------------------------------
*/

export const createOtp = (): GenerateOtpResult => {
    const config =
        getOtpConfig();

    const now =
        Date.now();

    const code =
        generateOtpCode();

    const hash =
        hashOtp(code);

    const expiresAt =
        new Date(
            now +
            config.expirySeconds * 1000
        );

    const resendAvailableAt =
        new Date(
            now +
            config.resendCooldownSeconds *
                1000
        );

    const retentionExpiresAt =
        new Date(
            now +
            config.retentionSeconds *
                1000
        );

    return {
        code,
        hash,
        expiresAt,
        resendAvailableAt,
        maxAttempts:
            config.maxAttempts,
        retentionExpiresAt,
    };
};


/*
|--------------------------------------------------------------------------
| OTP Policy
|--------------------------------------------------------------------------
*/

export const createOtpPolicy = (): OtpPolicy => {
    const config =
        getOtpConfig();

    return {
        length: config.length,
        expirySeconds:
            config.expirySeconds,
        resendCooldownSeconds:
            config.resendCooldownSeconds,
        maxAttempts:
            config.maxAttempts,
        retentionSeconds:
            config.retentionSeconds,
    };
};


/*
|--------------------------------------------------------------------------
| Expiration
|--------------------------------------------------------------------------
*/

export const isOtpExpired = (
    expiresAt: Date | string | number
): boolean => {
    const expirationTime =
        new Date(expiresAt).getTime();

    if (
        Number.isNaN(expirationTime)
    ) {
        return true;
    }

    return Date.now() >=
        expirationTime;
};


/*
|--------------------------------------------------------------------------
| Resend Availability
|--------------------------------------------------------------------------
*/

export const isOtpResendAvailable = (
    resendAvailableAt:
        Date | string | number
): boolean => {
    const availableAt =
        new Date(
            resendAvailableAt
        ).getTime();

    if (
        Number.isNaN(availableAt)
    ) {
        return false;
    }

    return Date.now() >=
        availableAt;
};


/*
|--------------------------------------------------------------------------
| Remaining Attempts
|--------------------------------------------------------------------------
*/

export const getRemainingOtpAttempts = (
    attemptsUsed: number
): number => {
    const normalizedAttempts =
        Math.max(
            0,
            Math.floor(attemptsUsed)
        );

    return Math.max(
        0,
        OTP_MAX_ATTEMPTS -
            normalizedAttempts
    );
};


/*
|--------------------------------------------------------------------------
| OTP Verification
|--------------------------------------------------------------------------
*/

export const verifyOtp = (
    input: OtpVerificationInput & {
        readonly expiresAt?: Date | string | number;
        readonly attemptsUsed?: number;
    }
): OtpVerificationResult => {
    const code =
        validateOtpCode(input.code);

    const expectedHash =
        validateOtpHash(
            input.expectedHash
        );

    const attemptsUsed =
        Math.max(
            0,
            Math.floor(
                input.attemptsUsed ?? 0
            )
        );

    const remainingAttempts =
        getRemainingOtpAttempts(
            attemptsUsed
        );

    if (
        remainingAttempts <= 0
    ) {
        return {
            valid: false,
            expired: false,
            attemptsExceeded: true,
            remainingAttempts: 0,
        };
    }

    if (
        input.expiresAt !== undefined &&
        isOtpExpired(input.expiresAt)
    ) {
        return {
            valid: false,
            expired: true,
            attemptsExceeded: false,
            remainingAttempts,
        };
    }

    const valid =
        compareOtp(
            code,
            expectedHash
        );

    return {
        valid,
        expired: false,
        attemptsExceeded: false,
        remainingAttempts:
            valid
                ? remainingAttempts
                : Math.max(
                    0,
                    remainingAttempts - 1
                ),
    };
};


/*
|--------------------------------------------------------------------------
| Purpose Validation
|--------------------------------------------------------------------------
*/

export const validateOtpPurpose = (
    purpose: OtpPurpose | string
): OtpPurpose => {
    const normalizedPurpose =
        normalizeString(purpose);

    if (
        !Object.values(OTP_PURPOSES).includes(
            normalizedPurpose as OtpPurpose
        )
    ) {
        throw ApiError.badRequest(
            `Unsupported OTP purpose: ${purpose}`,
            {
                code: "UNSUPPORTED_OTP_PURPOSE",
            }
        );
    }

    return normalizedPurpose as OtpPurpose;
};

/*
|--------------------------------------------------------------------------
| Channel Validation
|--------------------------------------------------------------------------
*/

export const validateOtpChannel = (
    channel: OtpChannel | string
): OtpChannel => {
    const normalizedChannel =
        normalizeString(channel).toLowerCase();

    if (
        !Object.values(OTP_CHANNELS).includes(
            normalizedChannel as OtpChannel
        )
    ) {
        throw ApiError.badRequest(
            `Unsupported OTP channel: ${channel}`,
            {
                code: "UNSUPPORTED_OTP_CHANNEL",
            }
        );
    }

    return normalizedChannel as OtpChannel;
};


/*
|--------------------------------------------------------------------------
| Delivery Destination Validation
|--------------------------------------------------------------------------
*/

export const validateDeliveryDestination = (
    channel: OtpChannel,
    destination: string
): string => {
    const normalizedDestination =
        normalizeDestination(
            destination
        );

    if (!normalizedDestination) {
        throw ApiError.badRequest(
            "OTP destination is required.",
            {
                code: "OTP_DESTINATION_REQUIRED",
            }
        );
    }

    if (
        channel === OTP_CHANNELS.EMAIL
    ) {
        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            !emailPattern.test(
                normalizedDestination
            )
        ) {
            throw ApiError.badRequest(
                "A valid email address is required for email OTP delivery.",
                {
                    code: "INVALID_OTP_EMAIL",
                }
            );
        }
    }

    if (
        channel === OTP_CHANNELS.SMS
    ) {
        const phonePattern =
            /^\+?[1-9]\d{7,14}$/;

        const normalizedPhone =
            normalizedDestination.replace(
                /[\s()-]/g,
                ""
            );

        if (
            !phonePattern.test(
                normalizedPhone
            )
        ) {
            throw ApiError.badRequest(
                "A valid phone number is required for SMS OTP delivery.",
                {
                    code: "INVALID_OTP_PHONE",
                }
            );
        }

        return normalizedPhone;
    }

    return normalizedDestination;
};


/*
|--------------------------------------------------------------------------
| OTP Email Builder
|--------------------------------------------------------------------------
*/

export const buildOtpEmail = (
    code: string,
    purpose?: OtpPurpose
): {
    readonly subject: string;
    readonly text: string;
    readonly html: string;
} => {
    const normalizedCode =
        validateOtpCode(code);

    const purposeText =
        purpose
            ? purpose.replace(
                /_/g,
                " "
            )
            : "verification";

    const expiryMinutes =
        Math.floor(
            OTP_EXPIRY_SECONDS / 60
        );

    const subject =
        OTP_EMAIL_DEFAULT_SUBJECT;

    const text =
        [
            "NOPTRIX Verification",
            "",
            `Your ${purposeText} code is: ${normalizedCode}`,
            "",
            `This code expires in ${expiryMinutes} minutes.`,
            "If you did not request this code, you can safely ignore this email.",
            "",
            "NOPTRIX Security",
        ].join("\n");

    const html =
        `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
            <h2>NOPTRIX Verification</h2>

            <p>
                Your ${purposeText} verification code is:
            </p>

            <div
                style="
                    display:inline-block;
                    padding:12px 20px;
                    background:#f3f4f6;
                    border-radius:10px;
                    font-size:28px;
                    font-weight:700;
                    letter-spacing:8px;
                "
            >
                ${normalizedCode}
            </div>

            <p>
                This code expires in
                <strong>${expiryMinutes} minutes</strong>.
            </p>

            <p>
                If you did not request this code,
                you can safely ignore this email.
            </p>

            <p>
                NOPTRIX Security
            </p>
        </div>
        `.trim();

    return {
        subject,
        text,
        html,
    };
};


/*
|--------------------------------------------------------------------------
| OTP Delivery
|--------------------------------------------------------------------------
*/

export const deliverOtp = async (
    input: OtpDeliveryInput
): Promise<OtpDeliveryResult> => {
    const channel =
        validateOtpChannel(
            input.channel
        );

    const purpose =
        input.purpose !== undefined
            ? validateOtpPurpose(
                input.purpose
            )
            : undefined;

    const destination =
        validateDeliveryDestination(
            channel,
            input.destination
        );

    const code =
        validateOtpCode(
            input.code
        );

    if (
        !isOtpConfigured()
    ) {
        throw ApiError.internal(
            "OTP service is not configured.",
            {
                code: "OTP_SERVICE_NOT_CONFIGURED",
            }
        );
    }

    if (
        channel === OTP_CHANNELS.EMAIL
    ) {
        const email =
            buildOtpEmail(
                code,
                purpose
            );

        const subject =
            input.subject?.trim() ||
            email.subject;

        await sendTextEmail(
            destination,
            subject,
            email.text
        );

        return {
            channel,
            destination,
            delivered: true,
        };
    }

    if (
        channel === OTP_CHANNELS.SMS
    ) {
        const expiryMinutes =
            Math.floor(
                OTP_EXPIRY_SECONDS / 60
            );

        await sendSms({
            to: destination,
            message:
                `NOPTRIX verification code: ` +
                `${code}. Expires in ` +
                `${expiryMinutes} minutes.`,
        });

        return {
            channel,
            destination,
            delivered: true,
        };
    }

    throw ApiError.badRequest(
        `Unsupported OTP channel: ${channel}`,
        {
            code: "UNSUPPORTED_OTP_CHANNEL",
        }
    );
};


/*
|--------------------------------------------------------------------------
| Generate + Deliver OTP
|--------------------------------------------------------------------------
*/

export const generateAndDeliverOtp = async (
    input: GenerateAndDeliverOtpInput
): Promise<GenerateAndDeliverOtpResult> => {
    const channel =
        validateOtpChannel(
            input.channel
        );

    const purpose =
        validateOtpPurpose(
            input.purpose
        );

    const destination =
        validateDeliveryDestination(
            channel,
            input.destination
        );

    const otp =
        createOtp();

    const delivery =
        await deliverOtp({
            channel,
            destination,
            code: otp.code,
            purpose,
            subject: input.subject,
        });

    /*
     * Never log the raw OTP.
     * The generated code is returned to the caller
     * because persistence/application-layer code may
     * need it for hashing/storage workflows.
     *
     * Production controllers should never expose
     * this code in an API response.
     */
    logger.info(
        {
            channel,
            purpose,
            destination:
                sanitizeOtpForLogging(
                    destination
                ),
            expiresAt:
                otp.expiresAt.toISOString(),
        },
        "OTP generated and delivered"
    );

    return {
        ...otp,
        delivery,
    };
};


/*
|--------------------------------------------------------------------------
| Safe Logging
|--------------------------------------------------------------------------
*/

export const sanitizeOtpForLogging = (
    destination: string
): string => {
    const normalized =
        normalizeDestination(
            destination
        );

    if (!normalized) {
        return "[REDACTED]";
    }

    if (
        normalized.includes("@")
    ) {
        const [
            localPart,
            domain,
        ] = normalized.split("@");

        if (
            !localPart ||
            !domain
        ) {
            return "[REDACTED]";
        }

        const visibleLocal =
            localPart.length <= 2
                ? "*"
                : `${localPart[0]}***`;

        return `${visibleLocal}@${domain}`;
    }

    const visibleDigits =
        normalized.slice(-4);

    return `***${visibleDigits}`;
};


/*
|--------------------------------------------------------------------------
| OTP Policy Snapshot
|--------------------------------------------------------------------------
*/

export const getOtpPolicySnapshot = (): {
    readonly configured: boolean;
    readonly healthy: boolean;
    readonly policy: OtpPolicy;
} => {
    const config =
        getOtpConfig();

    return {
        configured:
            isOtpConfigured(),

        healthy:
            isOtpConfigured(),

        policy: {
            length:
                config.length,

            expirySeconds:
                config.expirySeconds,

            resendCooldownSeconds:
                config.resendCooldownSeconds,

            maxAttempts:
                config.maxAttempts,

            retentionSeconds:
                config.retentionSeconds,
        },
    };
};


/*
|--------------------------------------------------------------------------
| Security Policy Guards
|--------------------------------------------------------------------------
*/

export const assertOtpCanBeResent = (
    resendAvailableAt:
        Date | string | number
): void => {
    if (
        !isOtpResendAvailable(
            resendAvailableAt
        )
    ) {
        const remainingMs =
            Math.max(
                0,
                new Date(
                    resendAvailableAt
                ).getTime() -
                    Date.now()
            );

        const remainingSeconds =
            Math.ceil(
                remainingMs / 1000
            );

        throw ApiError.tooManyRequests(
            `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
            {
                code: "OTP_RESEND_COOLDOWN",
                details: {
                    retryAfterSeconds:
                        remainingSeconds,
                },
            }
        );
    }
};


/*
|--------------------------------------------------------------------------
| Security Policy: Attempt Guard
|--------------------------------------------------------------------------
*/

export const assertOtpAttemptsAvailable = (
    attemptsUsed: number
): void => {
    const remainingAttempts =
        getRemainingOtpAttempts(
            attemptsUsed
        );

    if (
        remainingAttempts <= 0
    ) {
        throw ApiError.tooManyRequests(
            "Maximum OTP verification attempts exceeded.",
            {
                code: "OTP_MAX_ATTEMPTS_EXCEEDED",
            }
        );
    }
};


/*
|--------------------------------------------------------------------------
| Constants Snapshot
|--------------------------------------------------------------------------
|
| These exports provide a stable service-level contract
| for future database models, jobs and controllers.
|
*/

export const OTP_POLICY_CONSTANTS = Object.freeze({
    length: OTP_LENGTH,
    expirySeconds:
        OTP_EXPIRY_SECONDS,
    resendCooldownSeconds:
        OTP_RESEND_COOLDOWN_SECONDS,
    maxAttempts:
        OTP_MAX_ATTEMPTS,
    retentionSeconds:
        OTP_RETENTION_SECONDS,
});


/*
|--------------------------------------------------------------------------
| Service Health
|--------------------------------------------------------------------------
*/

export const checkOtpService = async (): Promise<{
    readonly configured: boolean;
    readonly healthy: boolean;
}> => {
    const configured =
        isOtpConfigured();

    return {
        configured,
        healthy: configured,
    };
};