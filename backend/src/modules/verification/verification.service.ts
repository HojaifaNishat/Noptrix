import {
    Types,
} from "mongoose";

import {
    User,
} from "../users/user.model";

import {
    Verification,
} from "./verification.model";

import {
    VERIFICATION_CHANNELS,
    VERIFICATION_PURPOSES,
    VERIFICATION_STATUSES,
    type VerificationChannel,
    type VerificationPurpose,
} from "./verification.types";

import {
    ApiError,
} from "../../utils/ApiError";

import {
    createOtp,
    compareOtp,
    deliverOtp,
    validateDeliveryDestination,
    assertOtpCanBeResent,
    assertOtpAttemptsAvailable,
    getOtpPolicySnapshot,
} from "../../services/otp.service";


/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_MAX_ATTEMPTS = 5;


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface SendVerificationServiceInput {
    readonly userId: string;

    readonly channel:
        VerificationChannel;

    readonly purpose:
        VerificationPurpose;

    readonly target: string;
}


export interface VerifyVerificationServiceInput {
    readonly userId: string;

    readonly channel:
        VerificationChannel;

    readonly purpose:
        VerificationPurpose;

    readonly target: string;

    readonly code: string;
}


export interface ResendVerificationServiceInput {
    readonly userId: string;

    readonly channel:
        VerificationChannel;

    readonly purpose:
        VerificationPurpose;

    readonly target: string;
}


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/*
 * Convert verification-module channel
 * into the canonical OTP-service channel.
 *
 * Verification module:
 * EMAIL / PHONE
 *
 * OTP service:
 * email / sms
 */

const mapVerificationChannelToOtpChannel = (
    channel: VerificationChannel
): "email" | "sms" => {

    if (
        channel ===
        VERIFICATION_CHANNELS.EMAIL
    ) {
        return "email";
    }

    if (
        channel ===
        VERIFICATION_CHANNELS.PHONE
    ) {
        return "sms";
    }

    throw ApiError.badRequest(
        "Unsupported verification channel.",
        {
            code:
                "UNSUPPORTED_VERIFICATION_CHANNEL",
        }
    );
};


/*
 * Convert verification-module purpose
 * into the canonical OTP-service purpose.
 *
 * Verification module:
 * EMAIL_VERIFICATION
 * PHONE_VERIFICATION
 * PASSWORD_RESET
 * LOGIN_VERIFICATION
 *
 * OTP service:
 * email_verification
 * phone_verification
 * password_reset
 * login
 */

const mapVerificationPurposeToOtpPurpose = (
    purpose: VerificationPurpose
):
    | "email_verification"
    | "phone_verification"
    | "password_reset"
    | "login" => {

    if (
        purpose ===
        VERIFICATION_PURPOSES.EMAIL_VERIFICATION
    ) {
        return "email_verification";
    }

    if (
        purpose ===
        VERIFICATION_PURPOSES.PHONE_VERIFICATION
    ) {
        return "phone_verification";
    }

    if (
        purpose ===
        VERIFICATION_PURPOSES.PASSWORD_RESET
    ) {
        return "password_reset";
    }

    if (
        purpose ===
        VERIFICATION_PURPOSES.LOGIN_VERIFICATION
    ) {
        return "login";
    }

    throw ApiError.badRequest(
        "Unsupported verification purpose.",
        {
            code:
                "UNSUPPORTED_VERIFICATION_PURPOSE",
        }
    );
};


/*
|--------------------------------------------------------------------------
| ObjectId Validation
|--------------------------------------------------------------------------
*/

const ensureValidObjectId = (
    value: string,
    fieldName: string
): Types.ObjectId => {

    if (
        !Types.ObjectId.isValid(value)
    ) {
        throw ApiError.badRequest(
            `Invalid ${fieldName}.`,
            {
                code:
                    "INVALID_OBJECT_ID",
            }
        );
    }

    return new Types.ObjectId(
        value
    );
};


/*
|--------------------------------------------------------------------------
| Target Normalization
|--------------------------------------------------------------------------
*/

const normalizeTarget = (
    channel: VerificationChannel,
    target: string
): string => {

    const otpChannel =
        mapVerificationChannelToOtpChannel(
            channel
        );

    return validateDeliveryDestination(
        otpChannel,
        target
    );
};


