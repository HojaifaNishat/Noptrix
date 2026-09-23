import {
    Router,
} from "express";

import {
    ownerAuth,
} from "../../middlewares/ownerAuth.middleware";

import {
    ownerSecretVerified,
} from "../../middlewares/ownerAuth.middleware";

import {
    getMyOwnerProfileController,
} from "./owner.controller";


const ownerRouter = Router();


/*
|--------------------------------------------------------------------------
| Owner Profile
|--------------------------------------------------------------------------
|
| GET /api/owners/me
|
| Requires:
| 1. Valid OWNER access token
| 2. Verified OWNER secret code
|
|--------------------------------------------------------------------------
*/

ownerRouter.get(
    "/me",
    ownerAuth,
    ownerSecretVerified,
    getMyOwnerProfileController
);


export {
    ownerRouter,
};