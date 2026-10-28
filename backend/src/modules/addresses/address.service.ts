import mongoose, { Types } from "mongoose";

import { ApiError } from "../../utils/ApiError";
import { AddressModel } from "./address.model";

import type {
  Address,
  AddressListResult,
  CreateAddressInput,
  UpdateAddressInput,
  AddressListFilters,
} from "./address.types";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function assertObjectId(value: string, field = "ID"): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new ApiError(`Invalid ${field}`, { statusCode: 400 });
  }

  return new Types.ObjectId(value);
}

function normalizeUserId(userId: string | Types.ObjectId): Types.ObjectId {
  const value = String(userId);

  if (!Types.ObjectId.isValid(value)) {
    throw new ApiError("Invalid authenticated user", { statusCode: 401 });
  }

  return new Types.ObjectId(value);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizePagination(filters: AddressListFilters) {
  const page = Math.max(1, Math.floor(filters.page ?? DEFAULT_PAGE));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Math.floor(filters.limit ?? DEFAULT_LIMIT)),
  );

  return { page, limit, skip: (page - 1) * limit };
}

async function findOwnedAddress(
  userId: Types.ObjectId,
  addressId: string,
  session?: mongoose.ClientSession,
) {
  const id = assertObjectId(addressId, "address ID");

  let query = AddressModel.findOne({
    _id: id,
    userId,
    isActive: true,
  });

  if (session) query = query.session(session);

  const address = await query;

  if (!address) {
    throw new ApiError("Address not found", { statusCode: 404 });
  }

  return address;
}

async function makeDefaultAddress(
  userId: Types.ObjectId,
  addressId: Types.ObjectId,
  session: mongoose.ClientSession,
) {
  await AddressModel.updateMany(
    {
      userId,
      isActive: true,
      _id: { $ne: addressId },
    },
    {
      $set: { isDefault: false },
    },
    { session },
  );

  const result = await AddressModel.updateOne(
    {
      _id: addressId,
      userId,
      isActive: true,
    },
    {
      $set: { isDefault: true },
    },
    { session },
  );

  if (result.matchedCount !== 1) {
    throw new ApiError("Address not found", { statusCode: 404 });
  }
}

export async function createAddress(
  authenticatedUserId: string | Types.ObjectId,
  input: CreateAddressInput,
) {
  const userId = normalizeUserId(authenticatedUserId);
  const session = await mongoose.startSession();

  let createdAddressId: Types.ObjectId | undefined;

  try {
    await session.withTransaction(async () => {
      const existingDefault = await AddressModel.exists({
        userId,
        isActive: true,
        isDefault: true,
      }).session(session);

      const shouldBeDefault = input.isDefault === true || !existingDefault;

      if (shouldBeDefault) {
        await AddressModel.updateMany(
          {
            userId,
            isActive: true,
            isDefault: true,
          },
          { $set: { isDefault: false } },
          { session },
        );
      }

      const [created] = await AddressModel.create(
        [
          {
            ...input,
            userId,
            isDefault: shouldBeDefault,
            isActive: true,
          },
        ],
        { session },
      );

      if (!created) {
        throw new ApiError("Failed to create address", { statusCode: 500 });
      }

      createdAddressId = created._id;
    });
  } finally {
    await session.endSession();
  }

  if (!createdAddressId) {
    throw new ApiError("Failed to create address", { statusCode: 500 });
  }

  const address = await AddressModel.findOne({
    _id: createdAddressId,
    userId,
    isActive: true,
  }).lean();

  if (!address) {
    throw new ApiError("Created address could not be retrieved", {
      statusCode: 500,
    });
  }

  return address;
}

