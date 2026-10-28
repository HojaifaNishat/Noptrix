import { Types, startSession } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { WarehouseModel } from "./warehouse.model";
import type {
  CreateWarehouseInput,
  UpdateWarehouseInput,
  WarehouseListFilters,
} from "./warehouse.types";

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

function assertObjectId(id: string): void {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid warehouse ID.");
  }
}

function throwWarehouseWriteError(error: unknown): never {
  if (isDuplicateKeyError(error)) {
    throw ApiError.conflict("A warehouse with this code already exists.");
  }
  throw error;
}

export async function listWarehouses(filters: WarehouseListFilters) {
  const query: Record<string, unknown> = {};

  if (filters.status) query.status = filters.status;
  if (filters.city) query.city = new RegExp(escapeRegex(filters.city), "i");
  if (filters.country) {
    query.country = new RegExp(escapeRegex(filters.country), "i");
  }

  if (filters.search) {
    const search = new RegExp(escapeRegex(filters.search), "i");
    query.$or = [
      { name: search },
      { code: search },
      { city: search },
      { country: search },
      { contactEmail: search },
    ];
  }

  const skip = (filters.page - 1) * filters.limit;
  const direction = filters.sortOrder === "asc" ? 1 : -1;
  const sort = { [filters.sortBy]: direction, _id: 1 as const };

  const [items, total] = await Promise.all([
    WarehouseModel.find(query)
      .sort(sort as Record<string, import("mongoose").SortOrder>)
      .skip(skip)
      .limit(filters.limit)
      .lean()
      .exec(),
    WarehouseModel.countDocuments(query).exec(),
  ]);

  return {
    items,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
      hasNextPage: skip + items.length < total,
      hasPreviousPage: filters.page > 1,
    },
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getWarehouse(id: string) {
  assertObjectId(id);

  const warehouse = await WarehouseModel.findById(id).exec();

  if (!warehouse) {
    throw ApiError.notFound("Warehouse not found.");
  }

  return warehouse;
}

export async function getDefaultWarehouse() {
  return WarehouseModel.findOne({
    isDefault: true,
    status: "ACTIVE",
  }).exec();
}

export async function createWarehouse(
  input: CreateWarehouseInput,
  adminId: string,
) {
  if (!Types.ObjectId.isValid(adminId)) {
    throw ApiError.unauthorized("Authenticated admin ID is invalid.");
  }

  // An inactive warehouse must never become the default warehouse.
  if (input.isDefault === true && input.status === "INACTIVE") {
    throw ApiError.badRequest(
      "An inactive warehouse cannot be the default warehouse.",
    );
  }

  const session = await startSession();

  try {
    let created: unknown;

    await session.withTransaction(async () => {
      if (input.isDefault) {
        await WarehouseModel.updateMany(
          { isDefault: true },
          { $set: { isDefault: false } },
          { session },
        ).exec();
      }

      const [warehouse] = await WarehouseModel.create(
        [
          {
            ...input,
            code: input.code.trim().toUpperCase(),
            createdBy: new Types.ObjectId(adminId),
            deactivatedAt: input.status === "INACTIVE" ? new Date() : undefined,
          },
        ],
        { session },
      );

      created = warehouse;
    });

    return created;
  } catch (error) {
    throwWarehouseWriteError(error);
  } finally {
    await session.endSession();
  }
}

export async function updateWarehouse(
  id: string,
  input: UpdateWarehouseInput,
  adminId: string,
) {
  assertObjectId(id);

  if (!Types.ObjectId.isValid(adminId)) {
    throw ApiError.unauthorized("Authenticated admin ID is invalid.");
  }

  const session = await startSession();

  try {
    let updated: unknown;

    await session.withTransaction(async () => {
      const existing = await WarehouseModel.findById(id)
        .session(session)
        .exec();

      if (!existing) throw ApiError.notFound("Warehouse not found.");

      if (existing.status === "INACTIVE" && input.status === "ACTIVE") {
        // Reactivation is explicit; it does not change stock or history.
        existing.deactivatedAt = undefined;
      }

      if (input.isDefault === true) {
        // Check the effective status, not only the status in this request.
        const effectiveStatus = input.status ?? existing.status;

        if (effectiveStatus !== "ACTIVE") {
          throw ApiError.badRequest(
            "Only an active warehouse can be the default warehouse.",
          );
        }

        await WarehouseModel.updateMany(
          { _id: { $ne: existing._id }, isDefault: true },
          { $set: { isDefault: false } },
          { session },
        ).exec();
      }

      if (input.status === "INACTIVE") {
        existing.deactivatedAt = new Date();
        existing.isDefault = false;
      } else if (input.status === "ACTIVE") {
        existing.deactivatedAt = undefined;
      }

      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) {
          (existing as unknown as Record<string, unknown>)[key] = value;
        }
      }

      existing.code = existing.code.trim().toUpperCase();
      existing.updatedBy = new Types.ObjectId(adminId);

      await existing.save({ session });
      updated = existing;
    });

    return updated;
  } catch (error) {
    throwWarehouseWriteError(error);
  } finally {
    await session.endSession();
  }
}

/**
 * Deliberately soft-deactivates a warehouse.
 * Hard deletion is not exposed because inventory, purchase and transfer
 * history must remain referentially stable.
 */
export async function deactivateWarehouse(id: string, adminId: string) {
  assertObjectId(id);

  if (!Types.ObjectId.isValid(adminId)) {
    throw ApiError.unauthorized("Authenticated admin ID is invalid.");
  }

  const session = await startSession();

  try {
    let result: Awaited<ReturnType<typeof WarehouseModel.findById>> = null;

    await session.withTransaction(async () => {
      const warehouse = await WarehouseModel.findById(id)
        .session(session)
        .exec();

      if (!warehouse) {
        throw ApiError.notFound("Warehouse not found.");
      }

      if (warehouse.status === "INACTIVE") {
        result = warehouse;
        return;
      }

      warehouse.status = "INACTIVE";
      warehouse.isDefault = false;
      warehouse.deactivatedAt = new Date();
      warehouse.updatedBy = new Types.ObjectId(adminId);

      await warehouse.save({ session });
      result = warehouse;
    });

    return result;
  } catch (error) {
    throwWarehouseWriteError(error);
  } finally {
    await session.endSession();
  }
}

export async function activateWarehouse(id: string, adminId: string) {
  assertObjectId(id);

  if (!Types.ObjectId.isValid(adminId)) {
    throw ApiError.unauthorized("Authenticated admin ID is invalid.");
  }

  const warehouse = await WarehouseModel.findById(id).exec();

  if (!warehouse) throw ApiError.notFound("Warehouse not found.");

  warehouse.status = "ACTIVE";
  warehouse.deactivatedAt = undefined;
  warehouse.updatedBy = new Types.ObjectId(adminId);

  await warehouse.save();
  return warehouse;
}
