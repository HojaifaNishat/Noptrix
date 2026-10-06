import {
    Request,
    Response,
} from "express";

import {
    getAuthenticatedOwnerUserId,
} from "../../middlewares/ownerAuth.middleware";

import {
    ApiError,
} from "../../utils/ApiError";

import {
    uploadUserAvatar,
    removeUserAvatar,
} from "../users/user-avatar.service";

import {
    getOwnerProfile,
} from "./owner.service";


/*
|--------------------------------------------------------------------------
| Get My Owner Profile
|--------------------------------------------------------------------------
*/

export const getMyOwnerProfileController = async (
    req: Request,
    res: Response
): Promise<void> => {

    const userId =
        getAuthenticatedOwnerUserId(
            req
        );

    const profile =
        await getOwnerProfile(
            userId
        );

    res.status(200).json({
        success: true,

        data:
            profile,
    });
};


/*
|--------------------------------------------------------------------------
| Upload / Replace My Owner Avatar
|--------------------------------------------------------------------------
*/

export const uploadMyOwnerAvatarController =
    async (
        req: Request,
        res: Response
    ): Promise<void> => {

        const userId =
            getAuthenticatedOwnerUserId(
                req
            );

        if (!req.file) {
            throw ApiError.badRequest(
                "Avatar image is required.",
                {
                    code:
                        "AVATAR_FILE_REQUIRED",
                }
            );
        }

        const avatar =
            await uploadUserAvatar(
                userId,
                req.file
            );

        res.status(200).json({
            success: true,

            message:
                "Owner profile picture updated successfully.",

            data: {
                avatar,
            },
        });
    };


/*
|--------------------------------------------------------------------------
| Remove My Owner Avatar
|--------------------------------------------------------------------------
*/

export const removeMyOwnerAvatarController =
    async (
        req: Request,
        res: Response
    ): Promise<void> => {

        const userId =
            getAuthenticatedOwnerUserId(
                req
            );

        await removeUserAvatar(
            userId
        );

        res.status(200).json({
            success: true,

            message:
                "Owner profile picture removed successfully.",
        });
    };
