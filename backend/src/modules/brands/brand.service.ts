import { Types } from "mongoose";
import slugify from "slugify";

import { ApiError } from "../../utils/ApiError";
import {
  deleteFromCloudinary,
  uploadBufferToCloudinary,
  type CloudinaryUploadResult,
} from "../../services/cloudinary.service";

import { Product } from "../products/product.model";
import { Brand } from "./brand.model";
import type {
  BrandDocument,
  BrandLogoAsset,
  BrandListQuery,
  BrandListResult,
  CreateBrandInput,
  UpdateBrandInput,
} from "./brand.types";

const BRAND_LOGO_FOLDER = "noptrix/brands";

export interface BrandUploadInput {
  readonly buffer: Buffer;
  readonly filename?: string;
  readonly mimeType?: string;
}

export interface CreateBrandServiceInput extends CreateBrandInput {
  readonly image?: BrandUploadInput;
  readonly createdBy?: string;
}

export interface UpdateBrandServiceInput extends UpdateBrandInput {
  readonly image?: BrandUploadInput;
  readonly updatedBy?: string;
}

const normalizeText = (value: string): string => value.trim();

const normalizeSlug = (value: string): string => {
  const result = slugify(value, {
    lower: true,
    strict: true,
    trim: true,
  });

  if (!result) {
    throw ApiError.badRequest("A valid brand slug is required.", {
      code: "INVALID_BRAND_SLUG",
    });
  }

  return result;
};

const generateSlug = (name: string): string => normalizeSlug(name);

const ensureObjectId = (value: string, field: string): Types.ObjectId => {
  if (!/^[0-9a-fA-F]{24}$/.test(value)) {
    throw ApiError.badRequest(`Invalid ${field}.`, {
      code: "INVALID_OBJECT_ID",
    });
  }

  return new Types.ObjectId(value);
};

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: unknown }).code === 11000;

const duplicateBrandError = (): ApiError =>
  ApiError.conflict("A brand with the same name or slug already exists.", {
    code: "BRAND_ALREADY_EXISTS",
  });

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const mapLogoAsset = (result: CloudinaryUploadResult): BrandLogoAsset => {
  if (result.resourceType !== "image") {
    throw ApiError.internal("Cloudinary returned an invalid brand logo resource type.", {
      code: "INVALID_BRAND_LOGO_RESOURCE_TYPE",
    });
  }

  return {
    publicId: result.publicId,
    secureUrl: result.secureUrl,
    url: result.url,
    assetId: result.assetId,
    version: result.version,
    resourceType: "image",
    format: result.format,
    bytes: result.bytes,
    width: result.width,
    height: result.height,
    originalFilename: result.originalFilename,
  };
};

const uploadBrandLogo = async (
  image: BrandUploadInput,
): Promise<BrandLogoAsset> => {
  const result = await uploadBufferToCloudinary(
    {
      buffer: image.buffer,
      filename: image.filename,
      mimeType: image.mimeType,
    },
    {
      folder: BRAND_LOGO_FOLDER,
      resourceType: "image",
      overwrite: false,
      useUniqueFilename: true,
      invalidate: true,
    },
  );

  return mapLogoAsset(result);
};

const cleanupLogo = async (asset?: BrandLogoAsset): Promise<void> => {
  if (!asset?.publicId) return;

  try {
    await deleteFromCloudinary(asset.publicId, "image");
  } catch {
    // Database state is canonical; failed cleanup must not undo it.
    // Cloudinary cleanup can be retried operationally.
  }
};

const findDuplicate = async (
  name: string,
  slug: string,
  excludeId?: Types.ObjectId,
): Promise<boolean> => {
  const escapedName = escapeRegex(name);

  const duplicate = await Brand.findOne({
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    $or: [
      { name: { $regex: `^${escapedName}$`, $options: "i" } },
      { slug },
    ],
  }).lean().exec();

  return Boolean(duplicate);
};

