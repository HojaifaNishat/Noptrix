import {
    Types,
} from "mongoose";

import {
    Owner,
    OWNER_STATUSES,
} from "./owner.model";

import {
    User,
} from "../users/user.model";

import {
    ApiError,
} from "../../utils/ApiError";


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface OwnerProfile {
    readonly ownerId: string;
    readonly userId: string;
    readonly role: "OWNER";
    readonly status: string;
    readonly name: string;
    readonly email?: string;
    readonly phone?: string;
    readonly lastLoginAt?: Date;
    readonly lastSecretVerificationAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const validateObjectId = (
    value: string,
    fieldName: string
): Types.ObjectId => {
    if (!Types.ObjectId.isValid(value)) {
        throw ApiError.badRequest(
            `Invalid ${fieldName}.`,
            {
                code: "INVALID_OBJECT_ID",
            }
        );
    }

    return new Types.ObjectId(value);
};


/*
|--------------------------------------------------------------------------
| Get Owner By ID
|--------------------------------------------------------------------------
*/

export const getOwnerById = async (
    ownerId: string
) => {
    const ownerObjectId = validateObjectId(
        ownerId,
        "owner ID"
    );

    const owner = await Owner.findById(ownerObjectId)
        .select("-secretCodeHash")
        .populate({
            path: "userId",
            select: "name email phone status",
        })
        .lean()
        .exec();

    if (!owner) {
        throw ApiError.notFound(
            "Owner not found.",
            {
                code: "OWNER_NOT_FOUND",
            }
        );
    }

    return owner;
};


/*
|--------------------------------------------------------------------------
| Get Owner By User ID
|--------------------------------------------------------------------------
*/

export const getOwnerByUserId = async (
    userId: string
) => {
    const userObjectId = validateObjectId(
        userId,
        "user ID"
    );

    const owner = await Owner.findOne({
        userId: userObjectId,
    })
        .select("-secretCodeHash")
        .populate({
            path: "userId",
            select: "name email phone status",
        })
        .lean()
        .exec();

    if (!owner) {
        throw ApiError.notFound(
            "Owner not found.",
            {
                code: "OWNER_NOT_FOUND",
            }
        );
    }

    return owner;
};


/*
|--------------------------------------------------------------------------
| Require Active Owner
|--------------------------------------------------------------------------
*/

export const requireActiveOwner = async (
    userId: string
) => {
    const userObjectId = validateObjectId(
        userId,
        "user ID"
    );

    const owner = await Owner.findOne({
        userId: userObjectId,
        role: "OWNER",
        status: OWNER_STATUSES.ACTIVE,
    })
        .select("-secretCodeHash")
        .lean()
        .exec();

    if (!owner) {
        throw ApiError.forbidden(
            "Active owner access is required.",
            {
                code: "ACTIVE_OWNER_REQUIRED",
            }
        );
    }

    return owner;
};


/*
|--------------------------------------------------------------------------
| Get Owner Profile
|--------------------------------------------------------------------------
*/

export const getOwnerProfile = async (
    userId: string
): Promise<OwnerProfile> => {
    const userObjectId = validateObjectId(
        userId,
        "user ID"
    );

    const owner = await Owner.findOne({
        userId: userObjectId,
        role: "OWNER",
    })
        .select("-secretCodeHash")
        .lean()
        .exec();

    if (!owner) {
        throw ApiError.notFound(
            "Owner profile not found.",
            {
                code: "OWNER_PROFILE_NOT_FOUND",
            }
        );
    }

    const user = await User.findById(owner.userId)
        .select("name email phone")
        .lean()
        .exec();

    if (!user) {
        throw ApiError.notFound(
            "Owner user account not found.",
            {
                code: "OWNER_USER_NOT_FOUND",
            }
        );
    }

    return {
        ownerId: owner._id.toString(),
        userId: owner.userId.toString(),
        role: "OWNER",
        status: owner.status,
        name: user.name,
        email: user.email,
        phone: user.phone,
        lastLoginAt: owner.lastLoginAt,
        lastSecretVerificationAt:
            owner.lastSecretVerificationAt,
        createdAt: owner.createdAt,
        updatedAt: owner.updatedAt,
    };
};