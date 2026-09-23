import { Types } from "mongoose";

import { User } from "../users/user.model";

import {
    Customer,
    CUSTOMER_STATUSES,
    type CustomerStatus,
} from "./customer.model";

import {
    type CreateCustomerInput,
    type UpdateCustomerInput,
} from "./customer.validator";

import { ApiError } from "../../utils/ApiError";

/*
|--------------------------------------------------------------------------
| ObjectId Validation
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
| Get Customer By ID
|--------------------------------------------------------------------------
*/

export const getCustomerById = async (
    customerId: string
) => {
    const _id = validateObjectId(
        customerId,
        "customer ID"
    );

    const customer =
        await Customer.findById(_id);

    if (!customer) {
        throw ApiError.notFound(
            "Customer not found.",
            {
                code: "CUSTOMER_NOT_FOUND",
            }
        );
    }

    return customer;
};

/*
|--------------------------------------------------------------------------
| Get Customer By User ID
|--------------------------------------------------------------------------
*/

export const getCustomerByUserId = async (
    userId: string
) => {
    const _userId = validateObjectId(
        userId,
        "user ID"
    );

    return Customer.findOne({
        userId: _userId,
    });
};

/*
|--------------------------------------------------------------------------
| Require Customer By User ID
|--------------------------------------------------------------------------
*/

export const requireCustomerByUserId =
    async (
        userId: string
    ) => {
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

        return customer;
    };

/*
|--------------------------------------------------------------------------
| Create Customer
|--------------------------------------------------------------------------
*/

export const createCustomer = async (
    input: CreateCustomerInput
) => {
    const userId = validateObjectId(
        input.userId,
        "user ID"
    );

    /*
     * Customer must belong to
     * an existing User account.
     */
    const user =
        await User.findById(userId);

    if (!user) {
        throw ApiError.notFound(
            "User not found.",
            {
                code: "USER_NOT_FOUND",
            }
        );
    }

    /*
     * One User can have only
     * one Customer profile.
     */
    const existingCustomer =
        await Customer.findOne({
            userId,
        });

    if (existingCustomer) {
        throw ApiError.conflict(
            "Customer profile already exists for this user.",
            {
                code:
                    "CUSTOMER_ALREADY_EXISTS",
            }
        );
    }

    return Customer.create({
        userId,
        status: CUSTOMER_STATUSES.ACTIVE,
        avatar: input.avatar,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender,
        totalOrders: 0,
        totalSpent: 0,
        totalRefunded: 0,
    });
};

/*
|--------------------------------------------------------------------------
| Update Customer
|--------------------------------------------------------------------------
*/

export const updateCustomer = async (
    customerId: string,
    input: UpdateCustomerInput
) => {
    const _id = validateObjectId(
        customerId,
        "customer ID"
    );

    const customer =
        await Customer.findById(_id);

    if (!customer) {
        throw ApiError.notFound(
            "Customer not found.",
            {
                code: "CUSTOMER_NOT_FOUND",
            }
        );
    }

    if (input.avatar !== undefined) {
        customer.avatar =
            input.avatar;
    }

    if (
        input.dateOfBirth !==
        undefined
    ) {
        customer.dateOfBirth =
            input.dateOfBirth;
    }

    if (input.gender !== undefined) {
        customer.gender =
            input.gender;
    }

    await customer.save();

    return customer;
};

/*
|--------------------------------------------------------------------------
| Update Customer Status
|--------------------------------------------------------------------------
*/

export const updateCustomerStatus =
    async (
        customerId: string,
        status: CustomerStatus
    ) => {
        const _id = validateObjectId(
            customerId,
            "customer ID"
        );

        const customer =
            await Customer.findById(_id);

        if (!customer) {
            throw ApiError.notFound(
                "Customer not found.",
                {
                    code:
                        "CUSTOMER_NOT_FOUND",
                }
            );
        }

        customer.status = status;

        await customer.save();

        return customer;
    };

/*
|--------------------------------------------------------------------------
| Activate Customer
|--------------------------------------------------------------------------
*/

export const activateCustomer =
    async (
        customerId: string
    ) => {
        return updateCustomerStatus(
            customerId,
            CUSTOMER_STATUSES.ACTIVE
        );
    };

/*
|--------------------------------------------------------------------------
| Deactivate Customer
|--------------------------------------------------------------------------
*/

export const deactivateCustomer =
    async (
        customerId: string
    ) => {
        return updateCustomerStatus(
            customerId,
            CUSTOMER_STATUSES.INACTIVE
        );
    };

/*
|--------------------------------------------------------------------------
| Suspend Customer
|--------------------------------------------------------------------------
*/

export const suspendCustomer =
    async (
        customerId: string
    ) => {
        return updateCustomerStatus(
            customerId,
            CUSTOMER_STATUSES.SUSPENDED
        );
    };

/*
|--------------------------------------------------------------------------
| Block Customer
|--------------------------------------------------------------------------
*/

export const blockCustomer =
    async (
        customerId: string
    ) => {
        return updateCustomerStatus(
            customerId,
            CUSTOMER_STATUSES.BLOCKED
        );
    };

/*
|--------------------------------------------------------------------------
| Delete Customer
|--------------------------------------------------------------------------
*/

export const deleteCustomer = async (
    customerId: string
) => {
    const _id = validateObjectId(
        customerId,
        "customer ID"
    );

    const customer =
        await Customer.findById(_id);

    if (!customer) {
        throw ApiError.notFound(
            "Customer not found.",
            {
                code: "CUSTOMER_NOT_FOUND",
            }
        );
    }

    await Customer.deleteOne({
        _id,
    });

    return customer;
};