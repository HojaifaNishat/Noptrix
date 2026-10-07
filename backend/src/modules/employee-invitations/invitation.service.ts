import {
    createHash,
    randomBytes,
} from "crypto";

import {
    Types,
} from "mongoose";

import {
    Invitation,
    INVITATION_STATUSES,
    type InvitationStatus,
} from "./invitation.model";

import {
    JobApplication,
} from "../job-applications/application.model";

import {
    User,
} from "../users/user.model";

import {
    Role,
    ROLE_STATUSES,
} from "../roles/role.model";

import {
    Employee,
} from "../employees/employee.model";

import {
    createEmployee,
} from "../employees/employee.service";

import {
    ApiError,
} from "../../utils/ApiError";

import {
    AcceptInvitationInput,
    CreateInvitationInput,
} from "./invitation.validator";


/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const INVITATION_EXPIRY_HOURS = 48;

const INVITATION_TOKEN_BYTES = 32;


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normalizeEmail = (
    email: string,
): string => {
    return email
        .trim()
        .toLowerCase();
};


const validateObjectId = (
    value: string,
    fieldName: string,
): Types.ObjectId => {
    if (!Types.ObjectId.isValid(value)) {
        throw ApiError.badRequest(
            `${fieldName} is invalid.`,
            {
                code: `${fieldName
                    .replace(/\s+/g, "_")
                    .toUpperCase()}_INVALID`,
            },
        );
    }

    return new Types.ObjectId(value);
};


const generateInvitationToken =
    (): string => {
        return randomBytes(
            INVITATION_TOKEN_BYTES,
        ).toString("hex");
    };


const hashInvitationToken = (
    token: string,
): string => {
    return createHash("sha256")
        .update(token)
        .digest("hex");
};


const getInvitationExpiryDate =
    (): Date => {
        return new Date(
            Date.now() +
                INVITATION_EXPIRY_HOURS *
                    60 *
                    60 *
                    1000,
        );
    };


/*
|--------------------------------------------------------------------------
| Validate Role
|--------------------------------------------------------------------------
*/

const validateInvitationRole =
    async (
        roleId: Types.ObjectId,
    ) => {
        const role =
            await Role.findById(
                roleId,
            )
                .select(
                    "_id name slug description status isSystemRole",
                )
                .lean()
                .exec();

        if (!role) {
            throw ApiError.badRequest(
                "The selected role does not exist.",
                {
                    code:
                        "INVITATION_ROLE_NOT_FOUND",
                },
            );
        }

        if (
            role.status !==
            ROLE_STATUSES.ACTIVE
        ) {
            throw ApiError.badRequest(
                "The selected role is inactive.",
                {
                    code:
                        "INVITATION_ROLE_INACTIVE",
                },
            );
        }

        if (
            role.slug
                .trim()
                .toLowerCase() ===
            "owner"
        ) {
            throw ApiError.forbidden(
                "The OWNER role cannot be assigned through employee invitation.",
                {
                    code:
                        "INVITATION_OWNER_ROLE_NOT_ALLOWED",
                },
            );
        }

        return role;
    };


/*
|--------------------------------------------------------------------------
| Validate Selected Application
|--------------------------------------------------------------------------
*/

const getSelectedApplication =
    async (
        applicationId: Types.ObjectId,
    ) => {
        const application =
            await JobApplication.findById(
                applicationId,
            ).exec();

        if (!application) {
            throw ApiError.notFound(
                "Job application not found.",
                {
                    code:
                        "JOB_APPLICATION_NOT_FOUND",
                },
            );
        }

        if (
            application.status !==
            "SELECTED"
        ) {
            throw ApiError.badRequest(
                "Only a selected job application can receive an employee invitation.",
                {
                    code:
                        "APPLICATION_NOT_SELECTED",
                },
            );
        }

        return application;
    };


/*
|--------------------------------------------------------------------------
| Create Invitation
|--------------------------------------------------------------------------
*/

export interface CreateInvitationServiceInput
    extends CreateInvitationInput {
    readonly invitedBy: string;
}


