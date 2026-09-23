import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { User, USER_STATUSES } from "../users/user.model";
import { Role } from "../roles/role.model";
import { Employee, EMPLOYEE_STATUSES } from "../employees/employee.model";
import { EmployeeInvitation, INVITATION_STATUSES } from "./employee-invitation.model";
import type { AcceptEmployeeInvitationInput, CreateEmployeeInvitationInput } from "./employee-invitation.validator";
import { ApiError } from "../../utils/ApiError";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const createEmployeeInvitation = async (
    input: CreateEmployeeInvitationInput,
    invitedBy: string
) => {
    if (!Types.ObjectId.isValid(input.roleId)) {
        throw ApiError.badRequest("Invalid role ID.");
    }

    const role = await Role.findOne({ _id: input.roleId, status: "ACTIVE" });
    if (!role) throw ApiError.badRequest("An active role is required for an invitation.");

    if (await User.exists({ email: input.email })) {
        throw ApiError.conflict("An account with this email already exists.");
    }

    const rawToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    await EmployeeInvitation.updateMany(
        { email: input.email, status: INVITATION_STATUSES.PENDING },
        { $set: { status: INVITATION_STATUSES.EXPIRED } }
    );

    await EmployeeInvitation.create({
        ...input,
        invitedBy,
        expiresAt,
        tokenHash: hashToken(rawToken),
    });

    return { token: rawToken, expiresAt };
};

export const acceptEmployeeInvitation = async (
    input: AcceptEmployeeInvitationInput
) => {
    const invitation = await EmployeeInvitation.findOne({
        tokenHash: hashToken(input.token),
        status: INVITATION_STATUSES.PENDING,
    }).select("+tokenHash");

    if (!invitation) throw ApiError.badRequest("This employee invitation is invalid or already used.");
    if (invitation.expiresAt <= new Date()) {
        invitation.status = INVITATION_STATUSES.EXPIRED;
        await invitation.save();
        throw ApiError.badRequest("This employee invitation has expired.");
    }
    if (await User.exists({ email: invitation.email })) {
        throw ApiError.conflict("An account with this email already exists.");
    }

    const user = await User.create({
        name: input.name,
        email: invitation.email,
        password: await bcrypt.hash(input.password, 12),
        status: USER_STATUSES.ACTIVE,
        isEmailVerified: false,
        isPhoneVerified: false,
        failedLoginAttempts: 0,
    });

    const employee = await Employee.create({
        userId: user._id,
        roleId: invitation.roleId,
        status: EMPLOYEE_STATUSES.ACTIVE,
        employmentType: invitation.employmentType,
        employeeCode: invitation.employeeCode,
        department: invitation.department,
        jobTitle: invitation.jobTitle,
    });

    invitation.status = INVITATION_STATUSES.ACCEPTED;
    invitation.acceptedAt = new Date();
    await invitation.save();
    return employee;
};