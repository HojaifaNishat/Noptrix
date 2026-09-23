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


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface CreateRoleInput {
    name: string;
    slug: string;
    description?: string;
}

export interface UpdateRoleInput {
    name?: string;
    slug?: string;
    description?: string;
    status?: RoleStatus;
}


/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const OWNER_ROLE_SLUG = "owner";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const validateRoleId = (
    roleId: string
): Types.ObjectId => {

    if (!Types.ObjectId.isValid(roleId)) {
        throw ApiError.badRequest(
            "Invalid role ID.",
            {
                code:
                    "INVALID_ROLE_ID",
            }
        );
    }

    return new Types.ObjectId(
        roleId
    );
};


const normalizeSlug = (
    slug: string
): string => {

    return slug
        .trim()
        .toLowerCase();
};


/*
|--------------------------------------------------------------------------
| Create Role
|--------------------------------------------------------------------------
|
| Roles created through OWNER API are always custom roles.
|
| System roles are controlled by seed/system logic and cannot be
| created or promoted through normal role management.
|
*/

export const createRole = async (
    data: CreateRoleInput,
    createdBy?: string
): Promise<IRoleDocument> => {

    const name =
        data.name.trim();

    const slug =
        normalizeSlug(
            data.slug
        );


    /*
    |--------------------------------------------------------------------------
    | OWNER Role Protection
    |--------------------------------------------------------------------------
    |
    | OWNER is a reserved system role.
    | It must never be created through normal role management.
    |
    */

    if (
        slug === OWNER_ROLE_SLUG
    ) {
        throw ApiError.forbidden(
            "The OWNER role is reserved and cannot be created manually.",
            {
                code:
                    "OWNER_ROLE_RESERVED",
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Duplicate Role Check
    |--------------------------------------------------------------------------
    */

    const existingRole =
        await Role.findOne({
            $or: [
                {
                    name,
                },
                {
                    slug,
                },
            ],
        }).exec();


    if (existingRole) {

        if (
            existingRole.slug === slug
        ) {
            throw ApiError.conflict(
                "A role with this slug already exists.",
                {
                    code:
                        "ROLE_SLUG_ALREADY_EXISTS",
                }
            );
        }


        throw ApiError.conflict(
            "A role with this name already exists.",
            {
                code:
                    "ROLE_NAME_ALREADY_EXISTS",
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Create Role
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | isSystemRole is intentionally hard-coded to false.
    |
    | OWNER API can create only custom roles.
    | System roles must come from seed/system logic.
    |
    */

    const role =
        await Role.create({

            name,

            slug,

            ...(data.description !==
                undefined
                ? {
                    description:
                        data.description.trim(),
                }
                : {}),

            isSystemRole:
                false,

            status:
                ROLE_STATUSES.ACTIVE,

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


    return role;
};


/*
|--------------------------------------------------------------------------
| Get All Roles
|--------------------------------------------------------------------------
*/

export const getAllRoles =
    async (): Promise<
        IRoleDocument[]
    > => {

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
    ): Promise<
        IRoleDocument
    > => {

        const roleObjectId =
            validateRoleId(
                roleId
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
    ): Promise<
        IRoleDocument | null
    > => {

        return Role.findOne({
            slug:
                normalizeSlug(
                    slug
                ),
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
): Promise<
    IRoleDocument
> => {

    const roleObjectId =
        validateRoleId(
            roleId
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


    /*
    |--------------------------------------------------------------------------
    | OWNER Role Protection
    |--------------------------------------------------------------------------
    |
    | OWNER is the highest authority in the system.
    |
    | The OWNER role must remain completely immutable.
    |
    | Protected:
    | - name
    | - slug
    | - description
    | - status
    | - any future update field
    |
    | This is intentionally deny-by-default.
    |
    */

    if (
        role.slug === OWNER_ROLE_SLUG
    ) {
        throw ApiError.forbidden(
            "The OWNER role is fully protected and cannot be modified.",
            {
                code:
                    "OWNER_ROLE_PROTECTED",
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | System Role Protection
    |--------------------------------------------------------------------------
    |
    | System role identity cannot be changed.
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
                code:
                    "SYSTEM_ROLE_PROTECTED",
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Name
    |--------------------------------------------------------------------------
    */

    if (
        data.name !== undefined
    ) {

        const name =
            data.name.trim();


        const duplicate =
            await Role.exists({
                name,

                _id: {
                    $ne:
                        roleObjectId,
                },
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


        role.name =
            name;
    }


    /*
    |--------------------------------------------------------------------------
    | Slug
    |--------------------------------------------------------------------------
    */

    if (
        data.slug !== undefined
    ) {

        const slug =
            normalizeSlug(
                data.slug
            );


        /*
        |--------------------------------------------------------------------------
        | OWNER Slug Protection
        |--------------------------------------------------------------------------
        */

        if (
            slug === OWNER_ROLE_SLUG
        ) {
            throw ApiError.forbidden(
                "The OWNER role slug is reserved.",
                {
                    code:
                        "OWNER_ROLE_RESERVED",
                }
            );
        }


        const duplicate =
            await Role.exists({
                slug,

                _id: {
                    $ne:
                        roleObjectId,
                },
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


        role.slug =
            slug;
    }


    /*
    |--------------------------------------------------------------------------
    | Description
    |--------------------------------------------------------------------------
    */

    if (
        data.description !==
        undefined
    ) {
        role.description =
            data.description.trim();
    }


    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

    if (
        data.status !== undefined
    ) {
        role.status =
            data.status;
    }


    /*
    |--------------------------------------------------------------------------
    | Updated By
    |--------------------------------------------------------------------------
    */

    if (
        updatedBy &&
        Types.ObjectId.isValid(
            updatedBy
        )
    ) {
        role.updatedBy =
            new Types.ObjectId(
                updatedBy
            );
    }


    /*
    |--------------------------------------------------------------------------
    | Save
    |--------------------------------------------------------------------------
    */

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
    ): Promise<
        IRoleDocument
    > => {

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
    ): Promise<
        IRoleDocument
    > => {

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

        const roleObjectId =
            validateRoleId(
                roleId
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


        /*
        |--------------------------------------------------------------------------
        | OWNER Protection
        |--------------------------------------------------------------------------
        */

        if (
            role.slug === OWNER_ROLE_SLUG
        ) {
            throw ApiError.forbidden(
                "The OWNER role cannot be deleted.",
                {
                    code:
                        "OWNER_ROLE_DELETE_FORBIDDEN",
                }
            );
        }


        /*
        |--------------------------------------------------------------------------
        | System Role Protection
        |--------------------------------------------------------------------------
        */

        if (
            role.isSystemRole
        ) {
            throw ApiError.forbidden(
                "System roles cannot be deleted.",
                {
                    code:
                        "SYSTEM_ROLE_DELETE_FORBIDDEN",
                }
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Delete
        |--------------------------------------------------------------------------
        */

        await Role.deleteOne({
            _id:
                roleObjectId,
        }).exec();
    };