/*
|--------------------------------------------------------------------------
| Get User By ID
|--------------------------------------------------------------------------
*/

const getUserById = async (
    userId: string
) => {

    const _id =
        ensureValidObjectId(
            userId,
            "user ID"
        );

    const user =
        await User.findById(
            _id
        );

    if (!user) {
        throw ApiError.notFound(
            "User not found.",
            {
                code:
                    "USER_NOT_FOUND",
            }
        );
    }

    return user;
};


/*
|--------------------------------------------------------------------------
| Target Ownership Validation
|--------------------------------------------------------------------------
|
| The client must not be allowed to verify
| an arbitrary email/phone belonging to
| another user.
|
*/

const assertUserOwnsTarget = async (
    userId: string,
    channel: VerificationChannel,
    target: string
): Promise<void> => {

    const user =
        await getUserById(
            userId
        );

    const normalizedTarget =
        normalizeTarget(
            channel,
            target
        );

    if (
        channel ===
        VERIFICATION_CHANNELS.EMAIL
    ) {

        const userEmail =
            user.email
                ?.trim()
                .toLowerCase();

        if (
            !userEmail ||
            userEmail !==
                normalizedTarget.toLowerCase()
        ) {
            throw ApiError.forbidden(
                "The verification email does not belong to this user.",
                {
                    code:
                        "VERIFICATION_TARGET_MISMATCH",
                }
            );
        }

        return;
    }


    if (
        channel ===
        VERIFICATION_CHANNELS.PHONE
    ) {

        const userPhone =
            user.phone
                ?.trim()
                .replace(
                    /[\s()-]/g,
                    ""
                );

        if (
            !userPhone ||
            userPhone !==
                normalizedTarget
        ) {
            throw ApiError.forbidden(
                "The verification phone number does not belong to this user.",
                {
                    code:
                        "VERIFICATION_TARGET_MISMATCH",
                }
            );
        }

        return;
    }


    throw ApiError.badRequest(
        "Unsupported verification channel.",
        {
            code:
                "UNSUPPORTED_VERIFICATION_CHANNEL",
        }
    );
};


/*
|--------------------------------------------------------------------------
| Purpose / Channel Compatibility
|--------------------------------------------------------------------------
*/

const assertPurposeChannelCompatibility = (
    channel: VerificationChannel,
    purpose: VerificationPurpose
): void => {

    if (
        purpose ===
            VERIFICATION_PURPOSES.EMAIL_VERIFICATION &&
        channel !==
            VERIFICATION_CHANNELS.EMAIL
    ) {

        throw ApiError.badRequest(
            "Email verification requires email OTP.",
            {
                code:
                    "INVALID_VERIFICATION_CHANNEL",
            }
        );
    }


    if (
        purpose ===
            VERIFICATION_PURPOSES.PHONE_VERIFICATION &&
        channel !==
            VERIFICATION_CHANNELS.PHONE
    ) {

        throw ApiError.badRequest(
            "Phone verification requires phone OTP.",
            {
                code:
                    "INVALID_VERIFICATION_CHANNEL",
            }
        );
    }
};


/*
|--------------------------------------------------------------------------
| Revoke Pending Verifications
|--------------------------------------------------------------------------
*/

const revokePendingVerifications = async (
    userId: Types.ObjectId,
    channel: VerificationChannel,
    purpose: VerificationPurpose
): Promise<void> => {

    await Verification.updateMany(
        {
            userId,

            channel,

            purpose,

            status:
                VERIFICATION_STATUSES.PENDING,
        },
        {
            $set: {
                status:
                    VERIFICATION_STATUSES.REVOKED,
            },
        }
    );
};


/*
|--------------------------------------------------------------------------
| Find Active Verification
|--------------------------------------------------------------------------
*/

const findActiveVerification = async (
    userId: Types.ObjectId,
    channel: VerificationChannel,
    purpose: VerificationPurpose,
    target: string
) => {

    return Verification.findOne({
        userId,

        channel,

        purpose,

        target,

        status:
            VERIFICATION_STATUSES.PENDING,

        expiresAt: {
            $gt: new Date(),
        },
    })
        .select(
            "+codeHash"
        )
        .sort({
            createdAt: -1,
        });
};


