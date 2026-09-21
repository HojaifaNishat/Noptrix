import {
    Types,
} from "mongoose";

import {
    Role,
    ROLE_STATUSES,
    type IRoleDocument,
    type RoleStatus,
} from "./role.model";

import {
    ApiError,
} from "../../utils/ApiError";

export interface CreateRoleInput {
    name: string;
    slug: string;
    description?: string;
    isSystemRole?: boolean;
}

export interface UpdateRoleInput {
    name?: string;
    slug?: string;
    description?: string;
    status?: RoleStatus;
}

/*
|--------------------------------------------------------------------------
| Create Role
|--------------------------------------------------------------------------
*/

export const createRole = async (
    data: CreateRoleInput,
    createdBy?: string
): Promise<IRoleDocument> => {
    const name = data.name.trim();
    const slug = data.slug.trim().toLowerCase();

    const existingRole = await Role.findOne({
        $or: [
            { name },
            { slug },
        ],
    }).exec();

    if (existingRole) {
        if (existingRole.slug === slug) {
            throw ApiError.conflict(
                "A role with this slug already exists.",
                {
                    code: "ROLE_SLUG_ALREADY_EXISTS",
                }
            );
        }

        throw ApiError.conflict(
            "A role with this name already exists.",
            {
                code: "ROLE_NAME_ALREADY_EXISTS",
            }
        );
    }

    const role = await Role.create({
        name,
        slug,
        ...(data.description !== undefined
            ? {
                description:
                    data.description.trim(),
            }
            : {}),
        isSystemRole:
            data.isSystemRole ?? false,
        status:
            ROLE_STATUSES.ACTIVE,
        ...(createdBy &&
        Types.ObjectId.isValid(createdBy)
            ? {
                createdBy:
                    new Types.ObjectId(createdBy),
            }
            : {}),
    });

    return role;
};

/*
|--------------------------------------------------------------------------
| Get All Roles
|--------------------------------------------------------------------------
*/

export const getAllRoles =
    async (): Promise<IRoleDocument[]> => {
        return Role.find()
            .sort({
                isSystemRole: -1,
                name: 1,
            })
            .exec();
    };

/*
|--------------------------------------------------------------------------
| Get Role By ID
|--------------------------------------------------------------------------
*/

export const getRoleById =
    async (
        roleId: string
    ): Promise<IRoleDocument> => {
        if (
            !Types.ObjectId.isValid(roleId)
        ) {
            throw ApiError.badRequest(
                "Invalid role ID.",
                {
                    code: "INVALID_ROLE_ID",
                }
            );
        }

        const role =
            await Role.findById(roleId).exec();

        if (!role) {
            throw ApiError.notFound(
                "Role not found.",
                {
                    code: "ROLE_NOT_FOUND",
                }
            );
        }

        return role;
    };

/*
|--------------------------------------------------------------------------
| Get Role By Slug
|--------------------------------------------------------------------------
*/

export const getRoleBySlug =
    async (
        slug: string
    ): Promise<IRoleDocument | null> => {
        return Role.findOne({
            slug: slug.trim().toLowerCase(),
        }).exec();
    };

/*
|--------------------------------------------------------------------------
| Update Role
|--------------------------------------------------------------------------
*/

export const updateRole = async (
    roleId: string,
    data: UpdateRoleInput,
    updatedBy?: string
): Promise<IRoleDocument> => {
    if (
        !Types.ObjectId.isValid(roleId)
    ) {
        throw ApiError.badRequest(
            "Invalid role ID.",
            {
                code: "INVALID_ROLE_ID",
            }
        );
    }

    const role =
        await Role.findById(roleId).exec();

    if (!role) {
        throw ApiError.notFound(
            "Role not found.",
            {
                code: "ROLE_NOT_FOUND",
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | System Role Protection
    |--------------------------------------------------------------------------
    |
    | System roles are protected.
    | Their structural identity cannot be freely changed.
    |
    */

    if (
        role.isSystemRole &&
        (
            data.slug !== undefined ||
            data.name !== undefined
        )
    ) {
        throw ApiError.forbidden(
            "System role identity cannot be changed.",
            {
                code: "SYSTEM_ROLE_PROTECTED",
            }
        );
    }

    if (data.name !== undefined) {
        const name = data.name.trim();

        const duplicate =
            await Role.exists({
                name,
                _id: { $ne: roleId },
            });

        if (duplicate) {
            throw ApiError.conflict(
                "A role with this name already exists.",
                {
                    code:
                        "ROLE_NAME_ALREADY_EXISTS",
                }
            );
        }

        role.name = name;
    }

    if (data.slug !== undefined) {
        const slug =
            data.slug.trim().toLowerCase();

        const duplicate =
            await Role.exists({
                slug,
                _id: { $ne: roleId },
            });

        if (duplicate) {
            throw ApiError.conflict(
                "A role with this slug already exists.",
                {
                    code:
                        "ROLE_SLUG_ALREADY_EXISTS",
                }
            );
        }

        role.slug = slug;
    }

    if (
        data.description !== undefined
    ) {
        role.description =
            data.description.trim();
    }

    if (data.status !== undefined) {
        role.status = data.status;
    }

    if (
        updatedBy &&
        Types.ObjectId.isValid(updatedBy)
    ) {
        role.updatedBy =
            new Types.ObjectId(updatedBy);
    }

    await role.save();

    return role;
};

/*
|--------------------------------------------------------------------------
| Activate Role
|--------------------------------------------------------------------------
*/

export const activateRole =
    async (
        roleId: string,
        updatedBy?: string
    ): Promise<IRoleDocument> => {
        return updateRole(
            roleId,
            {
                status:
                    ROLE_STATUSES.ACTIVE,
            },
            updatedBy
        );
    };

/*
|--------------------------------------------------------------------------
| Deactivate Role
|--------------------------------------------------------------------------
*/

export const deactivateRole =
    async (
        roleId: string,
        updatedBy?: string
    ): Promise<IRoleDocument> => {
        return updateRole(
            roleId,
            {
                status:
                    ROLE_STATUSES.INACTIVE,
            },
            updatedBy
        );
    };

/*
|--------------------------------------------------------------------------
| Delete Role
|--------------------------------------------------------------------------
*/

export const deleteRole =
    async (
        roleId: string
    ): Promise<void> => {
        if (
            !Types.ObjectId.isValid(roleId)
        ) {
            throw ApiError.badRequest(
                "Invalid role ID.",
                {
                    code: "INVALID_ROLE_ID",
                }
            );
        }

        const role =
            await Role.findById(roleId).exec();

        if (!role) {
            throw ApiError.notFound(
                "Role not found.",
                {
                    code: "ROLE_NOT_FOUND",
                }
            );
        }

        if (role.isSystemRole) {
            throw ApiError.forbidden(
                "System roles cannot be deleted.",
                {
                    code:
                        "SYSTEM_ROLE_DELETE_FORBIDDEN",
                }
            );
        }

        await Role.deleteOne({
            _id: roleId,
        }).exec();
    };