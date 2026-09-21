import {
    Request,
    Response,
} from "express";

import {
    asyncHandler,
} from "../../utils/asyncHandler";

import {
    ApiError,
} from "../../utils/ApiError";

import {
    getAuthenticatedUserId,
} from "../../middlewares/userAuth.middleware";

import {
    createUser,
    findUserById,
    updateUser,
    updateUserStatus,
    changeUserPassword,
} from "./user.service";

import {
    type CreateUserInput,
    type UpdateUserInput,
    type ChangePasswordInput,
    type UpdateUserStatusInput,
} from "./user.validator";


/*
|--------------------------------------------------------------------------
| Safe User Response
|--------------------------------------------------------------------------
|
| Password hash must never be exposed through an API response.
|
|--------------------------------------------------------------------------
*/

const sanitizeUser = (
    user: any
) => {
    const userObject =
        typeof user.toObject === "function"
            ? user.toObject()
            : { ...user };

    delete userObject.password;

    return userObject;
};


/*
|--------------------------------------------------------------------------
| Create User
|--------------------------------------------------------------------------
*/

export const createUserController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {

            const input =
                req.body as CreateUserInput;

            const user =
                await createUser(
                    input
                );

            res.status(201).json({
                success: true,

                message:
                    "User created successfully.",

                data: {
                    user:
                        sanitizeUser(
                            user
                        ),
                },
            });
        }
    );


/*
|--------------------------------------------------------------------------
| Get Current User
|--------------------------------------------------------------------------
*/

export const getCurrentUserController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {

            const userId =
                getAuthenticatedUserId(
                    req
                );

            const user =
                await findUserById(
                    userId
                );

            if (!user) {
                throw ApiError.notFound(
                    "User not found.",
                    {
                        code:
                            "USER_NOT_FOUND",
                    }
                );
            }

            res.status(200).json({
                success: true,

                data: {
                    user:
                        sanitizeUser(
                            user
                        ),
                },
            });
        }
    );


/*
|--------------------------------------------------------------------------
| Get User By ID
|--------------------------------------------------------------------------
*/

export const getUserController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {

            const {
                userId,
            } = req.params;

            if (
                typeof userId !== "string" ||
                !userId
            ) {
                throw ApiError.badRequest(
                    "User ID is required.",
                    {
                        code:
                            "USER_ID_REQUIRED",
                    }
                );
            }

            const user =
                await findUserById(
                    userId
                );

            if (!user) {
                throw ApiError.notFound(
                    "User not found.",
                    {
                        code:
                            "USER_NOT_FOUND",
                    }
                );
            }

            res.status(200).json({
                success: true,

                data: {
                    user:
                        sanitizeUser(
                            user
                        ),
                },
            });
        }
    );


/*
|--------------------------------------------------------------------------
| Update Current User
|--------------------------------------------------------------------------
*/

export const updateCurrentUserController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {

            const userId =
                getAuthenticatedUserId(
                    req
                );

            const input =
                req.body as UpdateUserInput;

            const user =
                await updateUser(
                    userId,
                    input
                );

            res.status(200).json({
                success: true,

                message:
                    "User updated successfully.",

                data: {
                    user:
                        sanitizeUser(
                            user
                        ),
                },
            });
        }
    );


/*
|--------------------------------------------------------------------------
| Change Current User Password
|--------------------------------------------------------------------------
*/

export const changeCurrentUserPasswordController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {

            const userId =
                getAuthenticatedUserId(
                    req
                );

            const input =
                req.body as ChangePasswordInput;

            await changeUserPassword(
                userId,
                input.currentPassword,
                input.newPassword
            );

            res.status(200).json({
                success: true,

                message:
                    "Password changed successfully.",
            });
        }
    );


/*
|--------------------------------------------------------------------------
| Update User Status
|--------------------------------------------------------------------------
*/

export const updateUserStatusController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {

            const {
                userId,
            } = req.params;

            if (
                typeof userId !== "string" ||
                !userId
            ) {
                throw ApiError.badRequest(
                    "User ID is required.",
                    {
                        code:
                            "USER_ID_REQUIRED",
                    }
                );
            }

            const input =
                req.body as UpdateUserStatusInput;

            const user =
                await updateUserStatus(
                    userId,
                    input.status
                );

            res.status(200).json({
                success: true,

                message:
                    "User status updated successfully.",

                data: {
                    user:
                        sanitizeUser(
                            user
                        ),
                },
            });
        }
    );