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
} from "./invitation.model";

import {
    User,
} from "../users/user.model";

import {
    createUser,
} from "../users/user.service";

import {
    Role,
    ROLE_STATUSES,
} from "../roles/role.model";

import {
    Admin,
} from "../admins/admin.model";

import {
    createAdmin,
} from "../admins/admin.service";

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
    return email.trim().toLowerCase();
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
| Validate Invitation Role
|--------------------------------------------------------------------------
|
| OWNER cannot be created through invitation.
|
| Super Admin, Admin Manager, Staff and other
| active administrative roles may be invited
| by OWNER.
|
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
                    "_id name slug status isSystemRole",
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

        /*
        |--------------------------------------------------------------------------
        | OWNER is never created as an Admin.
        |--------------------------------------------------------------------------
        |
        | OWNER has a completely separate authentication
        | system and is created through the database seed.
        |
        */

        if (
            role.slug
                .trim()
                .toLowerCase() ===
            "owner"
        ) {
            throw ApiError.forbidden(
                "The OWNER role cannot be assigned through invitation.",
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
| Create Invitation
|--------------------------------------------------------------------------
| OWNER only
|--------------------------------------------------------------------------
*/

export interface CreateInvitationServiceInput
    extends CreateInvitationInput {
    readonly invitedBy: string;
}


export interface CreateInvitationResult {
    readonly invitationId: string;
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

        const roleId =
            validateObjectId(
                data.roleId,
                "Role ID",
            );

        const email =
            normalizeEmail(data.email);

        /*
        |--------------------------------------------------------------------------
        | Validate Role
        |--------------------------------------------------------------------------
        */

        await validateInvitationRole(
            roleId,
        );

        /*
        |--------------------------------------------------------------------------
        | Prevent Inviting Existing User
        |--------------------------------------------------------------------------
        */

        const existingUser =
            await User.exists({
                email,
            });

        if (existingUser) {
            throw ApiError.conflict(
                "A user with this email already exists.",
                {
                    code:
                        "USER_EMAIL_ALREADY_EXISTS",
                },
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Prevent Duplicate Pending Invitation
        |--------------------------------------------------------------------------
        */

        const existingInvitation =
            await Invitation.findOne({
                email,
                status:
                    INVITATION_STATUSES.PENDING,
                expiresAt: {
                    $gt: new Date(),
                },
            });

        if (existingInvitation) {
            throw ApiError.conflict(
                "A pending invitation already exists for this email.",
                {
                    code:
                        "PENDING_INVITATION_ALREADY_EXISTS",
                },
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Generate Secure Token
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
                email,

                name:
                    data.name.trim(),

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
| Find Invitation
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
                    "roleId",
                    "name slug description status isSystemRole",
                );

        if (!invitation) {
            throw ApiError.notFound(
                "Invitation not found.",
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
                    "roleId",
                    "name slug description status isSystemRole",
                );

        if (!invitation) {
            throw ApiError.badRequest(
                "Invalid invitation token.",
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
                "This invitation is no longer active.",
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
            );

            throw ApiError.badRequest(
                "This invitation has expired.",
                {
                    code:
                        "INVITATION_EXPIRED",
                },
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Validate Assigned Role
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
| Public invitation acceptance creates:
|
| User
|   ↓
| Admin
|   ↓
| Role
|
| No Employee record is created.
|
|--------------------------------------------------------------------------
*/

export interface AcceptInvitationResult {
    readonly userId: string;
    readonly adminId: string;
    readonly invitationId: string;
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
        | Invitation Role
        |--------------------------------------------------------------------------
        */

        const role =
            await validateInvitationRole(
                invitation.roleId,
            );

        const roleId =
            role._id;

        const email =
            invitation.email;

        /*
        |--------------------------------------------------------------------------
        | Re-check Email Uniqueness
        |--------------------------------------------------------------------------
        */

        const existingUser =
            await User.exists({
                email,
            });

        if (existingUser) {
            throw ApiError.conflict(
                "A user with this email already exists.",
                {
                    code:
                        "USER_EMAIL_ALREADY_EXISTS",
                },
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Create User Account
        |--------------------------------------------------------------------------
        */

        const user =
            await createUser({
                name:
                    data.name?.trim() ||
                    invitation.name,

                email,

                password:
                    data.password,

                ...(data.phone
                    ? {
                          phone:
                              data.phone.trim(),
                      }
                    : {}),
            });

        /*
        |--------------------------------------------------------------------------
        | Create Admin Account
        |--------------------------------------------------------------------------
        |
        | createAdmin() validates:
        |
        | - Role exists
        | - Role is active
        | - OWNER cannot be assigned
        | - User cannot have duplicate Admin
        |
        */

        let admin;

        try {
            admin =
                await createAdmin({
                    userId:
                        user._id.toString(),

                    roleId:
                        roleId.toString(),
                });
        } catch (error) {
            /*
            |--------------------------------------------------------------------------
            | Rollback User
            |--------------------------------------------------------------------------
            */

            await User.deleteOne({
                _id:
                    user._id,
            });

            throw error;
        }

        /*
        |--------------------------------------------------------------------------
        | Mark Invitation Accepted
        |--------------------------------------------------------------------------
        */

        const updatedInvitation =
            await Invitation.findOneAndUpdate(
                {
                    _id:
                        invitation._id,

                    status:
                        INVITATION_STATUSES.PENDING,
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
            );

        if (!updatedInvitation) {
            /*
            |--------------------------------------------------------------------------
            | Rollback Created Records
            |--------------------------------------------------------------------------
            */

            await Admin.deleteOne({
                _id:
                    admin._id,
            });

            await User.deleteOne({
                _id:
                    user._id,
            });

            throw ApiError.conflict(
                "This invitation has already been processed.",
                {
                    code:
                        "INVITATION_ALREADY_PROCESSED",
                },
            );
        }

        return {
            userId:
                user._id.toString(),

            adminId:
                admin._id.toString(),

            invitationId:
                invitation._id.toString(),

            email:
                user.email!,

            name:
                user.name,

            roleId:
                roleId.toString(),

            role:
                role.slug,
        };
    };


/*
|--------------------------------------------------------------------------
| Revoke Invitation
|--------------------------------------------------------------------------
| OWNER only
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

        const ownerId =
            validateObjectId(
                revokedBy,
                "Revoked by",
            );

        const invitation =
            await Invitation.findById(
                _id,
            );

        if (!invitation) {
            throw ApiError.notFound(
                "Invitation not found.",
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
                "Only pending invitations can be revoked.",
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
            ownerId;

        await invitation.save();

        return invitation;
    };
