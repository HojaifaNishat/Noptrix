import {
    Router,
} from "express";

import {
    userAuth,
} from "../../middlewares/userAuth.middleware";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    sessionIdParamSchema,
} from "./session.validator";

import {
    getMySessions,
    revokeMySession,
    revokeAllMySessions,
} from "./session.controller";


const router =
    Router();


/*
|--------------------------------------------------------------------------
| Get My Active Sessions
|--------------------------------------------------------------------------
|
| GET /sessions/me
|
*/

router.get(
    "/me",
    userAuth,
    getMySessions
);


/*
|--------------------------------------------------------------------------
| Revoke All My Sessions
|--------------------------------------------------------------------------
|
| POST /sessions/revoke-all
|
*/

router.post(
    "/revoke-all",
    userAuth,
    revokeAllMySessions
);


/*
|--------------------------------------------------------------------------
| Revoke One Session
|--------------------------------------------------------------------------
|
| DELETE /sessions/:sessionId
|
*/

router.delete(
    "/:sessionId",
    userAuth,
    validate(
        sessionIdParamSchema,
        "params"
    ),
    revokeMySession
);


export default router;