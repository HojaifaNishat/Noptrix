import {
    createHash,
    randomBytes,
} from "crypto";

import bcrypt from "bcryptjs";
import { Types } from "mongoose";

import {
    AdminInvitation,
    ADMIN_INVITATION_STATUSES,
} from "./admin-invitation.model";
import { Employee, EMPLOYEE_STATUSES } from "../employees/employee.model";
import { User } from "../users/user.model";
import { Role, ROLE_STATUSES } from "../roles/role.model";
import { Admin, ADMIN_STATUSES } from "../admins/admin.model";
import { ApiError } from "../../utils/ApiError";
import { env } from "../../config/env";
import { createOtp, compareOtp, deliverOtp } from "../../services/otp.service";
import { getOtpConfig } from "../../config/otp";
import { sendEmail } from "../../services/email.service";

const EXPIRY_HOURS = 48;
const PASSWORD_SALT_ROUNDS = 12;

const hashToken = (token: string): string =>
    createHash("sha256").update(token).digest("hex");

const normalizeEmail = (email: string): string =>
    email.trim().toLowerCase();

const requireAdminRole = async (roleId: string) => {
    if (!Types.ObjectId.isValid(roleId)) {
        throw ApiError.badRequest("Role ID is invalid.", {
            code: "ROLE_ID_INVALID",
        });
    }

    const role = await Role.findById(roleId).exec();
    if (!role || role.status !== ROLE_STATUSES.ACTIVE) {
        throw ApiError.badRequest("Select an active administrator role.", {
            code: "ADMIN_INVITATION_ROLE_INVALID",
        });
    }

    const slug = role.slug.trim().toLowerCase().replace(/_/g, "-");
    if (!["admin", "administrator", "super-admin", "super-administrator"].includes(slug)) {
        throw ApiError.badRequest("Only Administrator and Super Administrator roles can be invited.", {
            code: "ADMIN_INVITATION_ROLE_NOT_ALLOWED",
        });
    }

    return role;
};

export const createAdminInvitation = async (input: {
    employeeId: string;
    roleId: string;
    invitedBy: string;
}) => {
    if (
        !Types.ObjectId.isValid(input.employeeId) ||
        !Types.ObjectId.isValid(input.invitedBy)
    ) {
        throw ApiError.badRequest("Employee or inviter ID is invalid.", {
            code: "ADMIN_INVITATION_ID_INVALID",
        });
    }

    const employee = await Employee.findById(input.employeeId).exec();
    if (!employee || employee.status !== EMPLOYEE_STATUSES.ACTIVE) {
        throw ApiError.notFound("Active employee not found.", {
            code: "EMPLOYEE_NOT_FOUND",
        });
    }

    if (employee.roleId.toString() !== input.roleId) {
        throw ApiError.conflict("Promote the employee to this role before sending the invitation.", {
            code: "EMPLOYEE_ROLE_MISMATCH",
        });
    }

    const role = await requireAdminRole(input.roleId);
    const user = await User.findById(employee.userId)
        .select("name email")
        .exec();
    if (!user?.email?.trim()) {
        throw ApiError.badRequest("The employee needs an email address before receiving an admin invitation.", {
            code: "EMPLOYEE_EMAIL_REQUIRED",
        });
    }

    const pending = await AdminInvitation.findOne({
        employeeId: employee._id,
        status: ADMIN_INVITATION_STATUSES.PENDING,
        expiresAt: { $gt: new Date() },
    }).exec();
    if (pending) {
        throw ApiError.conflict("This employee already has a pending admin invitation.", {
            code: "ADMIN_INVITATION_ALREADY_PENDING",
        });
    }

    const token = randomBytes(32).toString("hex");
    const invitation = await AdminInvitation.create({
        employeeId: employee._id,
        userId: user._id,
        roleId: role._id,
        invitedBy: new Types.ObjectId(input.invitedBy),
        email: normalizeEmail(user.email),
        name: user.name?.trim() || "Employee",
        tokenHash: hashToken(token),
        status: ADMIN_INVITATION_STATUSES.PENDING,
        expiresAt: new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000),
    });

    const actionUrl =
        `${env.APP_URL.replace(/\/+$/, "")}/admin-invitation/${token}`;
    try {
        await sendEmail({
            to: invitation.email,
            subject: `Admin account invitation for ${env.APP_NAME}`,
            text:
                `Hello ${invitation.name},\n\n` +
                `You have been invited to set up an ${role.name} account for ${env.APP_NAME}.\n\n` +
                `Accept your invitation here: ${actionUrl}\n\n` +
                `This invitation expires in ${EXPIRY_HOURS} hours.`,
        });
    } catch (error) {
        await AdminInvitation.updateOne(
            {
                _id: invitation._id,
                status: ADMIN_INVITATION_STATUSES.PENDING,
            },
            {
                $set: {
                    status: ADMIN_INVITATION_STATUSES.REVOKED,
                },
            },
        ).exec();
        throw error;
    }

    return {
        invitationId: invitation._id.toString(),
        employeeId: employee._id.toString(),
        email: invitation.email,
        name: invitation.name,
        roleId: role._id.toString(),
        roleName: role.name,
        expiresAt: invitation.expiresAt,
        token,
    };
};