export interface CreateInvitationResult {
    readonly invitationId: string;
    readonly applicationId: string;
    readonly applicantId: string;
    readonly email: string;
    readonly name: string;
    readonly roleId: string;
    readonly expiresAt: Date;
    readonly token: string;
}


export const createInvitation =
    async (
        data: CreateInvitationServiceInput,
    ): Promise<CreateInvitationResult> => {
        const invitedBy =
            validateObjectId(
                data.invitedBy,
                "Invited by",
            );

        const applicationId =
            validateObjectId(
                data.applicationId,
                "Application ID",
            );

        const roleId =
            validateObjectId(
                data.roleId,
                "Role ID",
            );

        /*
        |--------------------------------------------------------------------------
        | Selected Application
        |--------------------------------------------------------------------------
        */

        const application =
            await getSelectedApplication(
                applicationId,
            );

        /*
        |--------------------------------------------------------------------------
        | Role
        |--------------------------------------------------------------------------
        */

        await validateInvitationRole(
            roleId,
        );

        /*
        |--------------------------------------------------------------------------
        | Candidate User
        |--------------------------------------------------------------------------
        */

        const applicant =
            await User.findById(
                application.applicantId,
            ).exec();

        if (!applicant) {
            throw ApiError.badRequest(
                "The applicant user account no longer exists.",
                {
                    code:
                        "APPLICANT_USER_NOT_FOUND",
                },
            );
        }

        const email =
            normalizeEmail(
                application.email,
            );

        /*
        |--------------------------------------------------------------------------
        | Application/User Email Consistency
        |--------------------------------------------------------------------------
        */

        const applicantEmail =
            normalizeEmail(
                applicant.email ?? "",
            );

        if (
            applicantEmail &&
            applicantEmail !== email
        ) {
            throw ApiError.conflict(
                "The job application email does not match the applicant account email.",
                {
                    code:
                        "APPLICATION_USER_EMAIL_MISMATCH",
                },
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Existing Employee
        |--------------------------------------------------------------------------
        */

        const existingEmployee =
            await Employee.exists({
                userId:
                    application.applicantId,
            });

        if (existingEmployee) {
            throw ApiError.conflict(
                "This applicant is already an employee.",
                {
                    code:
                        "APPLICANT_ALREADY_EMPLOYEE",
                },
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Existing Pending Invitation
        |--------------------------------------------------------------------------
        */

        const existingInvitation =
            await Invitation.findOne({
                applicationId,
                status:
                    INVITATION_STATUSES.PENDING,
                expiresAt: {
                    $gt: new Date(),
                },
            }).exec();

        if (existingInvitation) {
            throw ApiError.conflict(
                "A pending employee invitation already exists for this application.",
                {
                    code:
                        "PENDING_EMPLOYEE_INVITATION_EXISTS",
                },
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Generate Token
        |--------------------------------------------------------------------------
        */

        const token =
            generateInvitationToken();

        const tokenHash =
            hashInvitationToken(
                token,
            );

        const expiresAt =
            getInvitationExpiryDate();

        /*
        |--------------------------------------------------------------------------
        | Create Invitation
        |--------------------------------------------------------------------------
        */

        const invitation =
            await Invitation.create({
                applicationId,

                email,

                name:
                    application.name.trim(),

                tokenHash,

                invitedBy,

                roleId,

                status:
                    INVITATION_STATUSES.PENDING,

                expiresAt,
            });

        return {
            invitationId:
                invitation._id.toString(),

            applicationId:
                invitation.applicationId.toString(),

            applicantId:
                application.applicantId.toString(),

            email:
                invitation.email,

            name:
                invitation.name,

            roleId:
                invitation.roleId.toString(),

            expiresAt:
                invitation.expiresAt,

            token,
        };
    };


/*
|--------------------------------------------------------------------------
| Get Invitation By ID
|--------------------------------------------------------------------------
*/

export const getInvitationById =
    async (
        invitationId: string,
    ) => {
        const _id =
            validateObjectId(
                invitationId,
                "Invitation ID",
            );

        const invitation =
            await Invitation.findById(
                _id,
            )
                .populate(
                    "applicationId",
                )
                .populate(
                    "roleId",
                    "name slug description status isSystemRole",
                )
                .populate(
                    "acceptedUserId",
                    "name email phone",
                )
                .populate(
                    "acceptedEmployeeId",
                )
                .exec();

        if (!invitation) {
            throw ApiError.notFound(
                "Employee invitation not found.",
                {
                    code:
                        "INVITATION_NOT_FOUND",
                },
            );
        }

        return invitation;
    };


/*
|--------------------------------------------------------------------------
| Validate Invitation Token
|--------------------------------------------------------------------------
*/

export const getInvitationByToken =
    async (
        token: string,
    ) => {
        const normalizedToken =
            token.trim();

        if (!normalizedToken) {
            throw ApiError.badRequest(
                "Invitation token is required.",
                {
                    code:
                        "INVITATION_TOKEN_REQUIRED",
                },
            );
        }

        const tokenHash =
            hashInvitationToken(
                normalizedToken,
            );

        const invitation =
            await Invitation.findOne({
                tokenHash,
            })
                .select(
                    "+tokenHash",
                )
                .populate(
                    "applicationId",
                )
                .populate(
                    "roleId",
                    "name slug description status isSystemRole",
                )
                .exec();

        if (!invitation) {
            throw ApiError.badRequest(
                "Invalid employee invitation token.",
                {
                    code:
                        "INVITATION_TOKEN_INVALID",
                },
            );
        }

        if (
            invitation.status !==
            INVITATION_STATUSES.PENDING
        ) {
            throw ApiError.badRequest(
                "This employee invitation is no longer active.",
                {
                    code:
                        "INVITATION_NOT_PENDING",
                },
            );
        }

        if (
            invitation.expiresAt.getTime() <=
            Date.now()
        ) {
            await Invitation.updateOne(
                {
                    _id:
                        invitation._id,

                    status:
                        INVITATION_STATUSES.PENDING,
                },
                {
                    $set: {
                        status:
                            INVITATION_STATUSES.EXPIRED,
                    },
                },
            ).exec();

            throw ApiError.badRequest(
                "This employee invitation has expired.",
                {
                    code:
                        "INVITATION_EXPIRED",
                },
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Validate Application
        |--------------------------------------------------------------------------
        */

        await getSelectedApplication(
            invitation.applicationId,
        );

        /*
        |--------------------------------------------------------------------------
        | Validate Role
        |--------------------------------------------------------------------------
        */

        await validateInvitationRole(
            invitation.roleId,
        );

        return invitation;
    };


/*
|--------------------------------------------------------------------------
| Accept Invitation
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| The applicant already has a User account.
|
| Therefore acceptance does NOT:
|
| - create another User
| - create an Admin
|
| It creates only the Employee profile
| for the existing applicant User.
|
|--------------------------------------------------------------------------
*/

export interface AcceptInvitationResult {
    readonly userId: string;
    readonly employeeId: string;
    readonly invitationId: string;
    readonly applicationId: string;
    readonly email: string;
    readonly name: string;
    readonly roleId: string;
    readonly role: string;
}


export const acceptInvitation =
    async (
        data: AcceptInvitationInput,
    ): Promise<AcceptInvitationResult> => {
        const invitation =
            await getInvitationByToken(
                data.token,
            );

        /*
        |--------------------------------------------------------------------------
        | Application
        |--------------------------------------------------------------------------
        */

        const application =
            await getSelectedApplication(
                invitation.applicationId,
            );

        /*
        |--------------------------------------------------------------------------
        | Role
        |--------------------------------------------------------------------------
        */

        const role =
            await validateInvitationRole(
                invitation.roleId,
            );

        /*
        |--------------------------------------------------------------------------
        | Existing Applicant User
        |--------------------------------------------------------------------------
        */

        const user =
            await User.findById(
                application.applicantId,
            ).exec();

        if (!user) {
            throw ApiError.badRequest(
                "The applicant user account no longer exists.",
                {
                    code:
                        "APPLICANT_USER_NOT_FOUND",
                },
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Email Verification
        |--------------------------------------------------------------------------
        */

        const invitationEmail =
            normalizeEmail(
                invitation.email,
            );

        const userEmail =
            normalizeEmail(
                user.email ?? "",
            );

        if (
            !userEmail ||
            userEmail !== invitationEmail
        ) {
            throw ApiError.conflict(
                "The invitation email does not match the applicant user account.",
                {
                    code:
                        "INVITATION_USER_EMAIL_MISMATCH",
                },
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Existing Employee
        |--------------------------------------------------------------------------
        */

        const existingEmployee =
            await Employee.findOne({
                userId:
                    user._id,
            }).exec();

        if (existingEmployee) {
            throw ApiError.conflict(
                "This applicant is already an employee.",
                {
                    code:
                        "APPLICANT_ALREADY_EMPLOYEE",
                },
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Prevent Double Acceptance
        |--------------------------------------------------------------------------
        */

        const lockedInvitation =
            await Invitation.findOneAndUpdate(
                {
                    _id:
                        invitation._id,

                    status:
                        INVITATION_STATUSES.PENDING,

                    expiresAt: {
                        $gt: new Date(),
                    },
                },
                {
                    $set: {
                        status:
                            INVITATION_STATUSES.ACCEPTED,

                        acceptedAt:
                            new Date(),

                        acceptedUserId:
                            user._id,
                    },
                },
                {
                    new: true,
                },
            ).exec();

        if (!lockedInvitation) {
            throw ApiError.conflict(
                "This employee invitation has already been processed.",
                {
                    code:
                        "INVITATION_ALREADY_PROCESSED",
                },
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Create Employee
        |--------------------------------------------------------------------------
        */

        let employee;

        try {
            employee =
                await createEmployee({
                    userId:
                        user._id.toString(),

                    roleId:
                        role._id.toString(),

                    employmentType:
                        "FULL_TIME",

                    employeeCode:
                        `EMP-${randomBytes(
                            5,
                        )
                            .toString("hex")
                            .toUpperCase()}`,

                    department:
                        undefined,

                    jobTitle:
                        undefined,

                    joiningDate:
                        new Date(),

                    salary:
                        undefined,

                    emergencyContactName:
                        undefined,

                    emergencyContactPhone:
                        undefined,

                    notes:
                        `Onboarded through employee invitation ${invitation._id.toString()}.`,
                });
        } catch (error) {
            /*
            |--------------------------------------------------------------------------
            | Rollback Invitation
            |--------------------------------------------------------------------------
            */

            await Invitation.updateOne(
                {
                    _id:
                        invitation._id,

                    status:
                        INVITATION_STATUSES.ACCEPTED,

                    acceptedUserId:
                        user._id,
                },
                {
                    $set: {
                        status:
                            INVITATION_STATUSES.PENDING,
                    },

                    $unset: {
                        acceptedAt: 1,
                        acceptedUserId: 1,
                        acceptedEmployeeId: 1,
                    },
                },
            ).exec();

            throw error;
        }

        /*
        |--------------------------------------------------------------------------
        | Link Employee
        |--------------------------------------------------------------------------
        */

        await Invitation.updateOne(
            {
                _id:
                    invitation._id,

                status:
                    INVITATION_STATUSES.ACCEPTED,

                acceptedUserId:
                    user._id,
            },
            {
                $set: {
                    acceptedEmployeeId:
                        employee._id,
                },
            },
        ).exec();

        return {
            userId:
                user._id.toString(),

            employeeId:
                employee._id.toString(),

            invitationId:
                invitation._id.toString(),

            applicationId:
                application._id.toString(),

            email:
                user.email!,

            name:
                user.name,

            roleId:
                role._id.toString(),

            role:
                role.slug,
        };
    };


/*
|--------------------------------------------------------------------------
| List Employee Invitations
|--------------------------------------------------------------------------
|
| Supports:
| - Pagination
| - Status filtering
| - Candidate/email search
| - Application filtering
| - Role filtering
|
| Pending invitations whose expiration time has passed are automatically
| marked EXPIRED before the result is returned.
|--------------------------------------------------------------------------
*/

export interface ListInvitationsInput {
    readonly page?: number;
    readonly limit?: number;
    readonly status?: InvitationStatus;
    readonly search?: string;
    readonly applicationId?: string;
    readonly roleId?: string;
}

export interface ListInvitationsResult {
    readonly invitations: unknown[];
    readonly pagination: {
        readonly page: number;
        readonly limit: number;
        readonly total: number;
        readonly totalPages: number;
        readonly hasNextPage: boolean;
        readonly hasPreviousPage: boolean;
    };
}

export const listInvitations =
    async (
        data: ListInvitationsInput = {},
    ): Promise<ListInvitationsResult> => {
        const page =
            Number.isFinite(data.page) && (data.page ?? 1) > 0
                ? Math.floor(data.page!)
                : 1;

        const limit =
            Number.isFinite(data.limit) &&
            (data.limit ?? 20) > 0
                ? Math.min(
                    Math.floor(data.limit!),
                    100,
                )
                : 20;

        const normalizedSearch =
            typeof data.search === "string"
                ? data.search.trim()
                : "";

        const filter: Record<string, unknown> = {};

        if (data.status) {
            filter.status = data.status;
        }

        if (data.applicationId) {
            filter.applicationId =
                validateObjectId(
                    data.applicationId,
                    "Application ID",
                );
        }

        if (data.roleId) {
            filter.roleId =
                validateObjectId(
                    data.roleId,
                    "Role ID",
                );
        }

        if (normalizedSearch) {
            filter.$or = [
                {
                    name: {
                        $regex: normalizedSearch,
                        $options: "i",
                    },
                },
                {
                    email: {
                        $regex: normalizedSearch,
                        $options: "i",
                    },
                },
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Automatically expire stale pending invitations
        |--------------------------------------------------------------------------
        */

        await Invitation.updateMany(
            {
                status:
                    INVITATION_STATUSES.PENDING,

                expiresAt: {
                    $lte: new Date(),
                },
            },
            {
                $set: {
                    status:
                        INVITATION_STATUSES.EXPIRED,
                },
            },
        ).exec();

        const skip =
            (page - 1) * limit;

        const [
            invitations,
            total,
        ] = await Promise.all([
            Invitation.find(filter)
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
                .populate(
                    "applicationId",
                )
                .populate(
                    "roleId",
                    "name slug description status isSystemRole",
                )
                .populate(
                    "invitedBy",
                    "name email",
                )
                .populate(
                    "acceptedUserId",
                    "name email phone",
                )
                .populate(
                    "acceptedEmployeeId",
                )
                .populate(
                    "revokedBy",
                    "name email",
                )
                .exec(),

            Invitation.countDocuments(
                filter,
            ),
        ]);

        const totalPages =
            total === 0
                ? 0
                : Math.ceil(
                    total / limit,
                );

        return {
            invitations,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage:
                    page < totalPages,
                hasPreviousPage:
                    page > 1 &&
                    totalPages > 0,
            },
        };
    };


/*
|--------------------------------------------------------------------------
| Revoke Invitation
|--------------------------------------------------------------------------
*/

export const revokeInvitation =
    async (
        invitationId: string,
        revokedBy: string,
    ) => {
        const _id =
            validateObjectId(
                invitationId,
                "Invitation ID",
            );

        const revokedById =
            validateObjectId(
                revokedBy,
                "Revoked by",
            );

        const invitation =
            await Invitation.findById(
                _id,
            ).exec();

        if (!invitation) {
            throw ApiError.notFound(
                "Employee invitation not found.",
                {
                    code:
                        "INVITATION_NOT_FOUND",
                },
            );
        }

        if (
            invitation.status !==
            INVITATION_STATUSES.PENDING
        ) {
            throw ApiError.badRequest(
                "Only pending employee invitations can be revoked.",
                {
                    code:
                        "INVITATION_NOT_PENDING",
                },
            );
        }

        invitation.status =
            INVITATION_STATUSES.REVOKED;

        invitation.revokedAt =
            new Date();

        invitation.revokedBy =
            revokedById;

        await invitation.save();

        return invitation;
    };
