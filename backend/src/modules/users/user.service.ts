import {
    Types,
} from "mongoose";

import bcrypt from "bcryptjs";

import {
    User,
    IUserDocument,
    USER_STATUSES,
    type UserStatus,
} from "./user.model";

import {
    ApiError,
} from "../../utils/ApiError";

import type {
    CreateUserInput,
    UpdateUserInput,
} from "./user.validator";

/*
|--------------------------------------------------------------------------
| Password Configuration
|--------------------------------------------------------------------------
*/

const PASSWORD_SALT_ROUNDS = 12;

/*
|--------------------------------------------------------------------------
| Create User
|--------------------------------------------------------------------------
*/

export const createUser = async (
    data: CreateUserInput
): Promise<IUserDocument> => {
    const email = data.email
        ?.trim()
        .toLowerCase();

    const phone = data.phone
        ?.trim();

    /*
    |--------------------------------------------------------------------------
    | Email / Phone Requirement
    |--------------------------------------------------------------------------
    */

    if (!email && !phone) {
        throw ApiError.badRequest(
            "Either email or phone number is required.",
            {
                code: "USER_IDENTIFIER_REQUIRED",
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Duplicate Email
    |--------------------------------------------------------------------------
    */

    if (email) {
        const existingEmail =
            await User.exists({
                email,
            });

        if (existingEmail) {
            throw ApiError.conflict(
                "An account with this email already exists.",
                {
                    code: "EMAIL_ALREADY_EXISTS",
                }
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Duplicate Phone
    |--------------------------------------------------------------------------
    */

    if (phone) {
        const existingPhone =
            await User.exists({
                phone,
            });

        if (existingPhone) {
            throw ApiError.conflict(
                "An account with this phone number already exists.",
                {
                    code: "PHONE_ALREADY_EXISTS",
                }
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Hash Password
    |--------------------------------------------------------------------------
    */

    const hashedPassword =
        await bcrypt.hash(
            data.password,
            PASSWORD_SALT_ROUNDS
        );

    /*
    |--------------------------------------------------------------------------
    | Create User
    |--------------------------------------------------------------------------
    */

    const user = await User.create({
        name: data.name.trim(),

        ...(email
            ? { email }
            : {}),

        ...(phone
            ? { phone }
            : {}),

        password: hashedPassword,

        status:
            USER_STATUSES.ACTIVE,

        isEmailVerified: false,

        isPhoneVerified: false,

        failedLoginAttempts: 0,
    });

    return user;
};

/*
|--------------------------------------------------------------------------
| Find User By ID
|--------------------------------------------------------------------------
*/

export const findUserById = async (
    userId: string | Types.ObjectId
): Promise<IUserDocument | null> => {
    if (
        !Types.ObjectId.isValid(
            userId
        )
    ) {
        return null;
    }

    return User.findById(
        userId
    ).exec();
};

/*
|--------------------------------------------------------------------------
| Find User By Email
|--------------------------------------------------------------------------
*/

export const findUserByEmail = async (
    email: string,
    includePassword = false
): Promise<IUserDocument | null> => {
    const normalizedEmail =
        email.trim().toLowerCase();

    const query = User.findOne({
        email: normalizedEmail,
    });

    if (includePassword) {
        query.select("+password");
    }

    return query.exec();
};

/*
|--------------------------------------------------------------------------
| Find User By Phone
|--------------------------------------------------------------------------
*/

export const findUserByPhone = async (
    phone: string,
    includePassword = false
): Promise<IUserDocument | null> => {
    const normalizedPhone =
        phone.trim();

    const query = User.findOne({
        phone: normalizedPhone,
    });

    if (includePassword) {
        query.select("+password");
    }

    return query.exec();
};

/*
|--------------------------------------------------------------------------
| Find User For Authentication
|--------------------------------------------------------------------------
*/

export const findUserForAuthentication =
    async (
        identifier: string
    ): Promise<IUserDocument | null> => {
        const normalized =
            identifier
                .trim()
                .toLowerCase();

        const isEmail =
            normalized.includes("@");

        const query = isEmail
            ? {
                  email: normalized,
              }
            : {
                  phone: identifier.trim(),
              };

        return User.findOne(
            query
        )
            .select("+password")
            .exec();
    };

/*
|--------------------------------------------------------------------------
| Verify Password
|--------------------------------------------------------------------------
*/

export const verifyUserPassword =
    async (
        user: IUserDocument,
        password: string
    ): Promise<boolean> => {
        return bcrypt.compare(
            password,
            user.password
        );
    };

/*
|--------------------------------------------------------------------------
| Update User
|--------------------------------------------------------------------------
*/

export const updateUser = async (
    userId: string,
    data: UpdateUserInput
): Promise<IUserDocument> => {
    if (
        !Types.ObjectId.isValid(
            userId
        )
    ) {
        throw ApiError.badRequest(
            "Invalid user ID.",
            {
                code: "INVALID_USER_ID",
            }
        );
    }

    const updateData: Partial<IUserDocument> =
        {};

    /*
    |--------------------------------------------------------------------------
    | Name
    |--------------------------------------------------------------------------
    */

    if (data.name !== undefined) {
        updateData.name =
            data.name.trim();
    }

    /*
    |--------------------------------------------------------------------------
    | Email
    |--------------------------------------------------------------------------
    */

    if (data.email !== undefined) {
        const email =
            data.email
                .trim()
                .toLowerCase();

        const existingEmail =
            await User.exists({
                email,

                _id: {
                    $ne: userId,
                },
            });

        if (existingEmail) {
            throw ApiError.conflict(
                "An account with this email already exists.",
                {
                    code: "EMAIL_ALREADY_EXISTS",
                }
            );
        }

        updateData.email = email;
    }

    /*
    |--------------------------------------------------------------------------
    | Phone
    |--------------------------------------------------------------------------
    */

    if (data.phone !== undefined) {
        const phone =
            data.phone.trim();

        const existingPhone =
            await User.exists({
                phone,

                _id: {
                    $ne: userId,
                },
            });

        if (existingPhone) {
            throw ApiError.conflict(
                "An account with this phone number already exists.",
                {
                    code: "PHONE_ALREADY_EXISTS",
                }
            );
        }

        updateData.phone = phone;
    }

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    const user =
        await User.findByIdAndUpdate(
            userId,
            {
                $set: updateData,
            },
            {
                new: true,
                runValidators: true,
            }
        ).exec();

    if (!user) {
        throw ApiError.notFound(
            "User not found.",
            {
                code: "USER_NOT_FOUND",
            }
        );
    }

    return user;
};

/*
|--------------------------------------------------------------------------
| Change Password
|--------------------------------------------------------------------------
*/

export const changeUserPassword =
    async (
        userId: string,
        currentPassword: string,
        newPassword: string
    ): Promise<void> => {
        if (
            !Types.ObjectId.isValid(
                userId
            )
        ) {
            throw ApiError.badRequest(
                "Invalid user ID.",
                {
                    code: "INVALID_USER_ID",
                }
            );
        }

        const user =
            await User.findById(
                userId
            ).select("+password");

        if (!user) {
            throw ApiError.notFound(
                "User not found.",
                {
                    code: "USER_NOT_FOUND",
                }
            );
        }

        const passwordMatches =
            await bcrypt.compare(
                currentPassword,
                user.password
            );

        if (!passwordMatches) {
            throw ApiError.unauthorized(
                "Current password is incorrect.",
                {
                    code: "INVALID_CURRENT_PASSWORD",
                }
            );
        }

        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                PASSWORD_SALT_ROUNDS
            );

        user.password =
            hashedPassword;

        user.passwordChangedAt =
            new Date();

        user.failedLoginAttempts = 0;

        user.lockedUntil =
            undefined;

        await user.save();
    };

/*
|--------------------------------------------------------------------------
| Update Last Login
|--------------------------------------------------------------------------
*/

export const updateLastLogin =
    async (
        userId: string
    ): Promise<void> => {
        await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    lastLoginAt:
                        new Date(),

                    failedLoginAttempts: 0,
                },

                $unset: {
                    lockedUntil: 1,
                },
            }
        ).exec();
    };

/*
|--------------------------------------------------------------------------
| Update User Status
|--------------------------------------------------------------------------
*/

export const updateUserStatus =
    async (
        userId: string,
        status: UserStatus
    ): Promise<IUserDocument> => {
        if (
            !Types.ObjectId.isValid(
                userId
            )
        ) {
            throw ApiError.badRequest(
                "Invalid user ID.",
                {
                    code: "INVALID_USER_ID",
                }
            );
        }

        const user =
            await User.findByIdAndUpdate(
                userId,
                {
                    $set: {
                        status,
                    },
                },
                {
                    new: true,
                    runValidators: true,
                }
            ).exec();

        if (!user) {
            throw ApiError.notFound(
                "User not found.",
                {
                    code: "USER_NOT_FOUND",
                }
            );
        }

        return user;
    };

/*
|--------------------------------------------------------------------------
| Record Failed Login
|--------------------------------------------------------------------------
*/

export const recordFailedLogin =
    async (
        userId: string,
        maxAttempts = 5,
        lockDurationMs =
            15 * 60 * 1000
    ): Promise<void> => {
        if (
            !Types.ObjectId.isValid(
                userId
            )
        ) {
            return;
        }

        const user =
            await User.findById(
                userId
            );

        if (!user) {
            return;
        }

        user.failedLoginAttempts += 1;

        if (
            user.failedLoginAttempts >=
            maxAttempts
        ) {
            user.lockedUntil =
                new Date(
                    Date.now() +
                        lockDurationMs
                );
        }

        await user.save();
    };

/*
|--------------------------------------------------------------------------
| Reset Failed Login Attempts
|--------------------------------------------------------------------------
*/

export const resetFailedLoginAttempts =
    async (
        userId: string
    ): Promise<void> => {
        if (
            !Types.ObjectId.isValid(
                userId
            )
        ) {
            return;
        }

        await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    failedLoginAttempts: 0,
                },

                $unset: {
                    lockedUntil: 1,
                },
            }
        ).exec();
    };

/*
|--------------------------------------------------------------------------
| Check Account Lock
|--------------------------------------------------------------------------
*/

export const isUserLocked =
    (
        user: IUserDocument
    ): boolean => {
        if (!user.lockedUntil) {
            return false;
        }

        return (
            user.lockedUntil.getTime() >
            Date.now()
        );
    };