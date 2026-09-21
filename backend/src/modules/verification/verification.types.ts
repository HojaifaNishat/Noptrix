import {
    Types,
} from "mongoose";


/*
|--------------------------------------------------------------------------
| Verification Channels
|--------------------------------------------------------------------------
|
| EMAIL → Email OTP verification
| PHONE → Phone/SMS OTP verification
|
*/

export const VERIFICATION_CHANNELS = {
    EMAIL: "EMAIL",
    PHONE: "PHONE",
} as const;

export type VerificationChannel =
    typeof VERIFICATION_CHANNELS[
        keyof typeof VERIFICATION_CHANNELS
    ];


/*
|--------------------------------------------------------------------------
| Verification Purposes
|--------------------------------------------------------------------------
|
| EMAIL_VERIFICATION → Verify user's email
| PHONE_VERIFICATION → Verify user's phone
| PASSWORD_RESET     → Password reset OTP
| LOGIN_VERIFICATION → Additional login verification
|
*/

export const VERIFICATION_PURPOSES = {
    EMAIL_VERIFICATION:
        "EMAIL_VERIFICATION",

    PHONE_VERIFICATION:
        "PHONE_VERIFICATION",

    PASSWORD_RESET:
        "PASSWORD_RESET",

    LOGIN_VERIFICATION:
        "LOGIN_VERIFICATION",
} as const;

export type VerificationPurpose =
    typeof VERIFICATION_PURPOSES[
        keyof typeof VERIFICATION_PURPOSES
    ];


/*
|--------------------------------------------------------------------------
| Verification Status
|--------------------------------------------------------------------------
*/

export const VERIFICATION_STATUSES = {
    PENDING: "PENDING",
    VERIFIED: "VERIFIED",
    EXPIRED: "EXPIRED",
    FAILED: "FAILED",
    REVOKED: "REVOKED",
} as const;

export type VerificationStatus =
    typeof VERIFICATION_STATUSES[
        keyof typeof VERIFICATION_STATUSES
    ];


/*
|--------------------------------------------------------------------------
| Verification Document
|--------------------------------------------------------------------------
*/

export interface IVerification {
    _id: Types.ObjectId;

    userId: Types.ObjectId;

    channel: VerificationChannel;

    purpose: VerificationPurpose;

    target: string;

    codeHash: string;

    status: VerificationStatus;

    attempts: number;

    maxAttempts: number;

    expiresAt: Date;

    verifiedAt?: Date;

    lastSentAt?: Date;

    createdAt: Date;

    updatedAt: Date;
}


/*
|--------------------------------------------------------------------------
| Create Verification Input
|--------------------------------------------------------------------------
*/

export interface CreateVerificationInput {
    readonly userId: string;

    readonly channel:
        VerificationChannel;

    readonly purpose:
        VerificationPurpose;

    readonly target: string;

    readonly codeHash: string;

    readonly expiresAt: Date;

    readonly maxAttempts?: number;
}


/*
|--------------------------------------------------------------------------
| Verify OTP Input
|--------------------------------------------------------------------------
*/

export interface VerifyOtpInput {
    readonly userId: string;

    readonly channel:
        VerificationChannel;

    readonly purpose:
        VerificationPurpose;

    readonly target: string;

    readonly code: string;
}


/*
|--------------------------------------------------------------------------
| Send / Resend OTP Input
|--------------------------------------------------------------------------
*/

export interface SendVerificationInput {
    readonly userId: string;

    readonly channel:
        VerificationChannel;

    readonly purpose:
        VerificationPurpose;

    readonly target: string;
}


/*
|--------------------------------------------------------------------------
| Verification Result
|--------------------------------------------------------------------------
*/

export interface VerificationResult {
    readonly verificationId:
        Types.ObjectId;

    readonly verified: boolean;

    readonly channel:
        VerificationChannel;

    readonly purpose:
        VerificationPurpose;

    readonly target: string;

    readonly verifiedAt?: Date;
}