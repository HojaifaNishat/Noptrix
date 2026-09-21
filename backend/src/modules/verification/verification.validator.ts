import {
    z,
} from "zod";

import {
    VERIFICATION_CHANNELS,
    VERIFICATION_PURPOSES,
} from "./verification.types";


/*
|--------------------------------------------------------------------------
| Common Schemas
|--------------------------------------------------------------------------
*/

const userIdSchema =
    z
        .string()
        .trim()
        .min(
            1,
            "User ID is required."
        );


const targetSchema =
    z
        .string()
        .trim()
        .min(
            1,
            "Verification target is required."
        )
        .max(
            255,
            "Verification target cannot exceed 255 characters."
        );


const codeSchema =
    z
        .string()
        .trim()
        .regex(
            /^\d{6}$/,
            "Verification code must be exactly 6 digits."
        );


/*
|--------------------------------------------------------------------------
| Channel
|--------------------------------------------------------------------------
*/

const channelSchema =
    z.enum(
        [
            VERIFICATION_CHANNELS.EMAIL,
            VERIFICATION_CHANNELS.PHONE,
        ]
    );


/*
|--------------------------------------------------------------------------
| Purpose
|--------------------------------------------------------------------------
*/

const purposeSchema =
    z.enum(
        [
            VERIFICATION_PURPOSES.EMAIL_VERIFICATION,
            VERIFICATION_PURPOSES.PHONE_VERIFICATION,
            VERIFICATION_PURPOSES.PASSWORD_RESET,
            VERIFICATION_PURPOSES.LOGIN_VERIFICATION,
        ]
    );


/*
|--------------------------------------------------------------------------
| Send Verification
|--------------------------------------------------------------------------
*/

export const sendVerificationSchema =
    z.object({
        userId:
            userIdSchema,

        channel:
            channelSchema,

        purpose:
            purposeSchema,

        target:
            targetSchema,
    });


/*
|--------------------------------------------------------------------------
| Verify OTP
|--------------------------------------------------------------------------
*/

export const verifyOtpSchema =
    z.object({
        userId:
            userIdSchema,

        channel:
            channelSchema,

        purpose:
            purposeSchema,

        target:
            targetSchema,

        code:
            codeSchema,
    });


/*
|--------------------------------------------------------------------------
| Resend Verification
|--------------------------------------------------------------------------
*/

export const resendVerificationSchema =
    z.object({
        userId:
            userIdSchema,

        channel:
            channelSchema,

        purpose:
            purposeSchema,

        target:
            targetSchema,
    });


/*
|--------------------------------------------------------------------------
| Verification ID Parameter
|--------------------------------------------------------------------------
*/

export const verificationIdParamSchema =
    z.object({
        verificationId:
            z
                .string()
                .trim()
                .min(
                    1,
                    "Verification ID is required."
                ),
    });


/*
|--------------------------------------------------------------------------
| Inferred Types
|--------------------------------------------------------------------------
*/

export type SendVerificationInput =
    z.infer<
        typeof sendVerificationSchema
    >;

export type VerifyOtpInput =
    z.infer<
        typeof verifyOtpSchema
    >;

export type ResendVerificationInput =
    z.infer<
        typeof resendVerificationSchema
    >;

export type VerificationIdParam =
    z.infer<
        typeof verificationIdParamSchema
    >;