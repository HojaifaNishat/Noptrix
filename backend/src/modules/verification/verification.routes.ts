import {
    Router,
} from "express";

import {
    userAuth,
} from "../../middlewares/userAuth.middleware";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    sendVerificationSchema,
    verifyOtpSchema,
    resendVerificationSchema,
    verificationIdParamSchema,
} from "./verification.validator";

import {
    sendVerification,
    verifyVerification,
    resendVerification,
    getVerification,
    revokeVerificationRequest,
} from "./verification.controller";


const router = Router();


/*
|--------------------------------------------------------------------------
| Send Verification OTP
|--------------------------------------------------------------------------
| POST /api/verification/send
|--------------------------------------------------------------------------
*/

router.post(
    "/send",
    userAuth,
    validate(sendVerificationSchema),
    sendVerification
);


/*
|--------------------------------------------------------------------------
| Verify OTP
|--------------------------------------------------------------------------
| POST /api/verification/verify
|--------------------------------------------------------------------------
*/

router.post(
    "/verify",
    userAuth,
    validate(verifyOtpSchema),
    verifyVerification
);


/*
|--------------------------------------------------------------------------
| Resend Verification OTP
|--------------------------------------------------------------------------
| POST /api/verification/resend
|--------------------------------------------------------------------------
*/

router.post(
    "/resend",
    userAuth,
    validate(resendVerificationSchema),
    resendVerification
);


/*
|--------------------------------------------------------------------------
| Get Verification
|--------------------------------------------------------------------------
| GET /api/verification/:verificationId
|--------------------------------------------------------------------------
*/

router.get(
    "/:verificationId",
    userAuth,
    validate(verificationIdParamSchema),
    getVerification
);


/*
|--------------------------------------------------------------------------
| Revoke Verification
|--------------------------------------------------------------------------
| POST /api/verification/:verificationId/revoke
|--------------------------------------------------------------------------
*/

router.post(
    "/:verificationId/revoke",
    userAuth,
    validate(verificationIdParamSchema),
    revokeVerificationRequest
);


export default router;