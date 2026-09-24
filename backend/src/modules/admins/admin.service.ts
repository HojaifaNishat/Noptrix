import {
    Types,
} from "mongoose";

import {
    Admin,
    ADMIN_STATUSES,
    AdminStatus,
    IAdminDocument,
} from "./admin.model";

import {
    Role,
} from "../roles/role.model";

import {
    ApiError,
} from "../../utils/ApiError";


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface CreateAdminInput {
    readonly userId: string;

    readonly roleId: string;

    readonly createdBy?: string;
}

export interface UpdateAdminInput {
    readonly roleId?: string;

    readonly status?: AdminStatus;

    readonly updatedBy?: string;
}


/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const OWNER_ROLE_SLUG =
    "owner";

const ACTIVE_ROLE_STATUS =
    "ACTIVE";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const validateObjectId = (
    value: string,
    fieldName: string,
): Types.ObjectId => {
    if (
        !Types.ObjectId.isValid(
            value,
        )
    ) {
        throw ApiError.badRequest(
            `${fieldName} is invalid.`,
            {
                code: `${fieldName
                    .replace(
                        /\s+/g,
                        "_",
                    )
                    .toUpperCase()}_INVALID`,
            },
        );
    }

    return new Types.ObjectId(
        value,
    );
};


/*
|--------------------------------------------------------------------------
| Validate Admin Role
|--------------------------------------------------------------------------
*/

const requireValidAdminRole =
    async (
        roleId: string,
    ) => {
        const _id =
            validateObjectId(
                roleId,
                "Role ID",
            );

        const role =
            await Role.findById(
                _id,
            );

        if (!role) {
            throw ApiError.notFound(
                "Role not found.",
                {
                    code:
                        "ROLE_NOT_FOUND",
                },
            );
        }

        if (
            role.status !==
            ACTIVE_ROLE_STATUS
        ) {
            throw ApiError.badRequest(
                "Inactive roles cannot be assigned to an admin.",
                {
                    code:
                        "ROLE_INACTIVE",
                },
            );
        }

        /*
         * OWNER has a completely
         * separate authentication
         * system.
         */
        if (
            role.slug ===
            OWNER_ROLE_SLUG
        ) {
            throw ApiError.forbidden(
                "The OWNER role cannot be assigned to an admin.",
                {
                    code:
                        "OWNER_ROLE_NOT_ALLOWED_FOR_ADMIN",
                },
            );
        }

        return role;
    };


/*
|--------------------------------------------------------------------------
| Get All Admins
|--------------------------------------------------------------------------
*/

export const getAllAdmins =
    async (): Promise<
        IAdminDocument[]
    > => {
        return Admin.find({})
            .sort({
                createdAt: -1,
            });
    };


/*
|--------------------------------------------------------------------------
| Get Admin By ID
|--------------------------------------------------------------------------
*/

export const getAdminById =
    async (
        adminId: string,
    ): Promise<IAdminDocument> => {
        const _id =
            validateObjectId(
                adminId,
                "Admin ID",
            );

        const admin =
            await Admin.findById(
                _id,
            );

        if (!admin) {
            throw ApiError.notFound(
                "Admin not found.",
                {
                    code:
                        "ADMIN_NOT_FOUND",
                },
            );
        }

        return admin;
    };


/*
|--------------------------------------------------------------------------
| Get Admin By User ID
|--------------------------------------------------------------------------
*/

export const getAdminByUserId =
    async (
        userId: string,
    ): Promise<
        IAdminDocument | null
    > => {
        const _id =
            validateObjectId(
                userId,
                "User ID",
            );

        return Admin.findOne({
            userId: _id,
        });
    };


/*
|--------------------------------------------------------------------------
| Require Admin By User ID
|--------------------------------------------------------------------------
*/

export const requireAdminByUserId =
    async (
        userId: string,
    ): Promise<IAdminDocument> => {
        const admin =
            await getAdminByUserId(
                userId,
            );

        if (!admin) {
            throw ApiError.notFound(
                "Admin account not found.",
                {
                    code:
                        "ADMIN_ACCOUNT_NOT_FOUND",
                },
            );
        }

        return admin;
    };


