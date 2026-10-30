import { Types, type ClientSession } from "mongoose";

import { User } from "../users/user.model";
import { Owner } from "../owners/owner.model";

import {
  Customer,
  CUSTOMER_STATUSES,
  type CustomerStatus,
} from "./customer.model";

import {
  type CreateCustomerInput,
  type UpdateCustomerInput,
  type UpdateCustomerNotificationPreferencesInput,
} from "./customer.validator";

import { ApiError } from "../../utils/ApiError";

/*
|--------------------------------------------------------------------------
| ObjectId Validation
|--------------------------------------------------------------------------
*/

const validateObjectId = (value: string, fieldName: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(value)) {
    throw ApiError.badRequest(`Invalid ${fieldName}.`, {
      code: "INVALID_OBJECT_ID",
    });
  }

  return new Types.ObjectId(value);
};

/*
|--------------------------------------------------------------------------
| Get Customer By ID
|--------------------------------------------------------------------------
*/

export const getCustomerById = async (customerId: string) => {
  const _id = validateObjectId(customerId, "customer ID");

  const customer = await Customer.findById(_id);

  if (!customer) {
    throw ApiError.notFound("Customer not found.", {
      code: "CUSTOMER_NOT_FOUND",
    });
  }

  return customer;
};

/*
|--------------------------------------------------------------------------
| Get Customer By User ID
|--------------------------------------------------------------------------
*/

export const getCustomerByUserId = async (userId: string) => {
  const _userId = validateObjectId(userId, "user ID");

  return Customer.findOne({
    userId: _userId,
  });
};

/*
|--------------------------------------------------------------------------
| List Customers
|--------------------------------------------------------------------------
*/

