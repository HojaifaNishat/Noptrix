import {
    Types,
} from "mongoose";

import {
    Role,
} from "../roles/role.model";

import {
    Permission,
} from "../permissions/permission.model";

import {
    RolePermission,
    type IRolePermissionDocument,
} from "./role.permission.model";

import {
    ApiError,
} from "../../utils/ApiError";


/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const OWNER_ROLE_SLUG =
    "owner";

const ACTIVE_STATUS =
    "ACTIVE";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Validate MongoDB ObjectId.
 */
const validateObjectId = (
    value: string,
    invalidMessage: string,
    code: string
): Types.ObjectId => {

    if (
        !Types.ObjectId.isValid(
            value
        )
    ) {
        throw ApiError.badRequest(
            invalidMessage,
            {
                code,
            }
        );
    }

    return new Types.ObjectId(
        value
    );
};


/**
 * Require an existing active role.
 */
const requireActiveRole = async (
    roleId: string
) => {

    const roleObjectId =
        validateObjectId(
            roleId,
            "Invalid role ID.",
            "INVALID_ROLE_ID"
        );


    const role =
        await Role.findById(
            roleObjectId
        ).exec();


    if (!role) {
        throw ApiError.notFound(
            "Role not found.",
            {
                code:
                    "ROLE_NOT_FOUND",
            }
        );
    }


    if (
        role.status !==
        ACTIVE_STATUS
    ) {
        throw ApiError.badRequest(
            "Cannot manage permissions for an inactive role.",
            {
                code:
                    "ROLE_INACTIVE",
            }
        );
    }


    return role;
};


/**
 * Require an existing active permission.
 */
const requireActivePermission =
    async (
        permissionId: string
    ) => {

        const permissionObjectId =
            validateObjectId(
                permissionId,
                "Invalid permission ID.",
                "INVALID_PERMISSION_ID"
            );


        const permission =
            await Permission.findById(
                permissionObjectId
            ).exec();


        if (!permission) {
            throw ApiError.notFound(
                "Permission not found.",
                {
                    code:
                        "PERMISSION_NOT_FOUND",
                }
            );
        }


        if (
            permission.status !==
            ACTIVE_STATUS
        ) {
            throw ApiError.badRequest(
                "Cannot assign an inactive permission.",
                {
                    code:
                        "PERMISSION_INACTIVE",
                }
            );
        }


        return permission;
    };


/**
 * OWNER has full system access and does not depend
 * on RolePermission records.
 */
const ensureNotOwnerRole = (
    role: {
        slug: string;
    }
): void => {

    if (
        role.slug ===
        OWNER_ROLE_SLUG
    ) {
        throw ApiError.forbidden(
            "The OWNER role has full system access and does not use role permissions.",
            {
                code:
                    "OWNER_ROLE_PERMISSION_PROTECTED",
            }
        );
    }
};


/*
|--------------------------------------------------------------------------
| Assign Permission To Role
|--------------------------------------------------------------------------
*/

