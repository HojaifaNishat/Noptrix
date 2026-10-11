import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
    PasswordRecoveryAccountType,
    requestPasswordReset,
    resetPassword,
} from "./password-recovery.service";

export const createPasswordRecoveryHandlers = (
    accountType: PasswordRecoveryAccountType,
) => ({
    forgotPasswordController: asyncHandler(
        async (req: Request, res: Response) => {
            await requestPasswordReset(req.body.email, accountType);

            res.status(200).json({
                success: true,
                message:
                    "If an eligible account exists for this email, a password reset code will be sent.",
            });
        },
    ),

    resetPasswordController: asyncHandler(
        async (req: Request, res: Response) => {
            await resetPassword(
                {
                    email: req.body.email,
                    code: req.body.code,
                    newPassword: req.body.newPassword,
                },
                accountType,
            );

            res.status(200).json({
                success: true,
                message:
                    "Password reset successfully. Please log in with your new password.",
            });
        },
    ),
});