export const listCustomers = async ({
  page,
  limit,
  search,
  status,
  segment,
}: {
  page: number;
  limit: number;
  search?: string;
  status?: CustomerStatus;
  segment?:
    | "ACTIVE"
    | "INACTIVE"
    | "SUSPENDED"
    | "BLOCKED"
    | "NEW_BUYERS"
    | "REPEAT_BUYERS";
}) => {
  const filter: {
    status?: CustomerStatus;
    userId?: { $in?: Types.ObjectId[]; $nin?: Types.ObjectId[] };
    totalOrders?: { $lte?: number; $gte?: number };
  } = {};
  const ownerUserIds = await Owner.distinct("userId").exec();
  filter.userId = { $nin: ownerUserIds };

  if (status) {
    filter.status = status;
  }

  if (segment) {
    if (segment === "NEW_BUYERS") {
      filter.totalOrders = { $lte: 1 };
    } else if (segment === "REPEAT_BUYERS") {
      filter.totalOrders = { $gte: 2 };
    } else {
      filter.status = segment;
    }
  }

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matchingUsers = await User.find({
      $or: [
        { name: new RegExp(escapedSearch, "i") },
        { email: new RegExp(escapedSearch, "i") },
        { phone: new RegExp(escapedSearch, "i") },
      ],
    })
      .select("_id")
      .lean()
      .exec();

    filter.userId = {
      $in: matchingUsers.map((user) => user._id),
      $nin: ownerUserIds,
    };
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Customer.find(filter)
      .populate("userId", "name email phone avatarUrl status lastLoginAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    Customer.countDocuments(filter).exec(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

export const getCustomerGroups = async () => {
  const ownerUserIds = await Owner.distinct("userId").exec();
  const baseFilter = { userId: { $nin: ownerUserIds } };
  const groups = [
    {
      id: "ACTIVE",
      name: "Active customers",
      description: "Customer accounts currently active.",
    },
    {
      id: "INACTIVE",
      name: "Inactive customers",
      description: "Customer accounts marked inactive.",
    },
    {
      id: "SUSPENDED",
      name: "Suspended customers",
      description: "Customer accounts temporarily suspended.",
    },
    {
      id: "BLOCKED",
      name: "Blocked customers",
      description: "Customer accounts blocked from activity.",
    },
    {
      id: "NEW_BUYERS",
      name: "First-time buyers",
      description: "Customers with zero or one order.",
    },
    {
      id: "REPEAT_BUYERS",
      name: "Repeat buyers",
      description: "Customers with two or more orders.",
    },
  ] as const;

  const counts = await Promise.all(
    groups.map(({ id }) =>
      Customer.countDocuments({
        ...baseFilter,
        ...(id === "NEW_BUYERS"
          ? { totalOrders: { $lte: 1 } }
          : id === "REPEAT_BUYERS"
            ? { totalOrders: { $gte: 2 } }
            : { status: id }),
      }).exec(),
    ),
  );

  return groups.map((group, index) => ({
    ...group,
    count: counts[index] ?? 0,
  }));
};

export const getCustomerNotificationPreferences = async (
  customerId: string,
) => {
  const customer = await getCustomerById(customerId);

  if (await Owner.exists({ userId: customer.userId })) {
    throw ApiError.notFound("Customer not found.", {
      code: "CUSTOMER_NOT_FOUND",
    });
  }

  return {
    customerId: customer._id.toString(),
    preferences: {
      email: customer.notificationPreferences?.email ?? true,
      sms: customer.notificationPreferences?.sms ?? true,
      push: customer.notificationPreferences?.push ?? true,
      marketing: customer.notificationPreferences?.marketing ?? false,
    },
  };
};

export const updateCustomerNotificationPreferences = async (
  customerId: string,
  preferences: UpdateCustomerNotificationPreferencesInput,
) => {
  const customer = await getCustomerById(customerId);

  if (await Owner.exists({ userId: customer.userId })) {
    throw ApiError.notFound("Customer not found.", {
      code: "CUSTOMER_NOT_FOUND",
    });
  }

  customer.notificationPreferences ??= {
    email: true,
    sms: true,
    push: true,
    marketing: false,
  };
  Object.assign(customer.notificationPreferences, preferences);
  await customer.save();

  return {
    customerId: customer._id.toString(),
    preferences: {
      email: customer.notificationPreferences.email,
      sms: customer.notificationPreferences.sms,
      push: customer.notificationPreferences.push,
      marketing: customer.notificationPreferences.marketing,
    },
  };
};

/*
|--------------------------------------------------------------------------
| Require Customer By User ID
|--------------------------------------------------------------------------
*/

export const requireCustomerByUserId = async (userId: string) => {
  const customer = await getCustomerByUserId(userId);

  if (!customer) {
    throw ApiError.notFound("Customer profile not found.", {
      code: "CUSTOMER_NOT_FOUND",
    });
  }

  return customer;
};

/*
|--------------------------------------------------------------------------
| Create Customer
|--------------------------------------------------------------------------
*/

export const createCustomer = async (
  input: CreateCustomerInput,
  session?: ClientSession,
) => {
  const userId = validateObjectId(input.userId, "user ID");

  /*
   * Customer must belong to
   * an existing User account.
   */
  const user = await User.findById(userId).session(session ?? null);

  if (!user) {
    throw ApiError.notFound("User not found.", {
      code: "USER_NOT_FOUND",
    });
  }

  /*
   * One User can have only
   * one Customer profile.
   */
  const existingCustomer = await Customer.findOne({
    userId,
  }).session(session ?? null);

  if (existingCustomer) {
    throw ApiError.conflict("Customer profile already exists for this user.", {
      code: "CUSTOMER_ALREADY_EXISTS",
    });
  }

  const customer = new Customer({
    userId,
    status: CUSTOMER_STATUSES.ACTIVE,
    avatar: input.avatar,
    dateOfBirth: input.dateOfBirth,
    gender: input.gender,
    totalOrders: 0,
    totalSpent: 0,
    totalRefunded: 0,
  });

  await customer.save({
    session,
  });

  return customer;
};

/*
|--------------------------------------------------------------------------
| Update Customer
|--------------------------------------------------------------------------
*/

export const updateCustomer = async (
  customerId: string,
  input: UpdateCustomerInput,
) => {
  const _id = validateObjectId(customerId, "customer ID");

  const customer = await Customer.findById(_id);

  if (!customer) {
    throw ApiError.notFound("Customer not found.", {
      code: "CUSTOMER_NOT_FOUND",
    });
  }

  if (input.avatar !== undefined) {
    customer.avatar = input.avatar;
  }

  if (input.dateOfBirth !== undefined) {
    customer.dateOfBirth = input.dateOfBirth;
  }

  if (input.gender !== undefined) {
    customer.gender = input.gender;
  }

  await customer.save();

  return customer;
};

/*
|--------------------------------------------------------------------------
| Update Customer Status
|--------------------------------------------------------------------------
*/

export const updateCustomerStatus = async (
  customerId: string,
  status: CustomerStatus,
) => {
  const _id = validateObjectId(customerId, "customer ID");

  const customer = await Customer.findById(_id);

  if (!customer) {
    throw ApiError.notFound("Customer not found.", {
      code: "CUSTOMER_NOT_FOUND",
    });
  }

  if (await Owner.exists({ userId: customer.userId })) {
    throw ApiError.forbidden("Owner customer status cannot be changed.", {
      code: "OWNER_STATUS_IMMUTABLE",
    });
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

export const activateCustomer = async (customerId: string) => {
  return updateCustomerStatus(customerId, CUSTOMER_STATUSES.ACTIVE);
};

/*
|--------------------------------------------------------------------------
| Deactivate Customer
|--------------------------------------------------------------------------
*/

export const deactivateCustomer = async (customerId: string) => {
  return updateCustomerStatus(customerId, CUSTOMER_STATUSES.INACTIVE);
};

/*
|--------------------------------------------------------------------------
| Suspend Customer
|--------------------------------------------------------------------------
*/

export const suspendCustomer = async (customerId: string) => {
  return updateCustomerStatus(customerId, CUSTOMER_STATUSES.SUSPENDED);
};

/*
|--------------------------------------------------------------------------
| Block Customer
|--------------------------------------------------------------------------
*/

export const blockCustomer = async (customerId: string) => {
  return updateCustomerStatus(customerId, CUSTOMER_STATUSES.BLOCKED);
};

/*
|--------------------------------------------------------------------------
| Delete Customer
|--------------------------------------------------------------------------
*/

export const deleteCustomer = async (customerId: string) => {
  const _id = validateObjectId(customerId, "customer ID");

  const customer = await Customer.findById(_id);

  if (!customer) {
    throw ApiError.notFound("Customer not found.", {
      code: "CUSTOMER_NOT_FOUND",
    });
  }

  await Customer.deleteOne({
    _id,
  });

  return customer;
};
