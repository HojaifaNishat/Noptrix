import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { Attribute } from "./attribute.model";
import type {
  AttributeDocument,
  AttributeListQuery,
  AttributeListResult,
  CreateAttributeInput,
  UpdateAttributeInput,
} from "./attribute.types";

const normalizeSlug = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: number }).code === 11000;

const duplicateAttributeError = () =>
  ApiError.conflict("An attribute with this name or slug already exists.", {
    code: "ATTRIBUTE_DUPLICATE",
  });

const ensureObjectId = (value: string, label = "attribute ID"): Types.ObjectId => {
  if (!Types.ObjectId.isValid(value)) {
    throw ApiError.badRequest(`Invalid ${label}.`, {
      code: "INVALID_OBJECT_ID",
    });
  }

  return new Types.ObjectId(value);
};

const validateOptions = (
  type: CreateAttributeInput["type"] | UpdateAttributeInput["type"],
  options: string[] | undefined,
): string[] => {
  const normalized = (options ?? []).map((option) => option.trim()).filter(Boolean);

  if (
    (type === "SELECT" || type === "MULTI_SELECT") &&
    normalized.length === 0
  ) {
    throw ApiError.badRequest(
      "SELECT and MULTI_SELECT attributes require at least one option.",
      { code: "ATTRIBUTE_OPTIONS_REQUIRED" },
    );
  }

  if (type && !["SELECT", "MULTI_SELECT"].includes(type) && normalized.length > 0) {
    throw ApiError.badRequest(
      "Only SELECT and MULTI_SELECT attributes can define options.",
      { code: "ATTRIBUTE_OPTIONS_NOT_ALLOWED" },
    );
  }

  if (
    new Set(normalized.map((option) => option.toLowerCase())).size !==
    normalized.length
  ) {
    throw ApiError.badRequest("Attribute options must be unique.", {
      code: "ATTRIBUTE_OPTIONS_DUPLICATE",
    });
  }

  return normalized;
};

const findDuplicate = async (
  name: string,
  slug: string,
  excludeId?: Types.ObjectId,
): Promise<boolean> => {
  const filter: Record<string, unknown> = {
    $or: [{ name }, { slug }],
  };

  if (excludeId) filter._id = { $ne: excludeId };

  return Boolean(await Attribute.exists(filter).exec());
};

export const createAttribute = async (
  input: CreateAttributeInput,
): Promise<AttributeDocument> => {
  const name = input.name.trim();
  const slug = normalizeSlug(input.slug || name);
  const options = validateOptions(input.type, input.options);

  if (!slug) {
    throw ApiError.badRequest("A valid attribute slug is required.", {
      code: "ATTRIBUTE_INVALID_SLUG",
    });
  }

  if (await findDuplicate(name, slug)) throw duplicateAttributeError();

  const createdBy = input.createdBy
    ? ensureObjectId(input.createdBy, "creator ID")
    : null;

  try {
    const attribute = await Attribute.create({
      name,
      slug,
      description: input.description?.trim() ?? "",
      type: input.type,
      options,
      isRequired: input.isRequired ?? false,
      isVariant: input.isVariant ?? false,
      isFilterable: input.isFilterable ?? false,
      isSearchable: input.isSearchable ?? false,
      status: input.status ?? "ACTIVE",
      sortOrder: input.sortOrder ?? 0,
      createdBy,
    });

    return attribute as unknown as AttributeDocument;
  } catch (error) {
    if (isDuplicateKeyError(error)) throw duplicateAttributeError();
    throw error;
  }
};

export const getAttributeById = async (
  attributeId: string,
): Promise<AttributeDocument> => {
  const id = ensureObjectId(attributeId);
  const attribute = await Attribute.findById(id).exec();

  if (!attribute) {
    throw ApiError.notFound("Attribute not found.", {
      code: "ATTRIBUTE_NOT_FOUND",
    });
  }

  return attribute as unknown as AttributeDocument;
};

export const getAttributeBySlug = async (
  slug: string,
  publicOnly = false,
): Promise<AttributeDocument> => {
  const filter: Record<string, unknown> = {
    slug: normalizeSlug(slug),
  };

  if (publicOnly) filter.status = "ACTIVE";

  const attribute = await Attribute.findOne(filter).exec();

  if (!attribute) {
    throw ApiError.notFound("Attribute not found.", {
      code: "ATTRIBUTE_NOT_FOUND",
    });
  }

  return attribute as unknown as AttributeDocument;
};

