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
| Assign Permission To Role
|--------------------------------------------------------------------------
*/

export const assignPermissionToRole =
    async (
        roleId: string,
        permissionId: string,
        createdBy?: string
    ): Promise<IRolePermissionDocument> => {
        if (
            !Types.ObjectId.isValid(roleId)
        ) {
            throw ApiError.badRequest(
                "Invalid role ID.",
                {
                    code:
                        "INVALID_ROLE_ID",
                }
            );
        }

        if (
            !Types.ObjectId.isValid(
                permissionId
            )
        ) {
            throw ApiError.badRequest(
                "Invalid permission ID.",
                {
                    code:
                        "INVALID_PERMISSION_ID",
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Verify Role
        |--------------------------------------------------------------------------
        */

        const role =
            await Role.findById(
                roleId
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
            role.status !== "ACTIVE"
        ) {
            throw ApiError.badRequest(
                "Cannot assign permissions to an inactive role.",
                {
                    code:
                        "ROLE_INACTIVE",
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Verify Permission
        |--------------------------------------------------------------------------
        */

        const permission =
            await Permission.findById(
                permissionId
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
            permission.status !== "ACTIVE"
        ) {
            throw ApiError.badRequest(
                "Cannot assign an inactive permission.",
                {
                    code:
                        "PERMISSION_INACTIVE",
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Duplicate Assignment Protection
        |--------------------------------------------------------------------------
        */

        const existing =
            await RolePermission.findOne({
                roleId,
                permissionId,
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
                    new Types.ObjectId(
                        roleId
                    ),

                permissionId:
                    new Types.ObjectId(
                        permissionId
                    ),

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
        if (
            !Types.ObjectId.isValid(roleId)
        ) {
            throw ApiError.badRequest(
                "Invalid role ID.",
                {
                    code:
                        "INVALID_ROLE_ID",
                }
            );
        }

        if (
            !Types.ObjectId.isValid(
                permissionId
            )
        ) {
            throw ApiError.badRequest(
                "Invalid permission ID.",
                {
                    code:
                        "INVALID_PERMISSION_ID",
                }
            );
        }

        const result =
            await RolePermission.deleteOne({
                roleId,
                permissionId,
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
        if (
            !Types.ObjectId.isValid(roleId)
        ) {
            throw ApiError.badRequest(
                "Invalid role ID.",
                {
                    code:
                        "INVALID_ROLE_ID",
                }
            );
        }

        return RolePermission.find({
            roleId,
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
        if (
            !Types.ObjectId.isValid(roleId)
        ) {
            throw ApiError.badRequest(
                "Invalid role ID.",
                {
                    code:
                        "INVALID_ROLE_ID",
                }
            );
        }

        const relationships =
            await RolePermission.find({
                roleId,
            })
                .populate(
                    "permissionId"
                )
                .exec();

        const keys: string[] = [];

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
                    keys.push(key);
                }
            }
        }

        return [
            ...new Set(keys),
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
        if (
            !Types.ObjectId.isValid(roleId)
        ) {
            return false;
        }

        const permission =
            await Permission.findOne({
                key:
                    permissionKey
                        .trim()
                        .toLowerCase(),
                status: "ACTIVE",
            }).select("_id");

        if (!permission) {
            return false;
        }

        const relationship =
            await RolePermission.exists({
                roleId,
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
        if (
            !Types.ObjectId.isValid(
                permissionId
            )
        ) {
            throw ApiError.badRequest(
                "Invalid permission ID.",
                {
                    code:
                        "INVALID_PERMISSION_ID",
                }
            );
        }

        return RolePermission.find({
            permissionId,
        })
            .populate("roleId")
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
        if (
            !Types.ObjectId.isValid(roleId)
        ) {
            throw ApiError.badRequest(
                "Invalid role ID.",
                {
                    code:
                        "INVALID_ROLE_ID",
                }
            );
        }

        if (
            permissionIds.length === 0
        ) {
            throw ApiError.badRequest(
                "At least one permission is required.",
                {
                    code:
                        "PERMISSION_IDS_REQUIRED",
                }
            );
        }

        const uniquePermissionIds =
            [
                ...new Set(
                    permissionIds
                ),
            ];

        const relationships: IRolePermissionDocument[] =
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
        if (
            !Types.ObjectId.isValid(roleId)
        ) {
            throw ApiError.badRequest(
                "Invalid role ID.",
                {
                    code:
                        "INVALID_ROLE_ID",
                }
            );
        }

        if (
            permissionIds.length === 0
        ) {
            throw ApiError.badRequest(
                "At least one permission is required.",
                {
                    code:
                        "PERMISSION_IDS_REQUIRED",
                }
            );
        }

        const uniquePermissionIds =
            [
                ...new Set(
                    permissionIds
                ),
            ];

        await RolePermission.deleteMany({
            roleId,
            permissionId: {
                $in:
                    uniquePermissionIds,
            },
        }).exec();
    };