/*
|--------------------------------------------------------------------------
| Send Verification OTP
|--------------------------------------------------------------------------
*/

export const sendVerificationOtp = async (
    input: SendVerificationServiceInput
) => {

    const userId =
        ensureValidObjectId(
            input.userId,
            "user ID"
        );

    const channel =
        input.channel;

    const purpose =
        input.purpose;

    assertPurposeChannelCompatibility(
        channel,
        purpose
    );

    /*
     * Convert verification-module
     * values into OTP-service values.
     */
    const otpChannel =
        mapVerificationChannelToOtpChannel(
            channel
        );

    const otpPurpose =
        mapVerificationPurposeToOtpPurpose(
            purpose
        );

    const target =
        normalizeTarget(
            channel,
            input.target
        );


    /*
     * Make sure target belongs to user.
     */
    await assertUserOwnsTarget(
        input.userId,
        channel,
        target
    );


    /*
     * If already verified, do not
     * unnecessarily send another OTP.
     */

    const user =
        await getUserById(
            input.userId
        );


    if (
        purpose ===
            VERIFICATION_PURPOSES.EMAIL_VERIFICATION &&
        user.isEmailVerified
    ) {

        throw ApiError.conflict(
            "Email is already verified.",
            {
                code:
                    "EMAIL_ALREADY_VERIFIED",
            }
        );
    }


    if (
        purpose ===
            VERIFICATION_PURPOSES.PHONE_VERIFICATION &&
        user.isPhoneVerified
    ) {

        throw ApiError.conflict(
            "Phone number is already verified.",
            {
                code:
                    "PHONE_ALREADY_VERIFIED",
            }
        );
    }


    /*
     * Check current pending verification.
     */

    const existing =
        await findActiveVerification(
            userId,
            channel,
            purpose,
            target
        );


    if (
        existing?.lastSentAt
    ) {

        const policy =
            getOtpPolicySnapshot();

        const resendAvailableAt =
            new Date(
                existing.lastSentAt.getTime() +
                policy.policy
                    .resendCooldownSeconds *
                    1000
            );

        assertOtpCanBeResent(
            resendAvailableAt
        );
    }


    /*
     * Generate ONE OTP.
     *
     * The same code:
     *
     *   otp.code  → email/SMS
     *   otp.hash  → database
     *
     * This prevents OTP mismatch.
     */

    const otp =
        createOtp();


    /*
     * Deliver the exact OTP
     * generated above.
     */

    await deliverOtp({
        channel:
            otpChannel,

        destination:
            target,

        code:
            otp.code,

        purpose:
            otpPurpose,
    });


    /*
     * Revoke previous pending OTPs
     * only after delivery succeeds.
     */

    await revokePendingVerifications(
        userId,
        channel,
        purpose
    );


    /*
     * Persist only the hash.
     */

    const verification =
        await Verification.create({
            userId,

            channel,

            purpose,

            target,

            codeHash:
                otp.hash,

            status:
                VERIFICATION_STATUSES.PENDING,

            attempts:
                0,

            maxAttempts:
                otp.maxAttempts ||
                DEFAULT_MAX_ATTEMPTS,

            expiresAt:
                otp.expiresAt,

            lastSentAt:
                new Date(),
        });


    return {
        verificationId:
            verification._id,

        channel,

        purpose,

        target,

        expiresAt:
            verification.expiresAt,

        resendAvailableAt:
            otp.resendAvailableAt,
    };
};


/*
|--------------------------------------------------------------------------
| Verify OTP
|--------------------------------------------------------------------------
*/