/*
|--------------------------------------------------------------------------
| Create Admin
|--------------------------------------------------------------------------
*/

export const createAdmin =
    async (
        input: CreateAdminInput,
    ): Promise<IAdminDocument> => {
        const userId =
            validateObjectId(
                input.userId,
                "User ID",
            );

        const role =
            await requireValidAdminRole(
                input.roleId,
            );

        /*
         * Prevent duplicate admin
         * account for the same user.
         */
        const existingAdmin =
            await Admin.findOne({
                userId,
            });

        if (existingAdmin) {
            throw ApiError.conflict(
                "An admin account already exists for this user.",
                {
                    code:
                        "ADMIN_ALREADY_EXISTS",
                },
            );
        }

        /*
         * createdBy is trusted server-side
         * context, never client supplied.
         */
        const createdBy =
            input.createdBy
                ? validateObjectId(
                      input.createdBy,
                      "Created By",
                  )
                : undefined;

        const admin =
            await Admin.create({
                userId,
                roleId: role._id,
                status:
                    ADMIN_STATUSES.ACTIVE,
                createdBy,
            });

        return admin;
    };


/*
|--------------------------------------------------------------------------
| Update Admin
|--------------------------------------------------------------------------
*/

export const updateAdmin =
    async (
        adminId: string,
        input: UpdateAdminInput,
    ): Promise<IAdminDocument> => {
        const admin =
            await getAdminById(
                adminId,
            );

        if (
            input.roleId !==
            undefined
        ) {
            const role =
                await requireValidAdminRole(
                    input.roleId,
                );

            admin.roleId =
                role._id;
        }

        if (
            input.status !==
            undefined
        ) {
            admin.status =
                input.status;
        }

        if (
            input.updatedBy
        ) {
            admin.updatedBy =
                validateObjectId(
                    input.updatedBy,
                    "Updated By",
                );
        }

        await admin.save();

        return admin;
    };


/*
|--------------------------------------------------------------------------
| Record Successful Login
|--------------------------------------------------------------------------
*/

export const recordAdminLoginSuccess =
    async (
        adminId: string,
        ip?: string,
    ): Promise<IAdminDocument> => {
        const admin =
            await getAdminById(
                adminId,
            );

        admin.lastLoginAt =
            new Date();

        admin.lastLoginIp =
            ip?.trim() ||
            undefined;

        admin.failedLoginAttempts =
            0;

        admin.lockedUntil =
            undefined;

        await admin.save();

        return admin;
    };


/*
|--------------------------------------------------------------------------
| Record Failed Login
|--------------------------------------------------------------------------
*/

export const recordAdminLoginFailure =
    async (
        adminId: string,
        maxAttempts = 5,
        lockMinutes = 15,
    ): Promise<IAdminDocument> => {
        const admin =
            await getAdminById(
                adminId,
            );

        admin.failedLoginAttempts +=
            1;

        if (
            admin.failedLoginAttempts >=
            maxAttempts
        ) {
            admin.lockedUntil =
                new Date(
                    Date.now() +
                        lockMinutes *
                            60 *
                            1000,
                );

            /*
             * Reset counter after
             * applying the lock.
             */
            admin.failedLoginAttempts =
                0;
        }

        await admin.save();

        return admin;
    };


/*
|--------------------------------------------------------------------------
| Ensure Admin Can Login
|--------------------------------------------------------------------------
*/

export const ensureAdminCanLogin =
    async (
        adminId: string,
    ): Promise<IAdminDocument> => {
        const admin =
            await getAdminById(
                adminId,
            );

        if (
            admin.status !==
            ADMIN_STATUSES.ACTIVE
        ) {
            throw ApiError.forbidden(
                "Admin account is not active.",
                {
                    code:
                        "ADMIN_ACCOUNT_INACTIVE",
                },
            );
        }

        if (
            admin.lockedUntil &&
            admin.lockedUntil.getTime() >
                Date.now()
        ) {
            throw ApiError.tooManyRequests(
                "Admin account is temporarily locked.",
                {
                    code:
                        "ADMIN_ACCOUNT_LOCKED",
                },
            );
        }

        return admin;
    };