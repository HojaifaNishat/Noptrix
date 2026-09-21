import {
    Types,
} from "mongoose";

import {
    Permission,
    PERMISSION_STATUSES,
    type IPermissionDocument,
    type PermissionAction,
} from "./permission.model";

import {
    ApiError,
} from "../../utils/ApiError";

/*
|--------------------------------------------------------------------------
| Input Types
|--------------------------------------------------------------------------
*/

export interface CreatePermissionInput {
    resource: string;
    action: PermissionAction;
    key: string;
    description?: string;
    isSystemPermission?: boolean;
}

export interface UpdatePermissionInput {
    resource?: string;
    action?: PermissionAction;
    key?: string;
    description?: string;
    status?: "ACTIVE" | "INACTIVE";
}

/*
|--------------------------------------------------------------------------
| Create Permission
|--------------------------------------------------------------------------
*/

export const createPermission = async (
    data: CreatePermissionInput,
    createdBy?: string
): Promise<IPermissionDocument> => {
    const resource =
        data.resource.trim().toLowerCase();

    const key =
        data.key.trim().toLowerCase();

    const existing =
        await Permission.findOne({
            $or: [
                { key },
                {
                    resource,
                    action: data.action,
                },
            ],
        }).exec();

    if (existing) {
        if (existing.key === key) {
            throw ApiError.conflict(
                "A permission with this key already exists.",
                {
                    code:
                        "PERMISSION_KEY_ALREADY_EXISTS",
                }
            );
        }

        throw ApiError.conflict(
            "This resource and action combination already exists.",
            {
                code:
                    "PERMISSION_RESOURCE_ACTION_ALREADY_EXISTS",
            }
        );
    }

    const permission =
        await Permission.create({
            resource,
            action: data.action,
            key,
            ...(data.description !== undefined
                ? {
                    description:
                        data.description.trim(),
                }
                : {}),
            isSystemPermission:
                data.isSystemPermission ?? false,
            status:
                PERMISSION_STATUSES.ACTIVE,
            ...(createdBy &&
            Types.ObjectId.isValid(createdBy)
                ? {
                    createdBy:
                        new Types.ObjectId(
                            createdBy
                        ),
                }
                : {}),
        });

    return permission;
};

/*
|--------------------------------------------------------------------------
| Get All Permissions
|--------------------------------------------------------------------------
*/

export const getAllPermissions =
    async (): Promise<
        IPermissionDocument[]
    > => {
        return Permission.find()
            .sort({
                resource: 1,
                action: 1,
            })
            .exec();
    };

/*
|--------------------------------------------------------------------------
| Get Permission By ID
|--------------------------------------------------------------------------
*/

export const getPermissionById =
    async (
        permissionId: string
    ): Promise<IPermissionDocument> => {
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

        return permission;
    };

/*
|--------------------------------------------------------------------------
| Get Permission By Key
|--------------------------------------------------------------------------
*/

export const getPermissionByKey =
    async (
        key: string
    ): Promise<
        IPermissionDocument | null
    > => {
        return Permission.findOne({
            key: key.trim().toLowerCase(),
        }).exec();
    };

/*
|--------------------------------------------------------------------------
| Update Permission
|--------------------------------------------------------------------------
*/

export const updatePermission =
    async (
        permissionId: string,
        data: UpdatePermissionInput,
        updatedBy?: string
    ): Promise<IPermissionDocument> => {
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

        /*
        |--------------------------------------------------------------------------
        | System Permission Protection
        |--------------------------------------------------------------------------
        */

        if (
            permission.isSystemPermission &&
            (
                data.resource !== undefined ||
                data.action !== undefined ||
                data.key !== undefined
            )
        ) {
            throw ApiError.forbidden(
                "System permission identity cannot be changed.",
                {
                    code:
                        "SYSTEM_PERMISSION_PROTECTED",
                }
            );
        }

        if (data.resource !== undefined) {
            permission.resource =
                data.resource
                    .trim()
                    .toLowerCase();
        }

        if (data.action !== undefined) {
            permission.action =
                data.action;
        }

        if (data.key !== undefined) {
            permission.key =
                data.key
                    .trim()
                    .toLowerCase();
        }

        if (
            data.description !== undefined
        ) {
            permission.description =
                data.description.trim();
        }

        if (data.status !== undefined) {
            permission.status =
                data.status;
        }

        /*
        |--------------------------------------------------------------------------
        | Duplicate Protection
        |--------------------------------------------------------------------------
        */

        const duplicate =
            await Permission.findOne({
                $or: [
                    {
                        key: permission.key,
                    },
                    {
                        resource:
                            permission.resource,
                        action:
                            permission.action,
                    },
                ],
                _id: {
                    $ne: permissionId,
                },
            }).exec();

        if (duplicate) {
            throw ApiError.conflict(
                "Another permission with the same resource, action, or key already exists.",
                {
                    code:
                        "PERMISSION_ALREADY_EXISTS",
                }
            );
        }

        if (
            updatedBy &&
            Types.ObjectId.isValid(
                updatedBy
            )
        ) {
            permission.updatedBy =
                new Types.ObjectId(
                    updatedBy
                );
        }

        await permission.save();

        return permission;
    };

/*
|--------------------------------------------------------------------------
| Activate Permission
|--------------------------------------------------------------------------
*/

export const activatePermission =
    async (
        permissionId: string,
        updatedBy?: string
    ): Promise<IPermissionDocument> => {
        return updatePermission(
            permissionId,
            {
                status:
                    PERMISSION_STATUSES.ACTIVE,
            },
            updatedBy
        );
    };

/*
|--------------------------------------------------------------------------
| Deactivate Permission
|--------------------------------------------------------------------------
*/

export const deactivatePermission =
    async (
        permissionId: string,
        updatedBy?: string
    ): Promise<IPermissionDocument> => {
        return updatePermission(
            permissionId,
            {
                status:
                    PERMISSION_STATUSES.INACTIVE,
            },
            updatedBy
        );
    };

/*
|--------------------------------------------------------------------------
| Delete Permission
|--------------------------------------------------------------------------
*/

export const deletePermission =
    async (
        permissionId: string
    ): Promise<void> => {
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
            permission.isSystemPermission
        ) {
            throw ApiError.forbidden(
                "System permissions cannot be deleted.",
                {
                    code:
                        "SYSTEM_PERMISSION_DELETE_FORBIDDEN",
                }
            );
        }

        await Permission.deleteOne({
            _id: permissionId,
        }).exec();
    };