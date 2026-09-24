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
    getAuthenticatedOwnerId,
} from "../../middlewares/ownerAuth.middleware";

import {
    createInvitation,
    getInvitationById,
    getInvitationByToken,
    acceptInvitation,
    revokeInvitation,
} from "./invitation.service";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getRouteParam = (
    value: string | string[] | undefined,
    fieldName: string,
): string => {
    if (
        typeof value !== "string" ||
        !value.trim()
    ) {
        throw ApiError.badRequest(
            `${fieldName} is required.`,
            {
                code: `${fieldName
                    .replace(/\s+/g, "_")
                    .toUpperCase()}_REQUIRED`,
            },
        );
    }

    return value.trim();
};

/*
|--------------------------------------------------------------------------
| Create Invitation
|--------------------------------------------------------------------------
| OWNER only
*/

export const createInvitationController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const ownerId =
                getAuthenticatedOwnerId(
                    req,
                );

            const invitation =
                await createInvitation({
                    email:
                        req.body.email,

                    name:
                        req.body.name,

                    roleId:
                        req.body.roleId,

                    invitedBy:
                        ownerId,
                });

            res.status(201).json({
                success: true,
                message:
                    "Employee invitation created successfully.",
                data: invitation,
            });
        },
    );

/*
|--------------------------------------------------------------------------
| Get Invitation
|--------------------------------------------------------------------------
| OWNER only
*/

export const getInvitationController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            getAuthenticatedOwnerId(req);

            const invitationId =
                getRouteParam(
                    req.params.invitationId,
                    "Invitation ID",
                );

            const invitation =
                await getInvitationById(
                    invitationId,
                );

            res.status(200).json({
                success: true,
                message:
                    "Invitation retrieved successfully.",
                data: invitation,
            });
        },
    );

/*
|--------------------------------------------------------------------------
| Validate Invitation Token
|--------------------------------------------------------------------------
| Public
*/

export const validateInvitationController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const token =
                getRouteParam(
                    req.query.token as
                        | string
                        | undefined,
                    "Invitation token",
                );

            const invitation =
                await getInvitationByToken(
                    token,
                );

            res.status(200).json({
                success: true,
                message:
                    "Invitation is valid.",
                data: {
                    invitationId:
                        invitation._id,

                    email:
                        invitation.email,

                    name:
                        invitation.name,

                    roleId:
                        invitation.roleId,

                    expiresAt:
                        invitation.expiresAt,

                    status:
                        invitation.status,
                },
            });
        },
    );

/*
|--------------------------------------------------------------------------
| Accept Invitation
|--------------------------------------------------------------------------
| Public
*/

export const acceptInvitationController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const result =
                await acceptInvitation({
                    token:
                        req.body.token,

                    name:
                        req.body.name,

                    password:
                        req.body.password,

                    phone:
                        req.body.phone,
                });

            res.status(201).json({
                success: true,
                message:
                    "Employee invitation accepted successfully.",
                data: result,
            });
        },
    );

/*
|--------------------------------------------------------------------------
| Revoke Invitation
|--------------------------------------------------------------------------
| OWNER only
*/

export const revokeInvitationController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const ownerId =
                getAuthenticatedOwnerId(
                    req,
                );

            const invitationId =
                getRouteParam(
                    req.params.invitationId,
                    "Invitation ID",
                );

            const invitation =
                await revokeInvitation(
                    invitationId,
                    ownerId,
                );

            res.status(200).json({
                success: true,
                message:
                    "Employee invitation revoked successfully.",
                data: invitation,
            });
        },
    );