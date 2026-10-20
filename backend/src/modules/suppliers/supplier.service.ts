import mongoose, { Types } from "mongoose";

import { ApiError } from "../../utils/ApiError";
import { SupplierModel } from "./supplier.model";
import type {
  Supplier,
  SupplierFilters,
  SupplierStatus,
} from "./supplier.types";
import type {
  CreateSupplierBody,
  UpdateSupplierBody,
  UpdateSupplierStatusBody,
} from "./supplier.validator";

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function makeSlug(value: string): string {
  const slug = normalizeText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150)
    .replace(/-+$/g, "");

  return slug || "supplier";
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeTags(tags?: string[]): string[] {
  if (!tags) return [];

  return [
    ...new Set(
      tags
        .map((tag) => normalizeText(tag).toLowerCase())
        .filter(Boolean),
    ),
  ];
}

function assertObjectId(id: string): void {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid supplier ID.");
  }
}

function assertAdminId(adminId: string | Types.ObjectId): Types.ObjectId {
  const value = String(adminId);

  if (!Types.ObjectId.isValid(value)) {
    throw ApiError.unauthorized("A valid authenticated admin is required.");
  }

  return new Types.ObjectId(value);
}

function isDuplicateKeyError(
  error: unknown,
): error is { code: number; keyPattern?: Record<string, number> } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

function handleDuplicateKey(error: unknown): never {
  if (isDuplicateKeyError(error)) {
    const key = Object.keys(error.keyPattern ?? {})[0];

    if (key === "code") {
      throw ApiError.conflict("A supplier with this code already exists.");
    }

    if (key === "slug") {
      throw ApiError.conflict("A supplier with this name already exists.");
    }

    if (key === "email") {
      throw ApiError.conflict("A supplier with this email already exists.");
    }

    throw ApiError.conflict("A supplier with these details already exists.");
  }

  throw error;
}

function buildSupplierSlug(name: string, code?: string): string {
  const base = makeSlug(name);
  const suffix = code ? `-${makeSlug(code)}` : "";

  return `${base}${suffix}`.slice(0, 180).replace(/-+$/g, "");
}

function buildFilters(filters: SupplierFilters) {
  const query: Record<string, unknown> = {};

  if (filters.status) query.status = filters.status;

  if (filters.city) {
    query["address.city"] = {
      $regex: `^${escapeRegex(filters.city.trim())}$`,
      $options: "i",
    };
  }

  if (filters.country) {
    query["address.country"] = {
      $regex: `^${escapeRegex(filters.country.trim())}$`,
      $options: "i",
    };
  }

  if (filters.tags?.length) {
    query.tags = { $in: normalizeTags(filters.tags) };
  }

  if (filters.search?.trim()) {
    const search = escapeRegex(filters.search.trim());

    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { taxId: { $regex: search, $options: "i" } },
      { registrationNumber: { $regex: search, $options: "i" } },
    ];
  }

  return query;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function createSupplier(
  input: CreateSupplierBody,
  adminId: string | Types.ObjectId,
) {
  const createdBy = assertAdminId(adminId);
  const name = normalizeText(input.name);
  const code = normalizeCode(
    input.code ?? `SUP-${new Types.ObjectId().toHexString().slice(-10)}`,
  );

  const email = input.email?.trim().toLowerCase() || undefined;

  const supplier = new SupplierModel({
    ...input,
    name,
    code,
    slug: buildSupplierSlug(name, code),
    email,
    phone: normalizeText(input.phone),
    alternatePhone: input.alternatePhone?.trim() || undefined,
    website: input.website?.trim() || undefined,
    taxId: input.taxId?.trim() || undefined,
    registrationNumber: input.registrationNumber?.trim() || undefined,
    address: {
      ...input.address,
      city: normalizeText(input.address.city),
      country: normalizeText(input.address.country),
    },
    contactPerson: input.contactPerson
      ? {
          ...input.contactPerson,
          email: input.contactPerson.email?.trim().toLowerCase() || undefined,
        }
      : undefined,
    currency: input.currency ?? "SAR",
    paymentTermsDays: input.paymentTermsDays ?? 0,
    creditLimit: input.creditLimit ?? 0,
    tags: normalizeTags(input.tags),
    createdBy,
    auditTrail: [
      {
        action: "CREATED",
        performedBy: createdBy,
        performedAt: new Date(),
      },
    ],
  });

  try {
    await supplier.save();
    return supplier;
  } catch (error) {
    handleDuplicateKey(error);
  }
}