export const listAttributes = async (
  query: AttributeListQuery = {},
  publicOnly = false,
): Promise<AttributeListResult> => {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const filter: Record<string, unknown> = {};

  if (publicOnly) {
    filter.status = "ACTIVE";
  } else if (query.status) {
    filter.status = query.status;
  }

  if (query.type) filter.type = query.type;
  if (query.isVariant !== undefined) filter.isVariant = query.isVariant;
  if (query.isFilterable !== undefined) filter.isFilterable = query.isFilterable;

  if (query.search) {
    const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { slug: { $regex: escaped, $options: "i" } },
      { description: { $regex: escaped, $options: "i" } },
    ];
  }

  const sortBy = query.sortBy ?? "sortOrder";
  const sortDirection = query.sortOrder === "desc" ? -1 : 1;
  const sort: Record<string, 1 | -1> = {
    [sortBy]: sortDirection,
    _id: 1,
  };

  const [data, total] = await Promise.all([
    Attribute.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec(),
    Attribute.countDocuments(filter).exec(),
  ]);

  return {
    data: data as unknown as readonly AttributeDocument[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const updateAttribute = async (
  attributeId: string,
  input: UpdateAttributeInput,
): Promise<AttributeDocument> => {
  const id = ensureObjectId(attributeId);
  const attribute = await Attribute.findById(id).exec();

  if (!attribute) {
    throw ApiError.notFound("Attribute not found.", {
      code: "ATTRIBUTE_NOT_FOUND",
    });
  }

  const nextName = input.name?.trim() ?? attribute.name;
  const nextSlug = normalizeSlug(input.slug ?? (input.name ? nextName : attribute.slug));
  const nextType = input.type ?? attribute.type;
  const nextOptions =
    input.options !== undefined
      ? input.options
      : (attribute.options as string[] | undefined) ?? [];

  const normalizedOptions = validateOptions(
    nextType as CreateAttributeInput["type"],
    nextOptions,
  );

  if (await findDuplicate(nextName, nextSlug, id)) {
    throw duplicateAttributeError();
  }

  attribute.name = nextName;
  attribute.slug = nextSlug;
  if (input.description !== undefined) attribute.description = input.description.trim();
  if (input.type !== undefined) attribute.type = input.type;
  if (input.options !== undefined || input.type !== undefined) {
    attribute.options = normalizedOptions;
  }
  if (input.isRequired !== undefined) attribute.isRequired = input.isRequired;
  if (input.isVariant !== undefined) attribute.isVariant = input.isVariant;
  if (input.isFilterable !== undefined) attribute.isFilterable = input.isFilterable;
  if (input.isSearchable !== undefined) attribute.isSearchable = input.isSearchable;
  if (input.status !== undefined) attribute.status = input.status;
  if (input.sortOrder !== undefined) attribute.sortOrder = input.sortOrder;
  if (input.updatedBy) {
    attribute.updatedBy = ensureObjectId(input.updatedBy, "updater ID");
  }

  try {
    await attribute.save();
  } catch (error) {
    if (isDuplicateKeyError(error)) throw duplicateAttributeError();
    throw error;
  }

  return attribute as unknown as AttributeDocument;
};

export const updateAttributeStatus = async (
  attributeId: string,
  status: "ACTIVE" | "INACTIVE",
  updatedBy?: string,
): Promise<AttributeDocument> =>
  updateAttribute(attributeId, { status, updatedBy });

export const updateAttributeSortOrder = async (
  attributeId: string,
  sortOrder: number,
  updatedBy?: string,
): Promise<AttributeDocument> =>
  updateAttribute(attributeId, { sortOrder, updatedBy });

export const deleteAttribute = async (attributeId: string): Promise<void> => {
  const id = ensureObjectId(attributeId);
  const attribute = await Attribute.findById(id).exec();

  if (!attribute) {
    throw ApiError.notFound("Attribute not found.", {
      code: "ATTRIBUTE_NOT_FOUND",
    });
  }

  // Product/variant usage must be checked against the real schema before
  // enabling destructive deletion. Do not guess a reference field here.
  await Attribute.deleteOne({ _id: id }).exec();
};

export const listActiveAttributes = async (): Promise<readonly AttributeDocument[]> => {
  const attributes = await Attribute.find({ status: "ACTIVE" })
    .sort({ sortOrder: 1, name: 1 })
    .exec();

  return attributes as unknown as readonly AttributeDocument[];
};
