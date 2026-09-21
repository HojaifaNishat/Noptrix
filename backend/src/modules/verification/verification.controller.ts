import {
    Request,
    Response,
} from "express";

import {
    asyncHandler,
} from "../../utils/asyncHandler";

import {
    ApiError,
} from "../../utils/ApiError";

import {
    getAuthenticatedUserId,
} from "../../middlewares/auth.middleware";

import {
    sendVerificationOtp,
    verifyVerificationOtp,
    resendVerificationOtp,
    getVerificationById,
    revokeVerification,
} from "./verification.service";

import {
    sendVerificationSchema,
    verifyOtpSchema,
    resendVerificationSchema,
    verificationIdParamSchema,
} from "./verification.validator";


/*
|--------------------------------------------------------------------------
| Get Authenticated User ID
|--------------------------------------------------------------------------
*/

const requireAuthenticatedUserId = (
    req: Request
): string => {
    const userId =
        getAuthenticatedUserId(
            req
        );

    if (!userId) {
        throw ApiError.unauthorized(
            "Authentication is required.",
            {
                code:
                    "AUTHENTICATION_REQUIRED",
            }
        );
    }

    return userId;
};


/*
|--------------------------------------------------------------------------
| Send Verification OTP
|--------------------------------------------------------------------------
*/

export const sendVerification =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            const userId =
                requireAuthenticatedUserId(
                    req
                );

            const input =
                sendVerificationSchema.parse(
                    req.body
                );

            const result =
                await sendVerificationOtp({
                    userId,

                    channel:
                        input.channel,

                    purpose:
                        input.purpose,

                    target:
                        input.target,
                });

            res.status(201).json({
                success: true,

                message:
                    "Verification code sent successfully.",

                data: {
                    verificationId:
                        result.verificationId,

                    channel:
                        result.channel,

                    purpose:
                        result.purpose,

                    target:
                        result.target,

                    expiresAt:
                        result.expiresAt,

                    resendAvailableAt:
                        result.resendAvailableAt,
                },
            });
        }
    );


/*
|--------------------------------------------------------------------------
| Verify OTP
|--------------------------------------------------------------------------
*/

export const verifyVerification =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            const userId =
                requireAuthenticatedUserId(
                    req
                );

            const input =
                verifyOtpSchema.parse(
                    req.body
                );

            const result =
                await verifyVerificationOtp({
                    userId,

                    channel:
                        input.channel,

                    purpose:
                        input.purpose,

                    target:
                        input.target,

                    code:
                        input.code,
                });

            res.status(200).json({
                success: true,

                message:
                    "Verification completed successfully.",

                data: {
                    verificationId:
                        result.verificationId,

                    verified:
                        result.verified,

                    channel:
                        result.channel,

                    purpose:
                        result.purpose,

                    target:
                        result.target,

                    verifiedAt:
                        result.verifiedAt,
                },
            });
        }
    );


/*
|--------------------------------------------------------------------------
| Resend Verification OTP
|--------------------------------------------------------------------------
*/

export const resendVerification =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            const userId =
                requireAuthenticatedUserId(
                    req
                );

            const input =
                resendVerificationSchema.parse(
                    req.body
                );

            const result =
                await resendVerificationOtp({
                    userId,

                    channel:
                        input.channel,

                    purpose:
                        input.purpose,

                    target:
                        input.target,
                });

            res.status(201).json({
                success: true,

                message:
                    "Verification code resent successfully.",

                data: {
                    verificationId:
                        result.verificationId,

                    channel:
                        result.channel,

                    purpose:
                        result.purpose,

                    target:
                        result.target,

                    expiresAt:
                        result.expiresAt,

                    resendAvailableAt:
                        result.resendAvailableAt,
                },
            });
        }
    );


/*
|--------------------------------------------------------------------------
| Get Verification
|--------------------------------------------------------------------------
*/

export const getVerification =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            requireAuthenticatedUserId(
                req
            );

            const input =
                verificationIdParamSchema.parse(
                    req.params
                );

            const verification =
                await getVerificationById(
                    input.verificationId
                );

            res.status(200).json({
                success: true,

                message:
                    "Verification retrieved successfully.",

                data:
                    verification,
            });
        }
    );


/*
|--------------------------------------------------------------------------
| Revoke Verification
|--------------------------------------------------------------------------
*/

export const revokeVerificationRequest =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            requireAuthenticatedUserId(
                req
            );

            const input =
                verificationIdParamSchema.parse(
                    req.params
                );

            const verification =
                await revokeVerification(
                    input.verificationId
                );

            res.status(200).json({
                success: true,

                message:
                    "Verification request revoked successfully.",

                data: {
                    verificationId:
                        verification._id,

                    status:
                        verification.status,
                },
            });
        }
    );