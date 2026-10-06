import {
    Types,
} from "mongoose";

import {
    User,
} from "./user.model";

import {
    ApiError,
} from "../../utils/ApiError";

import {
    uploadBufferToCloudinary,
    deleteFromCloudinary,
} from "../../services/cloudinary.service";


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface UserAvatarResult {
    readonly avatarUrl: string;
    readonly avatarPublicId: string;
}


/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const AVATAR_FOLDER =
    "noptrix/users/avatars";


/*
|--------------------------------------------------------------------------
| Validate User ID
|--------------------------------------------------------------------------
*/

const validateUserId = (
    userId: string
): Types.ObjectId => {
    if (
        !Types.ObjectId.isValid(
            userId
        )
    ) {
        throw ApiError.badRequest(
            "Invalid user ID.",
            {
                code:
                    "INVALID_USER_ID",
            }
        );
    }

    return new Types.ObjectId(
        userId
    );
};


/*
|--------------------------------------------------------------------------
| Upload / Replace User Avatar
|--------------------------------------------------------------------------
*/

export const uploadUserAvatar =
    async (
        userId: string,
        file: Express.Multer.File
    ): Promise<UserAvatarResult> => {

        const userObjectId =
            validateUserId(
                userId
            );

        if (!file) {
            throw ApiError.badRequest(
                "Avatar image is required.",
                {
                    code:
                        "AVATAR_FILE_REQUIRED",
                }
            );
        }

        if (
            !file.buffer ||
            file.buffer.length === 0
        ) {
            throw ApiError.badRequest(
                "Uploaded avatar image is empty.",
                {
                    code:
                        "AVATAR_FILE_EMPTY",
                }
            );
        }

        const user =
            await User.findById(
                userObjectId
            )
                .select(
                    "avatarUrl avatarPublicId"
                )
                .exec();

        if (!user) {
            throw ApiError.notFound(
                "User not found.",
                {
                    code:
                        "USER_NOT_FOUND",
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Upload New Avatar
        |--------------------------------------------------------------------------
        |
        | Keep the old Cloudinary asset untouched until the database
        | successfully points to the new asset.
        |
        |--------------------------------------------------------------------------
        */

        const uploaded =
            await uploadBufferToCloudinary(
                {
                    buffer:
                        file.buffer,

                    filename:
                        file.originalname,
                },
                {
                    folder:
                        AVATAR_FOLDER,

                    resourceType:
                        "image",

                    overwrite:
                        false,

                    useUniqueFilename:
                        true,

                    invalidate:
                        true,

                    transformation: [
                        {
                            width: 800,
                            height: 800,
                            crop: "limit",
                            quality: "auto",
                            fetch_format: "auto",
                        },
                    ],
                }
            );

        /*
        |--------------------------------------------------------------------------
        | Save New Avatar To User
        |--------------------------------------------------------------------------
        */

        const oldPublicId =
            user.avatarPublicId;

        try {
            user.avatarUrl =
                uploaded.secureUrl;

            user.avatarPublicId =
                uploaded.publicId;

            await user.save();
        } catch (error) {
            /*
            |--------------------------------------------------------------------------
            | Database update failed.
            |--------------------------------------------------------------------------
            |
            | Remove the newly uploaded asset so Cloudinary does not
            | accumulate orphaned avatar files.
            |
            |--------------------------------------------------------------------------
            */

            try {
                await deleteFromCloudinary(
                    uploaded.publicId,
                    "image"
                );
            } catch {
                /*
                | Cleanup failure is intentionally ignored here.
                | The original database error is more important.
                */
            }

            throw error;
        }

        /*
        |--------------------------------------------------------------------------
        | Delete Previous Avatar
        |--------------------------------------------------------------------------
        |
        | Database now points to the new avatar, so deleting the old
        | asset is safe.
        |
        |--------------------------------------------------------------------------
        */

        if (
            oldPublicId &&
            oldPublicId !==
                uploaded.publicId
        ) {
            try {
                await deleteFromCloudinary(
                    oldPublicId,
                    "image"
                );
            } catch {
                /*
                |--------------------------------------------------------------------------
                | Do not fail the successful avatar update if old
                | Cloudinary cleanup fails.
                |--------------------------------------------------------------------------
                */
            }
        }

        return {
            avatarUrl:
                uploaded.secureUrl,

            avatarPublicId:
                uploaded.publicId,
        };
    };


/*
|--------------------------------------------------------------------------
| Remove User Avatar
|--------------------------------------------------------------------------
*/

export const removeUserAvatar =
    async (
        userId: string
    ): Promise<void> => {

        const userObjectId =
            validateUserId(
                userId
            );

        const user =
            await User.findById(
                userObjectId
            )
                .select(
                    "avatarUrl avatarPublicId"
                )
                .exec();

        if (!user) {
            throw ApiError.notFound(
                "User not found.",
                {
                    code:
                        "USER_NOT_FOUND",
                }
            );
        }

        const oldPublicId =
            user.avatarPublicId;

        /*
        |--------------------------------------------------------------------------
        | Remove Database Reference First
        |--------------------------------------------------------------------------
        */

        user.avatarUrl =
            undefined;

        user.avatarPublicId =
            undefined;

        await user.save();

        /*
        |--------------------------------------------------------------------------
        | Remove Cloudinary Asset
        |--------------------------------------------------------------------------
        */

        if (oldPublicId) {
            try {
                await deleteFromCloudinary(
                    oldPublicId,
                    "image"
                );
            } catch {
                /*
                |--------------------------------------------------------------------------
                | Database is already clean.
                | Cloudinary cleanup can be retried later.
                |--------------------------------------------------------------------------
                */
            }
        }
    };