export async function listAddresses(
  authenticatedUserId: string | Types.ObjectId,
  filters: AddressListFilters = {},
): Promise<AddressListResult> {
  const userId = normalizeUserId(authenticatedUserId);
  const { page, limit, skip } = normalizePagination(filters);

  const query: Record<string, unknown> = {
    userId,
    isActive: true,
  };

  if (filters.type) query.type = filters.type;
  if (filters.isDefault !== undefined) query.isDefault = filters.isDefault;

  if (filters.search?.trim()) {
    const search = new RegExp(escapeRegex(filters.search.trim()), "i");

    query.$or = [
      { fullName: search },
      { phone: search },
      { city: search },
      { state: search },
      { area: search },
      { addressLine1: search },
      { addressLine2: search },
      { postalCode: search },
    ];
  }

  const sortField = filters.sortBy ?? "createdAt";
  const sortDirection = filters.sortOrder === "asc" ? 1 : -1;

  const [addresses, total] = await Promise.all([
    AddressModel.find(query)
      .sort({
        isDefault: -1,
        [sortField]: sortDirection,
        _id: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    AddressModel.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    addresses: addresses as unknown as Address[],
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 && total > 0,
    },
  };
}

export async function getAddressById(
  authenticatedUserId: string | Types.ObjectId,
  addressId: string,
) {
  const userId = normalizeUserId(authenticatedUserId);
  const id = assertObjectId(addressId, "address ID");

  const address = await AddressModel.findOne({
    _id: id,
    userId,
    isActive: true,
  }).lean();

  if (!address) {
    throw new ApiError("Address not found", { statusCode: 404 });
  }

  return address;
}

export async function getDefaultAddress(
  authenticatedUserId: string | Types.ObjectId,
) {
  const userId = normalizeUserId(authenticatedUserId);

  return AddressModel.findOne({
    userId,
    isActive: true,
    isDefault: true,
  }).lean();
}

export async function updateAddress(
  authenticatedUserId: string | Types.ObjectId,
  addressId: string,
  input: UpdateAddressInput,
) {
  const userId = normalizeUserId(authenticatedUserId);
  const id = assertObjectId(addressId, "address ID");
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const address = await findOwnedAddress(userId, addressId, session);

      if (input.isDefault === true) {
        await makeDefaultAddress(userId, id, session);
      }

      const updates: Record<string, unknown> = { ...input };
      delete updates.isDefault;

      if (Object.keys(updates).length > 0) {
        const result = await AddressModel.updateOne(
          {
            _id: address._id,
            userId,
            isActive: true,
          },
          { $set: updates },
          {
            session,
            runValidators: true,
          },
        );

        if (result.matchedCount !== 1) {
          throw new ApiError("Address not found", { statusCode: 404 });
        }
      }

      if (input.isDefault === false && address.isDefault) {
        const replacement = await AddressModel.findOne({
          userId,
          isActive: true,
          _id: { $ne: address._id },
        })
          .sort({ createdAt: 1, _id: 1 })
          .session(session);

        await AddressModel.updateOne(
          { _id: address._id, userId },
          { $set: { isDefault: false } },
          { session },
        );

        if (replacement) {
          await makeDefaultAddress(userId, replacement._id, session);
        }
      }
    });
  } finally {
    await session.endSession();
  }

  return getAddressById(userId, addressId);
}

export async function setDefaultAddress(
  authenticatedUserId: string | Types.ObjectId,
  addressId: string,
) {
  const userId = normalizeUserId(authenticatedUserId);
  const id = assertObjectId(addressId, "address ID");
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await findOwnedAddress(userId, addressId, session);
      await makeDefaultAddress(userId, id, session);
    });
  } finally {
    await session.endSession();
  }

  return getAddressById(userId, addressId);
}

export async function deleteAddress(
  authenticatedUserId: string | Types.ObjectId,
  addressId: string,
) {
  const userId = normalizeUserId(authenticatedUserId);
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const address = await findOwnedAddress(userId, addressId, session);

      await AddressModel.updateOne(
        {
          _id: address._id,
          userId,
          isActive: true,
        },
        {
          $set: {
            isActive: false,
            isDefault: false,
          },
        },
        { session },
      );

      if (address.isDefault) {
        const replacement = await AddressModel.findOne({
          userId,
          isActive: true,
          _id: { $ne: address._id },
        })
          .sort({ createdAt: 1, _id: 1 })
          .session(session);

        if (replacement) {
          await makeDefaultAddress(userId, replacement._id, session);
        }
      }
    });
  } finally {
    await session.endSession();
  }

  return { message: "Address deleted successfully" };
}
