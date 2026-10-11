import { Admin } from "../admins/admin.model";
import { Customer } from "../customers/customer.model";
import { Employee } from "../employees/employee.model";
import {
    VERIFICATION_CHANNELS,
    VERIFICATION_PURPOSES,
} from "../verification/verification.types";
import {
    sendVerificationOtp,
    verifyVerificationOtp,
} from "../verification/verification.service";
import { User } from "../users/user.model";
import {
    hashUserPassword,
    verifyUserPassword,
} from "../users/user.service";
import { ApiError } from "../../utils/ApiError";
import { revokeAllUserSessions } from "../sessions/session.service";

export type PasswordRecoveryAccountType =
    | "ADMIN"
    | "EMPLOYEE"
    | "USER";

const findRecoveryUser = async (
    email: string,
    accountType: PasswordRecoveryAccountType,
) => {
    const user = await User.findOne({ email })
        .select("+password")
        .exec();

    if (!user) {
        return null;
    }

    const accountExists =
        accountType === "ADMIN"
            ? await Admin.exists({ userId: user._id })
            : accountType === "EMPLOYEE"
              ? await Employee.exists({ userId: user._id })
              : await Customer.exists({ userId: user._id });

    return accountExists ? user : null;
};

export const requestPasswordReset = async (
    email: string,
    accountType: PasswordRecoveryAccountType,
): Promise<void> => {
    const user = await findRecoveryUser(email, accountType);

    if (!user) {
        return;
    }

    try {
        await sendVerificationOtp({
            userId: user._id.toString(),
            channel: VERIFICATION_CHANNELS.EMAIL,
            purpose: VERIFICATION_PURPOSES.PASSWORD_RESET,
            target: email,
        });
    } catch (error) {
        if (
            error instanceof ApiError &&
            error.code === "OTP_RESEND_COOLDOWN"
        ) {
            return;
        }

        throw error;
    }
};

export const resetPassword = async (
    input: {
        readonly email: string;
        readonly code: string;
        readonly newPassword: string;
    },
    accountType: PasswordRecoveryAccountType,
): Promise<void> => {
    const user = await findRecoveryUser(input.email, accountType);

    if (!user) {
        throw ApiError.unauthorized(
            "The password reset code is invalid or expired.",
            { code: "INVALID_PASSWORD_RESET_CODE" },
        );
    }

    if (await verifyUserPassword(user, input.newPassword)) {
        throw ApiError.badRequest(
            "New password must be different from the current password.",
            { code: "PASSWORD_UNCHANGED" },
        );
    }

    await verifyVerificationOtp({
        userId: user._id.toString(),
        channel: VERIFICATION_CHANNELS.EMAIL,
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET,
        target: input.email,
        code: input.code,
    });

    user.password = await hashUserPassword(input.newPassword);
    user.passwordChangedAt = new Date();
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    await user.save();

    await revokeAllUserSessions(user._id.toString());
};
