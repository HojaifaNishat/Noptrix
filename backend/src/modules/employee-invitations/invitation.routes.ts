import {
    Router,
} from "express";

import {
    adminAuth,
    adminSecretVerified,
} from "../../middlewares/adminAuth.middleware";

import {
    requirePermissionMatch,
} from "../../middlewares/permission.middleware";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    createInvitationController,
    getInvitationController,
    validateInvitationController,
    acceptInvitationController,
    revokeInvitationController,
    listInvitationsController,
} from "./invitation.controller";

import {
    createInvitationSchema,
    invitationIdParamSchema,
    acceptInvitationSchema,
    invitationTokenSchema,
    invitationQuerySchema,
} from "./invitation.validator";

const router = Router();

/*
|--------------------------------------------------------------------------
| Administrative Authentication
|--------------------------------------------------------------------------
|
| OWNER
|   → Automatic full A-Z access
|
| ADMIN / HR / STAFF
|   → Only explicitly granted permissions
|
|--------------------------------------------------------------------------
*/

const adminManagementAuth = [
    adminAuth,
    adminSecretVerified,
];

/*
|--------------------------------------------------------------------------
| Create Employee Invitation
|--------------------------------------------------------------------------
|
| Required:
|   employee_invitations.create
|
| OWNER automatically passes permission middleware.
|
| HR/Admin must receive this permission from OWNER.
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    ...adminManagementAuth,
    requirePermissionMatch(
        "employee_invitations.create",
        "employee_invitations.manage",
    ),
    validate(
        createInvitationSchema,
        "body",
    ),
    createInvitationController,
);

/*
|--------------------------------------------------------------------------
| Validate Invitation Token
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/

router.get(
    "/validate",
    validate(
        invitationTokenSchema,
        "query",
    ),
    validateInvitationController,
);

/*
|--------------------------------------------------------------------------
| Accept Employee Invitation
|--------------------------------------------------------------------------
| Public
|
| The applicant already has a User account.
|
| Accepting the invitation converts:
|
| User
|   ↓
| Employee
|
| No new User/Admin is created.
|--------------------------------------------------------------------------
*/

router.post(
    "/accept",
    validate(
        acceptInvitationSchema,
        "body",
    ),
    acceptInvitationController,
);

/*
|--------------------------------------------------------------------------
| List Employee Invitations
|--------------------------------------------------------------------------
|
| Required:
|   employee_invitations.read
|   OR employee_invitations.manage
|
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    ...adminManagementAuth,
    requirePermissionMatch(
        "employee_invitations.read",
        "employee_invitations.manage",
    ),
    validate(
        invitationQuerySchema,
        "query",
    ),
    listInvitationsController,
);

/*
|--------------------------------------------------------------------------
| Get Employee Invitation
|--------------------------------------------------------------------------
|
| Required:
|   employee_invitations.read
|
|--------------------------------------------------------------------------
*/

router.get(
    "/:invitationId",
    ...adminManagementAuth,
    requirePermissionMatch(
        "employee_invitations.read",
        "employee_invitations.manage",
    ),
    validate(
        invitationIdParamSchema,
        "params",
    ),
    getInvitationController,
);

/*
|--------------------------------------------------------------------------
| Revoke Employee Invitation
|--------------------------------------------------------------------------
|
| Required:
|   employee_invitations.revoke
|   OR employee_invitations.manage
|
|--------------------------------------------------------------------------
*/

router.post(
    "/:invitationId/revoke",
    ...adminManagementAuth,
    requirePermissionMatch(
        "employee_invitations.revoke",
        "employee_invitations.manage",
    ),
    validate(
        invitationIdParamSchema,
        "params",
    ),
    revokeInvitationController,
);

export default router;
