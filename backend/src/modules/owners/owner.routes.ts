import {
    Router,
} from "express";

import {
    ownerAuth,
    ownerSecretVerified,
} from "../../middlewares/ownerAuth.middleware";

import {
    uploadSingleImage,
} from "../../middlewares/upload.middleware";

import {
    getMyOwnerProfileController,
    uploadMyOwnerAvatarController,
    removeMyOwnerAvatarController,
} from "./owner.controller";


const ownerRouter =
    Router();


/*
|--------------------------------------------------------------------------
| Owner Profile
|--------------------------------------------------------------------------
|
| GET /api/owners/me
|
|--------------------------------------------------------------------------
*/

ownerRouter.get(
    "/me",
    ownerAuth,
    ownerSecretVerified,
    getMyOwnerProfileController
);


/*
|--------------------------------------------------------------------------
| Upload / Replace Owner Avatar
|--------------------------------------------------------------------------
|
| POST /api/owners/me/avatar
|
| Multipart field:
| image
|
|--------------------------------------------------------------------------
*/

ownerRouter.post(
    "/me/avatar",
    ownerAuth,
    ownerSecretVerified,
    uploadSingleImage,
    uploadMyOwnerAvatarController
);


/*
|--------------------------------------------------------------------------
| Remove Owner Avatar
|--------------------------------------------------------------------------
|
| DELETE /api/owners/me/avatar
|
|--------------------------------------------------------------------------
*/

ownerRouter.delete(
    "/me/avatar",
    ownerAuth,
    ownerSecretVerified,
    removeMyOwnerAvatarController
);


export {
    ownerRouter,
};