export async function listSuppliers(filters: SupplierFilters = {}) {
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.floor(filters.limit ?? 20)));
  const skip = (page - 1) * limit;

  const sortField = filters.sortBy ?? "createdAt";
  const sortDirection = filters.sortOrder === "asc" ? 1 : -1;

  const query = buildFilters(filters);

  const [items, total] = await Promise.all([
    SupplierModel.find(query)
      .select("-auditTrail")
      .sort({ [sortField]: sortDirection, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    SupplierModel.countDocuments(query).exec(),
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
}

export async function getSupplierById(id: string) {
  assertObjectId(id);

  const supplier = await SupplierModel.findById(id)
    .select("-auditTrail")
    .lean()
    .exec();

  if (!supplier) {
    throw ApiError.notFound("Supplier not found.");
  }

  return supplier;
}

export async function updateSupplier(
  id: string,
  input: UpdateSupplierBody,
  adminId: string | Types.ObjectId,
) {
  assertObjectId(id);

  const updatedBy = assertAdminId(adminId);
  const existing = await SupplierModel.findById(id).exec();

  if (!existing) {
    throw ApiError.notFound("Supplier not found.");
  }

  if (existing.status === "SUSPENDED") {
    throw ApiError.conflict("A suspended supplier cannot be updated.");
  }

  const changes: Record<string, unknown> = {};

  if (input.name !== undefined) {
    const name = normalizeText(input.name);
    existing.name = name;
    existing.slug = buildSupplierSlug(name, existing.code);
    changes.name = name;
  }

  if (input.email !== undefined) {
    existing.email = input.email.trim().toLowerCase() || undefined;
    changes.email = existing.email;
  }

  if (input.phone !== undefined) {
    existing.phone = normalizeText(input.phone);
    changes.phone = existing.phone;
  }

  if (input.alternatePhone !== undefined) {
    existing.alternatePhone = input.alternatePhone.trim() || undefined;
    changes.alternatePhone = existing.alternatePhone;
  }

  if (input.website !== undefined) {
    existing.website = input.website.trim() || undefined;
    changes.website = existing.website;
  }

  if (input.taxId !== undefined) {
    existing.taxId = input.taxId.trim() || undefined;
    changes.taxId = existing.taxId;
  }

  if (input.registrationNumber !== undefined) {
    existing.registrationNumber = input.registrationNumber.trim() || undefined;
    changes.registrationNumber = existing.registrationNumber;
  }

  if (input.address !== undefined) {
    existing.address = {
      ...existing.address,
      ...input.address,
    };
    changes.address = input.address;
  }

  if (input.contactPerson !== undefined) {
    existing.contactPerson = input.contactPerson
      ? {
          ...input.contactPerson,
          email: input.contactPerson.email?.trim().toLowerCase() || undefined,
        }
      : undefined;
    changes.contactPerson = input.contactPerson;
  }

  if (input.paymentTermsDays !== undefined) {
    existing.paymentTermsDays = input.paymentTermsDays;
    changes.paymentTermsDays = input.paymentTermsDays;
  }

  if (input.creditLimit !== undefined) {
    existing.creditLimit = input.creditLimit;
    changes.creditLimit = input.creditLimit;
  }

  if (input.currency !== undefined) {
    existing.currency = input.currency.toUpperCase();
    changes.currency = existing.currency;
  }

  if (input.notes !== undefined) {
    existing.notes = input.notes;
    changes.notes = input.notes;
  }

  if (input.tags !== undefined) {
    existing.tags = normalizeTags(input.tags);
    changes.tags = existing.tags;
  }

  existing.updatedBy = updatedBy;

  const auditTrail = existing.auditTrail;

  if (auditTrail) {
    auditTrail.push({
      action: "UPDATED",
      performedBy: updatedBy,
      performedAt: new Date(),
      changes,
    });
  }

  try {
    await existing.save();
    return existing;
  } catch (error) {
    handleDuplicateKey(error);
  }
}

export async function updateSupplierStatus(
  id: string,
  input: UpdateSupplierStatusBody,
  adminId: string | Types.ObjectId,
) {
  assertObjectId(id);

  const updatedBy = assertAdminId(adminId);
  const supplier = await SupplierModel.findById(id).exec();

  if (!supplier) {
    throw ApiError.notFound("Supplier not found.");
  }

  const previousStatus = supplier.status;
  const nextStatus: SupplierStatus = input.status;

  if (previousStatus === nextStatus) {
    return supplier;
  }

  supplier.status = nextStatus;
  supplier.updatedBy = updatedBy;

  const auditTrail = supplier.auditTrail;

  if (auditTrail) {
    auditTrail.push({
      action: "STATUS_CHANGED",
      performedBy: updatedBy,
      performedAt: new Date(),
      changes: {
        from: previousStatus,
        to: nextStatus,
        reason: input.reason,
      },
    });
  }

  await supplier.save();

  return supplier;
}

export async function deactivateSupplier(
  id: string,
  adminId: string | Types.ObjectId,
) {
  return updateSupplierStatus(
    id,
    {
      status: "INACTIVE",
      reason: "Supplier deactivated by administrator.",
    },
    adminId,
  );
}

export async function getSupplierByCode(code: string) {
  const normalizedCode = normalizeCode(code);

  if (!normalizedCode) {
    throw ApiError.badRequest("Supplier code is required.");
  }

  const supplier = await SupplierModel.findOne({ code: normalizedCode })
    .select("-auditTrail")
    .lean()
    .exec();

  if (!supplier) {
    throw ApiError.notFound("Supplier not found.");
  }

  return supplier;
}

export async function ensureSupplierCanReceivePurchase(
  supplierId: string | Types.ObjectId,
) {
  const id = String(supplierId);
  assertObjectId(id);

  const supplier = await SupplierModel.findById(id)
    .select("_id status name code")
    .lean()
    .exec();

  if (!supplier) {
    throw ApiError.notFound("Supplier not found.");
  }

  if (supplier.status !== "ACTIVE") {
    throw ApiError.conflict(
      "Purchases can only be created for active suppliers.",
    );
  }

  return supplier;
}

export async function getSupplierSummary() {
  const [total, active, inactive, suspended] = await Promise.all([
    SupplierModel.countDocuments({}).exec(),
    SupplierModel.countDocuments({ status: "ACTIVE" }).exec(),
    SupplierModel.countDocuments({ status: "INACTIVE" }).exec(),
    SupplierModel.countDocuments({ status: "SUSPENDED" }).exec(),
  ]);

  return { total, active, inactive, suspended };
}