export const createBrand = async (
  input: CreateBrandServiceInput,
): Promise<BrandDocument> => {
  const name = normalizeText(input.name);
  if (name.length < 2) {
    throw ApiError.badRequest("Brand name is required.", {
      code: "BRAND_NAME_REQUIRED",
    });
  }

  const slug = input.slug ? normalizeSlug(input.slug) : generateSlug(name);

  if (await findDuplicate(name, slug)) {
    throw duplicateBrandError();
  }

  let uploadedLogo: BrandLogoAsset | undefined;

  try {
    if (input.image) {
      uploadedLogo = await uploadBrandLogo(input.image);
    }

    const brand = await Brand.create({
      name,
      slug,
      description: input.description?.trim() ?? "",
      logo: uploadedLogo?.secureUrl ?? input.logo?.trim() ?? "",
      logoAsset: uploadedLogo,
      website: input.website?.trim() ?? "",
      status: input.status ?? "ACTIVE",
      sortOrder: input.sortOrder ?? 0,
      seo: input.seo,
      createdBy: input.createdBy
        ? ensureObjectId(input.createdBy, "creator ID")
        : null,
    });

    return brand as unknown as BrandDocument;
  } catch (error) {
    await cleanupLogo(uploadedLogo);

    if (isDuplicateKeyError(error)) {
      throw duplicateBrandError();
    }

    throw error;
  }
};

export const getBrandById = async (
  brandId: string,
): Promise<BrandDocument> => {
  const id = ensureObjectId(brandId, "brand ID");
  const brand = await Brand.findById(id).exec();

  if (!brand) {
    throw ApiError.notFound("Brand not found.", {
      code: "BRAND_NOT_FOUND",
    });
  }

  return brand as unknown as BrandDocument;
};

export const getBrandBySlug = async (
  slug: string,
  activeOnly = false,
): Promise<BrandDocument> => {
  const normalized = normalizeSlug(slug);
  const brand = await Brand.findOne({
    slug: normalized,
    ...(activeOnly ? { status: "ACTIVE" } : {}),
  }).exec();

  if (!brand) {
    throw ApiError.notFound("Brand not found.", {
      code: "BRAND_NOT_FOUND",
    });
  }

  return brand as unknown as BrandDocument;
};

export const listBrands = async (
  query: BrandListQuery,
  activeOnly = false,
): Promise<BrandListResult> => {
  const page = Math.min(Math.max(query.page || 1, 1), 1_000_000);
  const limit = Math.min(Math.max(query.limit || 20, 1), 100);
  const filter: Record<string, unknown> = {};

  if (activeOnly) {
    filter.status = "ACTIVE";
  } else if (query.status) {
    filter.status = query.status;
  }

  const search = query.search?.trim().slice(0, 120);
  if (search) {
    const escaped = escapeRegex(search);
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { slug: { $regex: escaped, $options: "i" } },
      { description: { $regex: escaped, $options: "i" } },
    ];
  }

  const sortBy = query.sortBy ?? "sortOrder";
  const direction = query.sortOrder === "desc" ? -1 : 1;
  const sort: Record<string, 1 | -1> = { [sortBy]: direction };

  if (sortBy !== "sortOrder") sort.sortOrder = 1;
  if (sortBy !== "name") sort.name = 1;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Brand.find(filter).sort(sort).skip(skip).limit(limit).exec(),
    Brand.countDocuments(filter).exec(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    items: items as unknown as readonly BrandDocument[],
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 && total > 0,
    },
  };
};