export const assignPermissionToRole =
    async (
        roleId: string,
        permissionId: string,
        createdBy?: string
    ): Promise<
        IRolePermissionDocument
    > => {

        /*
        |--------------------------------------------------------------------------
        | Validate Role
        |--------------------------------------------------------------------------
        */

        const role =
            await requireActiveRole(
                roleId
            );


        /*
        |--------------------------------------------------------------------------
        | OWNER Protection
        |--------------------------------------------------------------------------
        */

        ensureNotOwnerRole(
            role
        );


        /*
        |--------------------------------------------------------------------------
        | Validate Permission
        |--------------------------------------------------------------------------
        */

        const permission =
            await requireActivePermission(
                permissionId
            );


        /*
        |--------------------------------------------------------------------------
        | Duplicate Assignment Protection
        |--------------------------------------------------------------------------
        */

        const existing =
            await RolePermission.findOne({
                roleId:
                    role._id,

                permissionId:
                    permission._id,
            }).exec();


        if (existing) {
            throw ApiError.conflict(
                "This permission is already assigned to the role.",
                {
                    code:
                        "PERMISSION_ALREADY_ASSIGNED",
                }
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Create Relationship
        |--------------------------------------------------------------------------
        */

        const relationship =
            await RolePermission.create({

                roleId:
                    role._id,

                permissionId:
                    permission._id,

                ...(createdBy &&
                Types.ObjectId.isValid(
                    createdBy
                )
                    ? {
                        createdBy:
                            new Types.ObjectId(
                                createdBy
                            ),
                    }
                    : {}),
            });


        return relationship;
    };


/*
|--------------------------------------------------------------------------
| Remove Permission From Role
|--------------------------------------------------------------------------
*/

export const removePermissionFromRole =
    async (
        roleId: string,
        permissionId: string
    ): Promise<void> => {

        /*
        |--------------------------------------------------------------------------
        | Validate Role
        |--------------------------------------------------------------------------
        */

        const role =
            await requireActiveRole(
                roleId
            );


        /*
        |--------------------------------------------------------------------------
        | OWNER Protection
        |--------------------------------------------------------------------------
        */

        ensureNotOwnerRole(
            role
        );


        /*
        |--------------------------------------------------------------------------
        | Validate Permission
        |--------------------------------------------------------------------------
        */

        const permission =
            await requireActivePermission(
                permissionId
            );


        /*
        |--------------------------------------------------------------------------
        | Remove Relationship
        |--------------------------------------------------------------------------
        */

        const result =
            await RolePermission.deleteOne({
                roleId:
                    role._id,

                permissionId:
                    permission._id,
            }).exec();


        if (
            result.deletedCount === 0
        ) {
            throw ApiError.notFound(
                "Role permission assignment not found.",
                {
                    code:
                        "ROLE_PERMISSION_NOT_FOUND",
                }
            );
        }
    };


/*
|--------------------------------------------------------------------------
| Get Role Permissions
|--------------------------------------------------------------------------
*/

export const getRolePermissions =
    async (
        roleId: string
    ): Promise<
        IRolePermissionDocument[]
    > => {

        const role =
            await requireActiveRole(
                roleId
            );


        /*
        |--------------------------------------------------------------------------
        | OWNER Special Rule
        |--------------------------------------------------------------------------
        |
        | OWNER permissions are system-level and are not stored in
        | RolePermission.
        |
        */

        if (
            role.slug ===
            OWNER_ROLE_SLUG
        ) {
            return [];
        }


        return RolePermission.find({
            roleId:
                role._id,
        })
            .populate(
                "permissionId"
            )
            .sort({
                createdAt: 1,
            })
            .exec();
    };


/*
|--------------------------------------------------------------------------
| Get Role Permission Keys
|--------------------------------------------------------------------------
*/

export const getRolePermissionKeys =
    async (
        roleId: string
    ): Promise<string[]> => {

        const role =
            await requireActiveRole(
                roleId
            );


        /*
        |--------------------------------------------------------------------------
        | OWNER Special Rule
        |--------------------------------------------------------------------------
        |
        | OWNER has full access through system authorization.
        |
        | Returning an empty array here prevents callers from
        | interpreting database permission records as OWNER authority.
        |
        */

        if (
            role.slug ===
            OWNER_ROLE_SLUG
        ) {
            return [];
        }


        const relationships =
            await RolePermission.find({
                roleId:
                    role._id,
            })
                .populate(
                    "permissionId"
                )
                .exec();


        const keys: string[] =
            [];


        for (
            const relationship
            of relationships
        ) {

            const permission =
                relationship.permissionId;


            if (
                permission &&
                typeof permission ===
                    "object" &&
                "key" in permission
            ) {

                const key =
                    (
                        permission as {
                            key?: unknown;
                        }
                    ).key;


                if (
                    typeof key ===
                    "string"
                ) {
                    keys.push(
                        key
                            .trim()
                            .toLowerCase()
                    );
                }
            }
        }


        return [
            ...new Set(
                keys
            ),
        ];
    };


/*
|--------------------------------------------------------------------------
| Has Permission
|--------------------------------------------------------------------------
*/

export const roleHasPermission =
    async (
        roleId: string,
        permissionKey: string
    ): Promise<boolean> => {

        /*
        |--------------------------------------------------------------------------
        | Validate Role ID
        |--------------------------------------------------------------------------
        */

        if (
            !Types.ObjectId.isValid(
                roleId
            )
        ) {
            return false;
        }


        /*
        |--------------------------------------------------------------------------
        | Load Role
        |--------------------------------------------------------------------------
        */

        const role =
            await Role.findById(
                roleId
            )
                .select(
                    "_id slug status"
                )
                .exec();


        if (!role) {
            return false;
        }


        /*
        |--------------------------------------------------------------------------
        | Inactive Role
        |--------------------------------------------------------------------------
        */

        if (
            role.status !==
            ACTIVE_STATUS
        ) {
            return false;
        }


        /*
        |--------------------------------------------------------------------------
        | OWNER Special Rule
        |--------------------------------------------------------------------------
        |
        | OWNER has full system access regardless of RolePermission
        | records.
        |
        */

        if (
            role.slug ===
            OWNER_ROLE_SLUG
        ) {
            return true;
        }


        /*
        |--------------------------------------------------------------------------
        | Normalize Permission Key
        |--------------------------------------------------------------------------
        */

        const normalizedKey =
            permissionKey
                .trim()
                .toLowerCase();


        if (
            !normalizedKey
        ) {
            return false;
        }


        /*
        |--------------------------------------------------------------------------
        | Find Active Permission
        |--------------------------------------------------------------------------
        */

        const permission =
            await Permission.findOne({
                key:
                    normalizedKey,

                status:
                    ACTIVE_STATUS,
            })
                .select(
                    "_id"
                )
                .exec();


        if (!permission) {
            return false;
        }


        /*
        |--------------------------------------------------------------------------
        | Check Relationship
        |--------------------------------------------------------------------------
        */

        const relationship =
            await RolePermission.exists({
                roleId:
                    role._id,

                permissionId:
                    permission._id,
            });


        return Boolean(
            relationship
        );
    };


/*
|--------------------------------------------------------------------------
| Get Roles For Permission
|--------------------------------------------------------------------------
*/

export const getRolesForPermission =
    async (
        permissionId: string
    ): Promise<
        IRolePermissionDocument[]
    > => {

        const permissionObjectId =
            validateObjectId(
                permissionId,
                "Invalid permission ID.",
                "INVALID_PERMISSION_ID"
            );


        /*
        |--------------------------------------------------------------------------
        | Verify Permission
        |--------------------------------------------------------------------------
        */

        const permission =
            await Permission.findById(
                permissionObjectId
            ).exec();


        if (!permission) {
            throw ApiError.notFound(
                "Permission not found.",
                {
                    code:
                        "PERMISSION_NOT_FOUND",
                }
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Find Relationships
        |--------------------------------------------------------------------------
        |
        | OWNER normally has no RolePermission rows.
        |
        */

        return RolePermission.find({
            permissionId:
                permission._id,
        })
            .populate(
                "roleId"
            )
            .sort({
                createdAt: 1,
            })
            .exec();
    };


/*
|--------------------------------------------------------------------------
| Bulk Assign Permissions
|--------------------------------------------------------------------------
*/

export const assignPermissionsToRole =
    async (
        roleId: string,
        permissionIds: string[],
        createdBy?: string
    ): Promise<
        IRolePermissionDocument[]
    > => {

        /*
        |--------------------------------------------------------------------------
        | Validate Role First
        |--------------------------------------------------------------------------
        */

        const role =
            await requireActiveRole(
                roleId
            );


        /*
        |--------------------------------------------------------------------------
        | OWNER Protection
        |--------------------------------------------------------------------------
        */

        ensureNotOwnerRole(
            role
        );


        /*
        |--------------------------------------------------------------------------
        | Validate Input
        |--------------------------------------------------------------------------
        */

        if (
            !Array.isArray(
                permissionIds
            ) ||
            permissionIds.length ===
                0
        ) {
            throw ApiError.badRequest(
                "At least one permission is required.",
                {
                    code:
                        "PERMISSION_IDS_REQUIRED",
                }
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Normalize + Deduplicate IDs
        |--------------------------------------------------------------------------
        */

        const uniquePermissionIds =
            [
                ...new Set(
                    permissionIds
                        .map(
                            (
                                permissionId
                            ) =>
                                permissionId
                                    .trim()
                        )
                        .filter(
                            Boolean
                        )
                ),
            ];


        if (
            uniquePermissionIds.length ===
                0
        ) {
            throw ApiError.badRequest(
                "At least one valid permission ID is required.",
                {
                    code:
                        "PERMISSION_IDS_REQUIRED",
                }
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Assign
        |--------------------------------------------------------------------------
        |
        | We intentionally reuse the single-assignment function so that
        | all validations and duplicate protections remain centralized.
        |
        */

        const relationships:
            IRolePermissionDocument[] =
            [];


        for (
            const permissionId
            of uniquePermissionIds
        ) {

            const relationship =
                await assignPermissionToRole(
                    roleId,
                    permissionId,
                    createdBy
                );


            relationships.push(
                relationship
            );
        }


        return relationships;
    };


/*
|--------------------------------------------------------------------------
| Bulk Remove Permissions
|--------------------------------------------------------------------------
*/

export const removePermissionsFromRole =
    async (
        roleId: string,
        permissionIds: string[]
    ): Promise<void> => {

        /*
        |--------------------------------------------------------------------------
        | Validate Role
        |--------------------------------------------------------------------------
        */

        const role =
            await requireActiveRole(
                roleId
            );


        /*
        |--------------------------------------------------------------------------
        | OWNER Protection
        |--------------------------------------------------------------------------
        */

        ensureNotOwnerRole(
            role
        );


        /*
        |--------------------------------------------------------------------------
        | Validate Input
        |--------------------------------------------------------------------------
        */

        if (
            !Array.isArray(
                permissionIds
            ) ||
            permissionIds.length ===
                0
        ) {
            throw ApiError.badRequest(
                "At least one permission is required.",
                {
                    code:
                        "PERMISSION_IDS_REQUIRED",
                }
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Normalize + Deduplicate IDs
        |--------------------------------------------------------------------------
        */

        const uniquePermissionIds =
            [
                ...new Set(
                    permissionIds
                        .map(
                            (
                                permissionId
                            ) =>
                                permissionId
                                    .trim()
                        )
                        .filter(
                            Boolean
                        )
                ),
            ];


        if (
            uniquePermissionIds.length ===
                0
        ) {
            throw ApiError.badRequest(
                "At least one valid permission ID is required.",
                {
                    code:
                        "PERMISSION_IDS_REQUIRED",
                }
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Validate Permission IDs
        |--------------------------------------------------------------------------
        */

        for (
            const permissionId
            of uniquePermissionIds
        ) {

            await requireActivePermission(
                permissionId
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Remove Relationships
        |--------------------------------------------------------------------------
        */

        await RolePermission.deleteMany({
            roleId:
                role._id,

            permissionId: {
                $in:
                    uniquePermissionIds.map(
                        (
                            permissionId
                        ) =>
                            new Types.ObjectId(
                                permissionId
                            )
                    ),
            },
        }).exec();
    };