export const verifyVerificationOtp =
    async (
        input: VerifyVerificationServiceInput
    ) => {

        const userId =
            ensureValidObjectId(
                input.userId,
                "user ID"
            );

        const channel =
            input.channel;

        const purpose =
            input.purpose;


        assertPurposeChannelCompatibility(
            channel,
            purpose
        );


        const target =
            normalizeTarget(
                channel,
                input.target
            );


        await assertUserOwnsTarget(
            input.userId,
            channel,
            target
        );


        const verification =
            await Verification.findOne({
                userId,

                channel,

                purpose,

                target,

                status:
                    VERIFICATION_STATUSES.PENDING,
            })
                .select(
                    "+codeHash"
                )
                .sort({
                    createdAt: -1,
                });


        if (!verification) {

            throw ApiError.notFound(
                "No active verification request was found.",
                {
                    code:
                        "VERIFICATION_NOT_FOUND",
                }
            );
        }


        /*
         * Expiry check.
         */

        if (
            verification.expiresAt.getTime() <=
            Date.now()
        ) {

            await Verification.updateOne(
                {
                    _id:
                        verification._id,

                    status:
                        VERIFICATION_STATUSES.PENDING,
                },
                {
                    $set: {
                        status:
                            VERIFICATION_STATUSES.EXPIRED,
                    },
                }
            );


            throw ApiError.unauthorized(
                "Verification code has expired.",
                {
                    code:
                        "OTP_EXPIRED",
                }
            );
        }


        /*
         * Attempt guard.
         */

        assertOtpAttemptsAvailable(
            verification.attempts
        );


        /*
         * Verify OTP using the existing
         * constant-time comparison logic.
         */

        const valid =
            compareOtp(
                input.code,
                verification.codeHash
            );


        if (!valid) {

            const nextAttempts =
                verification.attempts + 1;

            const maxAttempts =
                verification.maxAttempts;


            if (
                nextAttempts >=
                maxAttempts
            ) {

                await Verification.updateOne(
                    {
                        _id:
                            verification._id,

                        status:
                            VERIFICATION_STATUSES.PENDING,
                    },
                    {
                        $set: {
                            attempts:
                                nextAttempts,

                            status:
                                VERIFICATION_STATUSES.FAILED,
                        },
                    }
                );


                throw ApiError.tooManyRequests(
                    "Maximum OTP verification attempts exceeded.",
                    {
                        code:
                            "OTP_MAX_ATTEMPTS_EXCEEDED",
                    }
                );
            }


            await Verification.updateOne(
                {
                    _id:
                        verification._id,

                    status:
                        VERIFICATION_STATUSES.PENDING,
                },
                {
                    $inc: {
                        attempts:
                            1,
                    },
                }
            );


            throw ApiError.unauthorized(
                "Invalid verification code.",
                {
                    code:
                        "INVALID_OTP",

                    details: {
                        remainingAttempts:
                            Math.max(
                                0,
                                maxAttempts -
                                    nextAttempts
                            ),
                    },
                }
            );
        }


        /*
         * Mark verification as verified.
         */

        const verifiedAt =
            new Date();


        const updated =
            await Verification.findOneAndUpdate(
                {
                    _id:
                        verification._id,

                    status:
                        VERIFICATION_STATUSES.PENDING,
                },
                {
                    $set: {
                        status:
                            VERIFICATION_STATUSES.VERIFIED,

                        verifiedAt,
                    },
                },
                {
                    new: true,
                }
            );


        if (!updated) {

            throw ApiError.conflict(
                "Verification request is no longer active.",
                {
                    code:
                        "VERIFICATION_NOT_ACTIVE",
                }
            );
        }


        /*
         * Update user's verification flag.
         */

        if (
            purpose ===
            VERIFICATION_PURPOSES.EMAIL_VERIFICATION
        ) {

            await User.updateOne(
                {
                    _id:
                        userId,
                },
                {
                    $set: {
                        isEmailVerified:
                            true,
                    },
                }
            );
        }


        if (
            purpose ===
            VERIFICATION_PURPOSES.PHONE_VERIFICATION
        ) {

            await User.updateOne(
                {
                    _id:
                        userId,
                },
                {
                    $set: {
                        isPhoneVerified:
                            true,
                    },
                }
            );
        }


        return {
            verificationId:
                updated._id,

            verified:
                true,

            channel,

            purpose,

            target,

            verifiedAt,
        };
    };


/*
|--------------------------------------------------------------------------
| Resend Verification OTP
|--------------------------------------------------------------------------
*/