export const updateBrand = async (
  brandId: string,
  input: UpdateBrandServiceInput,
): Promise<BrandDocument> => {
  const id = ensureObjectId(brandId, "brand ID");
  const brand = await Brand.findById(id).exec();

  if (!brand) {
    throw ApiError.notFound("Brand not found.", {
      code: "BRAND_NOT_FOUND",
    });
  }

  if (input.name !== undefined) {
    const name = normalizeText(input.name);
    const nextSlug = input.slug !== undefined
      ? normalizeSlug(input.slug)
      : normalizeSlug(name);

    if (await findDuplicate(name, nextSlug, id)) {
      throw duplicateBrandError();
    }

    brand.name = name;
    brand.slug = nextSlug;
  } else if (input.slug !== undefined) {
    const slug = normalizeSlug(input.slug);

    if (await findDuplicate(brand.name, slug, id)) {
      throw duplicateBrandError();
    }

    brand.slug = slug;
  }

  if (input.description !== undefined) brand.description = input.description.trim();
  if (input.website !== undefined) brand.website = input.website.trim();
  if (input.status !== undefined) brand.status = input.status;
  if (input.sortOrder !== undefined) brand.sortOrder = input.sortOrder;

  if (input.seo !== undefined) {
    brand.seo = {
      title: input.seo.title ?? "",
      description: input.seo.description ?? "",
    };
  }

  if (input.updatedBy) {
    brand.updatedBy = ensureObjectId(input.updatedBy, "updater ID");
  }

  const oldAsset = brand.logoAsset
    ? brand.logoAsset as unknown as BrandLogoAsset
    : undefined;

  // An explicitly supplied logo URL replaces the current URL and clears
  // managed Cloudinary metadata, but does not delete an unknown old asset.
  if (input.logo !== undefined && !input.image) {
    brand.logo = input.logo.trim();
    brand.logoAsset = undefined;
  }

  if (input.removeLogo && !input.image) {
    brand.logo = "";
    brand.logoAsset = undefined;

    try {
      await brand.save();
    } catch (error) {
      if (isDuplicateKeyError(error)) throw duplicateBrandError();
      throw error;
    }

    await cleanupLogo(oldAsset);
    return brand as unknown as BrandDocument;
  }

  if (input.image) {
    const newAsset = await uploadBrandLogo(input.image);

    brand.logo = newAsset.secureUrl;
    brand.logoAsset = newAsset as never;

    try {
      await brand.save();
    } catch (error) {
      await cleanupLogo(newAsset);

      if (isDuplicateKeyError(error)) throw duplicateBrandError();
      throw error;
    }

    if (oldAsset?.publicId && oldAsset.publicId !== newAsset.publicId) {
      await cleanupLogo(oldAsset);
    }

    return brand as unknown as BrandDocument;
  }

  try {
    await brand.save();
  } catch (error) {
    if (isDuplicateKeyError(error)) throw duplicateBrandError();
    throw error;
  }

  return brand as unknown as BrandDocument;
};

export const updateBrandStatus = async (
  brandId: string,
  status: "ACTIVE" | "INACTIVE",
  updatedBy?: string,
): Promise<BrandDocument> => updateBrand(brandId, { status, updatedBy });

export const updateBrandSortOrder = async (
  brandId: string,
  sortOrder: number,
  updatedBy?: string,
): Promise<BrandDocument> => updateBrand(brandId, { sortOrder, updatedBy });

export const deleteBrand = async (brandId: string): Promise<void> => {
  const id = ensureObjectId(brandId, "brand ID");
  const brand = await Brand.findById(id).exec();

  if (!brand) {
    throw ApiError.notFound("Brand not found.", {
      code: "BRAND_NOT_FOUND",
    });
  }

  const usedByProduct = await Product.exists({ brandId: id }).exec();
  if (usedByProduct) {
    throw ApiError.conflict(
      "This brand is assigned to one or more products. Reassign those products before deleting it.",
      { code: "BRAND_IN_USE" },
    );
  }

  const asset = brand.logoAsset
    ? brand.logoAsset as unknown as BrandLogoAsset
    : undefined;

  await Brand.deleteOne({ _id: id }).exec();
  await cleanupLogo(asset);
};

export const listActiveBrands = async (): Promise<readonly BrandDocument[]> => {
  const brands = await Brand.find({ status: "ACTIVE" })
    .sort({ sortOrder: 1, name: 1 })
    .exec();

  return brands as unknown as readonly BrandDocument[];
};