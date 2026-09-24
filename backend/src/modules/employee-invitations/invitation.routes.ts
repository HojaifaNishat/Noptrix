import { Router } from "express";

import {
    ownerAuth,
    ownerSecretVerified,
} from "../../middlewares/ownerAuth.middleware";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    createInvitationController,
    getInvitationController,
    validateInvitationController,
    acceptInvitationController,
    revokeInvitationController,
} from "./invitation.controller";

import {
    createInvitationSchema,
    invitationIdParamSchema,
    acceptInvitationSchema,
    invitationTokenSchema,
} from "./invitation.validator";

const router = Router();

/*
|--------------------------------------------------------------------------
| OWNER
|--------------------------------------------------------------------------
| Only OWNER can create, view and revoke
| employee invitations.
|--------------------------------------------------------------------------
*/

const ownerOnly = [
    ownerAuth,
    ownerSecretVerified,
];

/*
|--------------------------------------------------------------------------
| Create Invitation
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    ...ownerOnly,
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
| Accept Invitation
|--------------------------------------------------------------------------
| Public
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
| Get Invitation
|--------------------------------------------------------------------------
| OWNER only
|--------------------------------------------------------------------------
*/

router.get(
    "/:invitationId",
    ...ownerOnly,
    validate(
        invitationIdParamSchema,
        "params",
    ),
    getInvitationController,
);

/*
|--------------------------------------------------------------------------
| Revoke Invitation
|--------------------------------------------------------------------------
| OWNER only
|--------------------------------------------------------------------------
*/

router.post(
    "/:invitationId/revoke",
    ...ownerOnly,
    validate(
        invitationIdParamSchema,
        "params",
    ),
    revokeInvitationController,
);

export default router;