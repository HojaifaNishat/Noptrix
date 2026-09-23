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
    getCustomerById,
    getCustomerByUserId,
    requireCustomerByUserId,
    createCustomer,
    updateCustomer,
    updateCustomerStatus,
    deleteCustomer,
} from "./customer.service";

import type {
    CreateCustomerInput,
    UpdateCustomerInput,
    UpdateCustomerStatusInput,
    CustomerIdParam,
} from "./customer.validator";

/*
|--------------------------------------------------------------------------
| Sanitize Customer
|--------------------------------------------------------------------------
|
| Keep the controller response clean and predictable.
|
*/

const sanitizeCustomer = (
    customer: any
) => {
    const customerObject =
        typeof customer.toObject === "function"
            ? customer.toObject()
            : { ...customer };

    return customerObject;
};

/*
|--------------------------------------------------------------------------
| Create Customer
|--------------------------------------------------------------------------
*/

export const createCustomerController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {
            const input =
                req.body as CreateCustomerInput;

            const customer =
                await createCustomer(
                    input
                );

            res.status(201).json({
                success: true,
                message:
                    "Customer profile created successfully.",
                data: sanitizeCustomer(
                    customer
                ),
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Get My Customer Profile
|--------------------------------------------------------------------------
*/

export const getMyCustomerController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {
            const userId =
                getAuthenticatedUserId(
                    req
                );

            if (!userId) {
                throw ApiError.unauthorized(
                    "Authentication required.",
                    {
                        code:
                            "AUTHENTICATION_REQUIRED",
                    }
                );
            }

            const customer =
                await requireCustomerByUserId(
                    userId
                );

            res.status(200).json({
                success: true,
                message:
                    "Customer profile retrieved successfully.",
                data: sanitizeCustomer(
                    customer
                ),
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Get Customer By ID
|--------------------------------------------------------------------------
*/

export const getCustomerController =
    asyncHandler(
        async (
            req: Request<
                CustomerIdParam
            >,
            res: Response
        ) => {
            const {
                customerId,
            } = req.params;

            const customer =
                await getCustomerById(
                    customerId
                );

            res.status(200).json({
                success: true,
                message:
                    "Customer retrieved successfully.",
                data: sanitizeCustomer(
                    customer
                ),
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Get Customer By User ID
|--------------------------------------------------------------------------
*/

export const getCustomerByUserController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {
            const userId =
                getAuthenticatedUserId(
                    req
                );

            if (!userId) {
                throw ApiError.unauthorized(
                    "Authentication required.",
                    {
                        code:
                            "AUTHENTICATION_REQUIRED",
                    }
                );
            }

            const customer =
                await getCustomerByUserId(
                    userId
                );

            if (!customer) {
                throw ApiError.notFound(
                    "Customer profile not found.",
                    {
                        code:
                            "CUSTOMER_NOT_FOUND",
                    }
                );
            }

            res.status(200).json({
                success: true,
                message:
                    "Customer retrieved successfully.",
                data: sanitizeCustomer(
                    customer
                ),
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Update My Customer Profile
|--------------------------------------------------------------------------
*/

export const updateMyCustomerController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {
            const userId =
                getAuthenticatedUserId(
                    req
                );

            if (!userId) {
                throw ApiError.unauthorized(
                    "Authentication required.",
                    {
                        code:
                            "AUTHENTICATION_REQUIRED",
                    }
                );
            }

            const customer =
                await requireCustomerByUserId(
                    userId
                );

            const input =
                req.body as UpdateCustomerInput;

            const updatedCustomer =
                await updateCustomer(
                    customer._id.toString(),
                    input
                );

            res.status(200).json({
                success: true,
                message:
                    "Customer profile updated successfully.",
                data: sanitizeCustomer(
                    updatedCustomer
                ),
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Update Customer
|--------------------------------------------------------------------------
*/

export const updateCustomerController =
    asyncHandler(
        async (
            req: Request<
                CustomerIdParam
            >,
            res: Response
        ) => {
            const {
                customerId,
            } = req.params;

            const input =
                req.body as UpdateCustomerInput;

            const customer =
                await updateCustomer(
                    customerId,
                    input
                );

            res.status(200).json({
                success: true,
                message:
                    "Customer updated successfully.",
                data: sanitizeCustomer(
                    customer
                ),
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Update Customer Status
|--------------------------------------------------------------------------
*/

export const updateCustomerStatusController =
    asyncHandler(
        async (
            req: Request<
                CustomerIdParam,
                unknown,
                UpdateCustomerStatusInput
            >,
            res: Response
        ) => {
            const {
                customerId,
            } = req.params;

            const {
                status,
            } = req.body;

            const customer =
                await updateCustomerStatus(
                    customerId,
                    status
                );

            res.status(200).json({
                success: true,
                message:
                    "Customer status updated successfully.",
                data: sanitizeCustomer(
                    customer
                ),
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Delete Customer
|--------------------------------------------------------------------------
*/

export const deleteCustomerController =
    asyncHandler(
        async (
            req: Request<
                CustomerIdParam
            >,
            res: Response
        ) => {
            const {
                customerId,
            } = req.params;

            await deleteCustomer(
                customerId
            );

            res.status(200).json({
                success: true,
                message:
                    "Customer deleted successfully.",
            });
        }
    );