export const getAdminInvitationByToken = async (token: string) => {
    const invitation = await AdminInvitation.findOne({
        tokenHash: hashToken(token),
    })
        .populate("roleId", "name slug")
        .exec();

    if (!invitation || invitation.status === ADMIN_INVITATION_STATUSES.REVOKED) {
        throw ApiError.notFound("Admin invitation not found.", {
            code: "ADMIN_INVITATION_NOT_FOUND",
        });
    }

    if (
        invitation.status === ADMIN_INVITATION_STATUSES.PENDING &&
        invitation.expiresAt.getTime() <= Date.now()
    ) {
        invitation.status = ADMIN_INVITATION_STATUSES.EXPIRED;
        await invitation.save();
    }

    return invitation;
};

export const requestAdminInvitationOtp = async (
    token: string,
    channel: "EMAIL" | "PHONE",
) => {
    const invitation = await getAdminInvitationByToken(token);
    if (invitation.status !== ADMIN_INVITATION_STATUSES.PENDING) {
        throw ApiError.badRequest("This admin invitation is no longer active.", {
            code: "ADMIN_INVITATION_NOT_PENDING",
        });
    }

    const user = await User.findById(invitation.userId).select("email phone name").exec();
    if (!user) {
        throw ApiError.notFound("Employee account not found.", {
            code: "EMPLOYEE_USER_NOT_FOUND",
        });
    }

    const target =
        channel === "EMAIL"
            ? normalizeEmail(invitation.email)
            : user.phone?.trim() ?? "";
    if (!target) {
        throw ApiError.badRequest("No phone number is available for verification.", {
            code: "ADMIN_INVITATION_PHONE_MISSING",
        });
    }

    if (
        channel === "EMAIL" &&
        normalizeEmail(user.email ?? "") !== target
    ) {
        throw ApiError.conflict("The invitation email no longer matches the employee account.", {
            code: "ADMIN_INVITATION_EMAIL_MISMATCH",
        });
    }

    const policy = getOtpConfig();
    if (
        invitation.onboardingOtpSentAt &&
        Date.now() < invitation.onboardingOtpSentAt.getTime() + policy.resendCooldownSeconds * 1000
    ) {
        throw ApiError.tooManyRequests("Please wait before requesting another verification code.", {
            code: "OTP_RESEND_COOLDOWN",
        });
    }

    const otp = createOtp();
    await deliverOtp({
        channel: channel === "EMAIL" ? "email" : "sms",
        destination: target,
        code: otp.code,
        purpose: channel === "EMAIL" ? "email_verification" : "phone_verification",
        recipientName: user.name,
    });

    invitation.onboardingOtpHash = otp.hash;
    invitation.onboardingOtpChannel = channel;
    invitation.onboardingOtpTarget = target;
    invitation.onboardingOtpExpiresAt = otp.expiresAt;
    invitation.onboardingOtpSentAt = new Date();
    invitation.onboardingOtpAttempts = 0;
    await invitation.save();

    return { channel, expiresAt: otp.expiresAt };
};

