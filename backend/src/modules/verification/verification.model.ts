import {
    Document,
    Model,
    Schema,
    Types,
    model,
} from "mongoose";

import {
    VERIFICATION_CHANNELS,
    VERIFICATION_PURPOSES,
    VERIFICATION_STATUSES,
    IVerification,
} from "./verification.types";


/*
|--------------------------------------------------------------------------
| Verification Document
|--------------------------------------------------------------------------
*/

export interface IVerificationDocument
    extends IVerification,
        Document {}


/*
|--------------------------------------------------------------------------
| Verification Model
|--------------------------------------------------------------------------
*/

export type VerificationModel =
    Model<IVerificationDocument>;


/*
|--------------------------------------------------------------------------
| Verification Schema
|--------------------------------------------------------------------------
*/

const verificationSchema =
    new Schema<IVerificationDocument>(
        {
            userId: {
                type: Schema.Types.ObjectId,

                ref: "User",

                required: [
                    true,
                    "User ID is required.",
                ],

                index: true,
            },

            channel: {
                type: String,

                enum: {
                    values:
                        Object.values(
                            VERIFICATION_CHANNELS
                        ),

                    message:
                        "Invalid verification channel.",
                },

                required: [
                    true,
                    "Verification channel is required.",
                ],

                index: true,
            },

            purpose: {
                type: String,

                enum: {
                    values:
                        Object.values(
                            VERIFICATION_PURPOSES
                        ),

                    message:
                        "Invalid verification purpose.",
                },

                required: [
                    true,
                    "Verification purpose is required.",
                ],

                index: true,
            },

            /*
             * Email or phone number being verified.
             */
            target: {
                type: String,

                required: [
                    true,
                    "Verification target is required.",
                ],

                trim: true,

                maxlength: [
                    255,
                    "Verification target cannot exceed 255 characters.",
                ],

                index: true,
            },

            /*
             * Never store the actual OTP.
             * Only its hash is stored.
             */
            codeHash: {
                type: String,

                required: [
                    true,
                    "Verification code hash is required.",
                ],

                select: false,
            },

            status: {
                type: String,

                enum: {
                    values:
                        Object.values(
                            VERIFICATION_STATUSES
                        ),

                    message:
                        "Invalid verification status.",
                },

                default:
                    VERIFICATION_STATUSES.PENDING,

                index: true,
            },

            /*
             * Number of incorrect OTP attempts.
             */
            attempts: {
                type: Number,

                default: 0,

                min: [
                    0,
                    "Attempts cannot be negative.",
                ],
            },

            /*
             * Maximum allowed attempts.
             */
            maxAttempts: {
                type: Number,

                default: 5,

                min: [
                    1,
                    "Maximum attempts must be at least 1.",
                ],

                max: [
                    20,
                    "Maximum attempts cannot exceed 20.",
                ],
            },

            /*
             * OTP expiration time.
             */
            expiresAt: {
                type: Date,

                required: [
                    true,
                    "Verification expiry is required.",
                ],

                index: true,
            },

            verifiedAt: {
                type: Date,
            },

            lastSentAt: {
                type: Date,
            },
        },

        {
            timestamps: true,

            versionKey: false,
        }
    );


/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

/*
 * Quickly find a user's active verification.
 */
verificationSchema.index(
    {
        userId: 1,
        channel: 1,
        purpose: 1,
        status: 1,
    },
    {
        name:
            "verification_user_channel_purpose_status",
    }
);


/*
 * Prevent duplicate active verification
 * lookup problems and speed up queries.
 */
verificationSchema.index(
    {
        userId: 1,
        purpose: 1,
        createdAt: -1,
    },
    {
        name:
            "verification_user_purpose_createdAt",
    }
);


/*
 * Automatically remove old verification
 * documents after expiry.
 *
 * Important:
 * MongoDB TTL deletes the document after
 * expiresAt. It does NOT verify the OTP.
 */
verificationSchema.index(
    {
        expiresAt: 1,
    },
    {
        expireAfterSeconds: 0,

        name:
            "verification_expiry_ttl",
    }
);


/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

export const Verification =
    model<
        IVerificationDocument,
        VerificationModel
    >(
        "Verification",
        verificationSchema
    );