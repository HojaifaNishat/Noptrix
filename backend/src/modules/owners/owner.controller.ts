import {
    Request,
    Response,
} from "express";

import {
    getAuthenticatedOwnerId,
} from "../../middlewares/ownerAuth.middleware";

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
    const ownerId = getAuthenticatedOwnerId(req);

    const profile = await getOwnerProfile(ownerId);

    res.status(200).json({
        success: true,
        data: profile,
    });
};