export const acceptAdminInvitation = async (input: {
    token: string;
    channel: "EMAIL" | "PHONE";
    code: string;
    password: string;
}) => {
    const invitation = await getAdminInvitationByToken(input.token);
    if (invitation.status !== ADMIN_INVITATION_STATUSES.PENDING) {
        throw ApiError.badRequest("This admin invitation is no longer active.", {
            code: "ADMIN_INVITATION_NOT_PENDING",
        });
    }

    const policy = getOtpConfig();
    if (
        !invitation.onboardingOtpHash ||
        invitation.onboardingOtpChannel !== input.channel ||
        !invitation.onboardingOtpExpiresAt ||
        invitation.onboardingOtpExpiresAt.getTime() <= Date.now() ||
        invitation.onboardingOtpAttempts >= policy.maxAttempts
    ) {
        throw ApiError.badRequest("Request a new verification code before accepting this invitation.", {
            code: "ADMIN_INVITATION_OTP_REQUIRED",
        });
    }

    if (!compareOtp(input.code, invitation.onboardingOtpHash)) {
        invitation.onboardingOtpAttempts += 1;
        await invitation.save();
        throw ApiError.badRequest("The verification code is incorrect.", {
            code: "INVALID_OTP",
        });
    }

    const [employee, user, role] = await Promise.all([
        Employee.findOne({
            _id: invitation.employeeId,
            userId: invitation.userId,
            status: EMPLOYEE_STATUSES.ACTIVE,
            roleId: invitation.roleId,
        }).exec(),
        User.findById(invitation.userId).exec(),
        requireAdminRole(invitation.roleId.toString()),
    ]);
    if (!employee || !user) {
        throw ApiError.conflict("The promoted employee account is no longer active.", {
            code: "ADMIN_INVITATION_EMPLOYEE_INACTIVE",
        });
    }

    const accepted = await AdminInvitation.findOneAndUpdate(
        {
            _id: invitation._id,
            status: ADMIN_INVITATION_STATUSES.PENDING,
            expiresAt: { $gt: new Date() },
        },
        {
            $set: {
                status: ADMIN_INVITATION_STATUSES.ACCEPTED,
                acceptedAt: new Date(),
            },
            $unset: {
                onboardingOtpHash: 1,
                onboardingOtpChannel: 1,
                onboardingOtpTarget: 1,
                onboardingOtpExpiresAt: 1,
                onboardingOtpSentAt: 1,
                onboardingOtpAttempts: 1,
            },
        },
        { new: true },
    ).exec();
    if (!accepted) {
        throw ApiError.conflict("This admin invitation has already been accepted.", {
            code: "ADMIN_INVITATION_ALREADY_ACCEPTED",
        });
    }

    const previousPassword = user.password;
    const previousPasswordChangedAt = user.passwordChangedAt;
    const previousEmailVerified = user.isEmailVerified;
    const previousPhoneVerified = user.isPhoneVerified;
    try {
        user.password = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
        user.passwordChangedAt = new Date();
        if (input.channel === "EMAIL") user.isEmailVerified = true;
        if (input.channel === "PHONE") user.isPhoneVerified = true;
        await user.save();

        await Admin.findOneAndUpdate(
            { userId: user._id },
            {
                $set: {
                    roleId: role._id,
                    status: ADMIN_STATUSES.ACTIVE,
                },
                $setOnInsert: {
                    userId: user._id,
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        ).exec();
    } catch (error) {
        user.password = previousPassword;
        user.passwordChangedAt = previousPasswordChangedAt;
        user.isEmailVerified = previousEmailVerified;
        user.isPhoneVerified = previousPhoneVerified;
        await user.save();
        await AdminInvitation.updateOne(
            { _id: accepted._id, status: ADMIN_INVITATION_STATUSES.ACCEPTED },
            { $set: { status: ADMIN_INVITATION_STATUSES.PENDING }, $unset: { acceptedAt: 1 } },
        ).exec();
        throw error;
    }

    return {
        invitationId: accepted._id.toString(),
        userId: user._id.toString(),
        email: user.email,
        roleId: role._id.toString(),
        roleName: role.name,
    };
};