export const resendVerificationOtp =
    async (
        input: ResendVerificationServiceInput
    ) => {

        const userId =
            ensureValidObjectId(
                input.userId,
                "user ID"
            );

        const channel =
            input.channel;

        const purpose =
            input.purpose;


        assertPurposeChannelCompatibility(
            channel,
            purpose
        );


        /*
         * Convert verification-module
         * values into OTP-service values.
         */

        const otpChannel =
            mapVerificationChannelToOtpChannel(
                channel
            );

        const otpPurpose =
            mapVerificationPurposeToOtpPurpose(
                purpose
            );


        const target =
            normalizeTarget(
                channel,
                input.target
            );


        await assertUserOwnsTarget(
            input.userId,
            channel,
            target
        );


        const user =
            await getUserById(
                input.userId
            );


        if (
            purpose ===
                VERIFICATION_PURPOSES.EMAIL_VERIFICATION &&
            user.isEmailVerified
        ) {

            throw ApiError.conflict(
                "Email is already verified.",
                {
                    code:
                        "EMAIL_ALREADY_VERIFIED",
                }
            );
        }


        if (
            purpose ===
                VERIFICATION_PURPOSES.PHONE_VERIFICATION &&
            user.isPhoneVerified
        ) {

            throw ApiError.conflict(
                "Phone number is already verified.",
                {
                    code:
                        "PHONE_ALREADY_VERIFIED",
                }
            );
        }


        /*
         * Find most recent verification,
         * including expired/failed ones.
         */

        const previous =
            await Verification.findOne({
                userId,

                channel,

                purpose,

                target,
            })
                .sort({
                    createdAt: -1,
                });


        if (
            previous?.lastSentAt
        ) {

            const policy =
                getOtpPolicySnapshot();

            const resendAvailableAt =
                new Date(
                    previous.lastSentAt.getTime() +
                    policy.policy
                        .resendCooldownSeconds *
                        1000
                );

            assertOtpCanBeResent(
                resendAvailableAt
            );
        }


        /*
         * Generate ONE fresh OTP.
         */

        const otp =
            createOtp();


        /*
         * Deliver the exact same OTP
         * whose hash will be persisted.
         */

        await deliverOtp({
            channel:
                otpChannel,

            destination:
                target,

            code:
                otp.code,

            purpose:
                otpPurpose,
        });


        /*
         * Revoke all old pending
         * verification records.
         */

        await revokePendingVerifications(
            userId,
            channel,
            purpose
        );


        /*
         * Create fresh verification.
         */

        const verification =
            await Verification.create({
                userId,

                channel,

                purpose,

                target,

                codeHash:
                    otp.hash,

                status:
                    VERIFICATION_STATUSES.PENDING,

                attempts:
                    0,

                maxAttempts:
                    otp.maxAttempts ||
                    DEFAULT_MAX_ATTEMPTS,

                expiresAt:
                    otp.expiresAt,

                lastSentAt:
                    new Date(),
            });


        return {
            verificationId:
                verification._id,

            channel,

            purpose,

            target,

            expiresAt:
                verification.expiresAt,

            resendAvailableAt:
                otp.resendAvailableAt,
        };
    };


/*
|--------------------------------------------------------------------------
| Get Verification By ID
|--------------------------------------------------------------------------
*/

export const getVerificationById =
    async (
        verificationId: string
    ) => {

        const _id =
            ensureValidObjectId(
                verificationId,
                "verification ID"
            );


        const verification =
            await Verification.findById(
                _id
            ).select(
                "-codeHash"
            );


        if (!verification) {

            throw ApiError.notFound(
                "Verification request not found.",
                {
                    code:
                        "VERIFICATION_NOT_FOUND",
                }
            );
        }


        return verification;
    };


/*
|--------------------------------------------------------------------------
| Revoke Verification
|--------------------------------------------------------------------------
*/

export const revokeVerification =
    async (
        verificationId: string
    ) => {

        const _id =
            ensureValidObjectId(
                verificationId,
                "verification ID"
            );


        const verification =
            await Verification.findOneAndUpdate(
                {
                    _id,

                    status:
                        VERIFICATION_STATUSES.PENDING,
                },
                {
                    $set: {
                        status:
                            VERIFICATION_STATUSES.REVOKED,
                    },
                },
                {
                    new: true,
                }
            );


        if (!verification) {

            throw ApiError.notFound(
                "Active verification request not found.",
                {
                    code:
                        "VERIFICATION_NOT_FOUND",
                }
            );
        }


        return verification;
    };