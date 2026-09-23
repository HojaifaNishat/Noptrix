import {
    Request,
    Response,
} from "express";

import {
    asyncHandler,
} from "../../utils/asyncHandler";

import {
    ApiError,
} from "../../utils/ApiError";

import {
    getAuthenticatedUserId,
} from "../../middlewares/adminAuth.middleware";

import {
    assignPermissionToRole,
    removePermissionFromRole,
    getRolePermissions,
    getRolePermissionKeys,
    getRolesForPermission,
    assignPermissionsToRole,
    removePermissionsFromRole,
} from "./role.permission.service";

/*
|--------------------------------------------------------------------------
| Assign Permission To Role
|--------------------------------------------------------------------------
*/

export const assignPermissionController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const {
                roleId,
                permissionId,
            } = req.body;

            if (
                typeof roleId !==
                    "string" ||
                !roleId
            ) {
                throw ApiError.badRequest(
                    "Role ID is required.",
                    {
                        code:
                            "ROLE_ID_REQUIRED",
                    }
                );
            }

            if (
                typeof permissionId !==
                    "string" ||
                !permissionId
            ) {
                throw ApiError.badRequest(
                    "Permission ID is required.",
                    {
                        code:
                            "PERMISSION_ID_REQUIRED",
                    }
                );
            }

            const createdBy =
                getAuthenticatedUserId(req);

            const relationship =
                await assignPermissionToRole(
                    roleId,
                    permissionId,
                    createdBy
                );

            res.status(201).json({
                success: true,
                message:
                    "Permission assigned to role successfully.",
                data: {
                    relationship,
                },
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Remove Permission From Role
|--------------------------------------------------------------------------
*/

export const removePermissionController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const {
                roleId,
                permissionId,
            } = req.body;

            if (
                typeof roleId !==
                    "string" ||
                !roleId
            ) {
                throw ApiError.badRequest(
                    "Role ID is required.",
                    {
                        code:
                            "ROLE_ID_REQUIRED",
                    }
                );
            }

            if (
                typeof permissionId !==
                    "string" ||
                !permissionId
            ) {
                throw ApiError.badRequest(
                    "Permission ID is required.",
                    {
                        code:
                            "PERMISSION_ID_REQUIRED",
                    }
                );
            }

            await removePermissionFromRole(
                roleId,
                permissionId
            );

            res.status(200).json({
                success: true,
                message:
                    "Permission removed from role successfully.",
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Get Role Permissions
|--------------------------------------------------------------------------
*/

export const getRolePermissionsController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const {
                roleId,
            } = req.params;

            if (
                typeof roleId !==
                    "string" ||
                !roleId
            ) {
                throw ApiError.badRequest(
                    "Role ID is required.",
                    {
                        code:
                            "ROLE_ID_REQUIRED",
                    }
                );
            }

            const permissions =
                await getRolePermissions(
                    roleId
                );

            res.status(200).json({
                success: true,
                data: {
                    permissions,
                },
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Get Role Permission Keys
|--------------------------------------------------------------------------
*/

export const getRolePermissionKeysController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const {
                roleId,
            } = req.params;

            if (
                typeof roleId !==
                    "string" ||
                !roleId
            ) {
                throw ApiError.badRequest(
                    "Role ID is required.",
                    {
                        code:
                            "ROLE_ID_REQUIRED",
                    }
                );
            }

            const permissionKeys =
                await getRolePermissionKeys(
                    roleId
                );

            res.status(200).json({
                success: true,
                data: {
                    permissionKeys,
                },
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Get Roles For Permission
|--------------------------------------------------------------------------
*/

export const getRolesForPermissionController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const {
                permissionId,
            } = req.params;

            if (
                typeof permissionId !==
                    "string" ||
                !permissionId
            ) {
                throw ApiError.badRequest(
                    "Permission ID is required.",
                    {
                        code:
                            "PERMISSION_ID_REQUIRED",
                    }
                );
            }

            const roles =
                await getRolesForPermission(
                    permissionId
                );

            res.status(200).json({
                success: true,
                data: {
                    roles,
                },
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Bulk Assign Permissions
|--------------------------------------------------------------------------
*/

export const bulkAssignPermissionsController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const {
                roleId,
                permissionIds,
            } = req.body;

            if (
                typeof roleId !==
                    "string" ||
                !roleId
            ) {
                throw ApiError.badRequest(
                    "Role ID is required.",
                    {
                        code:
                            "ROLE_ID_REQUIRED",
                    }
                );
            }

            if (
                !Array.isArray(
                    permissionIds
                )
            ) {
                throw ApiError.badRequest(
                    "Permission IDs must be an array.",
                    {
                        code:
                            "PERMISSION_IDS_INVALID",
                    }
                );
            }

            const createdBy =
                getAuthenticatedUserId(req);

            const relationships =
                await assignPermissionsToRole(
                    roleId,
                    permissionIds,
                    createdBy
                );

            res.status(201).json({
                success: true,
                message:
                    "Permissions assigned successfully.",
                data: {
                    relationships,
                },
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Bulk Remove Permissions
|--------------------------------------------------------------------------
*/

export const bulkRemovePermissionsController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const {
                roleId,
                permissionIds,
            } = req.body;

            if (
                typeof roleId !==
                    "string" ||
                !roleId
            ) {
                throw ApiError.badRequest(
                    "Role ID is required.",
                    {
                        code:
                            "ROLE_ID_REQUIRED",
                    }
                );
            }

            if (
                !Array.isArray(
                    permissionIds
                )
            ) {
                throw ApiError.badRequest(
                    "Permission IDs must be an array.",
                    {
                        code:
                            "PERMISSION_IDS_INVALID",
                    }
                );
            }

            await removePermissionsFromRole(
                roleId,
                permissionIds
            );

            res.status(200).json({
                success: true,
                message:
                    "Permissions removed successfully.",
            });
        }
    );