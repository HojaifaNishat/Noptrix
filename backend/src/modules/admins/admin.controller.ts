import {
    Request,
    Response,
} from "express";

import {
    asyncHandler,
} from "../../utils/asyncHandler";

import {
    getAuthenticatedOwnerId,
} from "../../middlewares/ownerAuth.middleware";

import {
    getAuthenticatedAdminId,
} from "../../middlewares/adminAuth.middleware";

import {
    ApiError,
} from "../../utils/ApiError";

import {
    getAdminById,
    getAdminByUserId,
    requireAdminByUserId,
    getAllAdmins,
    createAdmin,
    updateAdmin,
    ensureAdminCanLogin,
} from "./admin.service";


/*
|--------------------------------------------------------------------------
| Route Param Helper
|--------------------------------------------------------------------------
*/

const getRouteParam = (
    value:
        | string
        | string[]
        | undefined,
    fieldName: string,
): string => {
    if (
        typeof value !==
            "string" ||
        !value.trim()
    ) {
        throw ApiError.badRequest(
            `${fieldName} is required.`,
            {
                code: `${fieldName
                    .replace(
                        /\s+/g,
                        "_",
                    )
                    .toUpperCase()}_REQUIRED`,
            },
        );
    }

    return value.trim();
};


/*
|--------------------------------------------------------------------------
| Get All Admins
|--------------------------------------------------------------------------
*/

export const getAllAdminsController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            getAuthenticatedOwnerId(
                req,
            );

            const admins =
                await getAllAdmins();

            res.status(200).json({
                success: true,
                message:
                    "Admins retrieved successfully.",
                data: admins,
            });
        },
    );


/*
|--------------------------------------------------------------------------
| Get Admin By ID
|--------------------------------------------------------------------------
*/

export const getAdminController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            getAuthenticatedOwnerId(
                req,
            );

            const adminId =
                getRouteParam(
                    req.params.adminId,
                    "Admin ID",
                );

            const admin =
                await getAdminById(
                    adminId,
                );

            res.status(200).json({
                success: true,
                message:
                    "Admin retrieved successfully.",
                data: admin,
            });
        },
    );


/*
|--------------------------------------------------------------------------
| Get Admin By User
|--------------------------------------------------------------------------
*/

export const getAdminByUserController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            getAuthenticatedOwnerId(
                req,
            );

            const userId =
                getRouteParam(
                    req.params.userId,
                    "User ID",
                );

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

            res.status(200).json({
                success: true,
                message:
                    "Admin retrieved successfully.",
                data: admin,
            });
        },
    );


/*
|--------------------------------------------------------------------------
| Get My Admin Account
|--------------------------------------------------------------------------
*/

export const getMyAdminController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const adminId =
                getAuthenticatedAdminId(
                    req,
                );

            const admin =
                await getAdminById(
                    adminId,
                );

            res.status(200).json({
                success: true,
                message:
                    "Admin profile retrieved successfully.",
                data: admin,
            });
        },
    );


/*
|--------------------------------------------------------------------------
| Create Admin
|--------------------------------------------------------------------------
*/

export const createAdminController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const ownerId =
                getAuthenticatedOwnerId(
                    req,
                );

            const admin =
                await createAdmin({
                    userId:
                        req.body.userId,
                    roleId:
                        req.body.roleId,
                    createdBy:
                        ownerId,
                });

            res.status(201).json({
                success: true,
                message:
                    "Admin created successfully.",
                data: admin,
            });
        },
    );


/*
|--------------------------------------------------------------------------
| Update Admin
|--------------------------------------------------------------------------
*/

export const updateAdminController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const ownerId =
                getAuthenticatedOwnerId(
                    req,
                );

            const adminId =
                getRouteParam(
                    req.params.adminId,
                    "Admin ID",
                );

            const admin =
                await updateAdmin(
                    adminId,
                    {
                        roleId:
                            req.body.roleId,
                        status:
                            req.body.status,
                        updatedBy:
                            ownerId,
                    },
                );

            res.status(200).json({
                success: true,
                message:
                    "Admin updated successfully.",
                data: admin,
            });
        },
    );


/*
|--------------------------------------------------------------------------
| Check Admin Login
|--------------------------------------------------------------------------
*/

export const ensureAdminCanLoginController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const adminId =
                getRouteParam(
                    req.params.adminId,
                    "Admin ID",
                );

            const admin =
                await ensureAdminCanLogin(
                    adminId,
                );

            res.status(200).json({
                success: true,
                message:
                    "Admin login is allowed.",
                data: {
                    adminId:
                        admin._id,
                },
            });
        },
    );


/*
|--------------------------------------------------------------------------
| Require Admin By User
|--------------------------------------------------------------------------
*/

export const requireAdminByUserController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const userId =
                getRouteParam(
                    req.params.userId,
                    "User ID",
                );

            const admin =
                await requireAdminByUserId(
                    userId,
                );

            res.status(200).json({
                success: true,
                message:
                    "Admin account retrieved successfully.",
                data: admin,
            });
        },
    );