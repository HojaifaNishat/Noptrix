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
} from "../../middlewares/auth.middleware";

import {
    createRole,
    getAllRoles,
    getRoleById,
    updateRole,
    activateRole,
    deactivateRole,
    deleteRole,
} from "./role.service";

import type {
    CreateRoleInput,
    UpdateRoleInput,
} from "./role.service";

/*
|--------------------------------------------------------------------------
| Create Role
|--------------------------------------------------------------------------
*/

export const createRoleController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const input =
                req.body as CreateRoleInput;

            const createdBy =
                getAuthenticatedUserId(req);

            const role =
                await createRole(
                    input,
                    createdBy
                );

            res.status(201).json({
                success: true,
                message:
                    "Role created successfully.",
                data: {
                    role,
                },
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Get All Roles
|--------------------------------------------------------------------------
*/

export const getAllRolesController =
    asyncHandler(
        async (
            _req: Request,
            res: Response
        ): Promise<void> => {
            const roles =
                await getAllRoles();

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
| Get Role By ID
|--------------------------------------------------------------------------
*/

export const getRoleController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const { roleId } =
                req.params;

            if (
                typeof roleId !== "string" ||
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

            const role =
                await getRoleById(roleId);

            res.status(200).json({
                success: true,
                data: {
                    role,
                },
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Update Role
|--------------------------------------------------------------------------
*/

export const updateRoleController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const { roleId } =
                req.params;

            if (
                typeof roleId !== "string" ||
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

            const input =
                req.body as UpdateRoleInput;

            const updatedBy =
                getAuthenticatedUserId(req);

            const role =
                await updateRole(
                    roleId,
                    input,
                    updatedBy
                );

            res.status(200).json({
                success: true,
                message:
                    "Role updated successfully.",
                data: {
                    role,
                },
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Activate Role
|--------------------------------------------------------------------------
*/

export const activateRoleController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const { roleId } =
                req.params;

            if (
                typeof roleId !== "string" ||
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

            const updatedBy =
                getAuthenticatedUserId(req);

            const role =
                await activateRole(
                    roleId,
                    updatedBy
                );

            res.status(200).json({
                success: true,
                message:
                    "Role activated successfully.",
                data: {
                    role,
                },
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Deactivate Role
|--------------------------------------------------------------------------
*/

export const deactivateRoleController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const { roleId } =
                req.params;

            if (
                typeof roleId !== "string" ||
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

            const updatedBy =
                getAuthenticatedUserId(req);

            const role =
                await deactivateRole(
                    roleId,
                    updatedBy
                );

            res.status(200).json({
                success: true,
                message:
                    "Role deactivated successfully.",
                data: {
                    role,
                },
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Delete Role
|--------------------------------------------------------------------------
*/

export const deleteRoleController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const { roleId } =
                req.params;

            if (
                typeof roleId !== "string" ||
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

            await deleteRole(roleId);

            res.status(200).json({
                success: true,
                message:
                    "Role deleted successfully.",
            });
        }
    );