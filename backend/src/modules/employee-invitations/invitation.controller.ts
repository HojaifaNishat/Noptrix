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
    getAuthenticatedAdminId,
} from "../../middlewares/adminAuth.middleware";

import {
    createInvitation,
    getInvitationById,
    getInvitationByToken,
    acceptInvitation,
    revokeInvitation,
    listInvitations,
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
| Create Employee Invitation
|--------------------------------------------------------------------------
| OWNER + authorized ADMIN/HR
|--------------------------------------------------------------------------
*/

export const createInvitationController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const invitedBy =
                getAuthenticatedAdminId(
                    req,
                );

            const invitation =
                await createInvitation({
                    applicationId:
                        req.body.applicationId,

                    roleId:
                        req.body.roleId,

                    invitedBy,
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
| Get Employee Invitation
|--------------------------------------------------------------------------
| OWNER + authorized ADMIN/HR
|--------------------------------------------------------------------------
*/

export const getInvitationController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            getAuthenticatedAdminId(
                req,
            );

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
                    "Employee invitation retrieved successfully.",
                data: invitation,
            });
        },
    );

/*
|--------------------------------------------------------------------------
| Validate Invitation Token
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
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
                    "Employee invitation is valid.",
                data: {
                    invitationId:
                        invitation._id,

                    applicationId:
                        invitation.applicationId,

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
| Accept Employee Invitation
|--------------------------------------------------------------------------
| Public
|
| Existing applicant User becomes Employee.
|--------------------------------------------------------------------------
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
| List Employee Invitations
|--------------------------------------------------------------------------
| OWNER + authorized ADMIN/HR
|--------------------------------------------------------------------------
*/

export const listInvitationsController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            getAuthenticatedAdminId(
                req,
            );

            const result =
                await listInvitations({
                    page:
                        typeof req.query.page === "string"
                            ? Number(req.query.page)
                            : undefined,

                    limit:
                        typeof req.query.limit === "string"
                            ? Number(req.query.limit)
                            : undefined,

                    status:
                        typeof req.query.status === "string"
                            ? req.query.status as
                                | "PENDING"
                                | "ACCEPTED"
                                | "EXPIRED"
                                | "REVOKED"
                            : undefined,

                    search:
                        typeof req.query.search === "string"
                            ? req.query.search
                            : undefined,

                    applicationId:
                        typeof req.query.applicationId === "string"
                            ? req.query.applicationId
                            : undefined,

                    roleId:
                        typeof req.query.roleId === "string"
                            ? req.query.roleId
                            : undefined,
                });

            res.status(200).json({
                success: true,
                message:
                    "Employee invitations retrieved successfully.",
                data: result,
            });
        },
    );


/*
|--------------------------------------------------------------------------
| Revoke Employee Invitation
|--------------------------------------------------------------------------
| OWNER + authorized ADMIN/HR
|--------------------------------------------------------------------------
*/

export const revokeInvitationController =
    asyncHandler(
        async (
            req: Request,
            res: Response,
        ) => {
            const revokedBy =
                getAuthenticatedAdminId(
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
                    revokedBy,
                );

            res.status(200).json({
                success: true,
                message:
                    "Employee invitation revoked successfully.",
                data: invitation,
            });
        },
    );
