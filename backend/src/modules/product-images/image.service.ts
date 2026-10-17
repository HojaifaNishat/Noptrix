import { Types } from "mongoose";

import { ApiError } from "../../utils/ApiError";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../../services/cloudinary.service";
import ProductModel from "../products/product.model";
import ProductImageModel from "./image.model";

import type {
  ImageListQuery,
  ImageUpdateBody,
  ImageUploadBody,
} from "./image.validator";

const MAX_UPLOADS = 20;

type UploadedAsset = Awaited<
  ReturnType<typeof uploadBufferToCloudinary>
>;

function toObjectId(value: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw ApiError.badRequest(`Invalid ${label}.`);
  }

  return new Types.ObjectId(value);
}

async function ensureProductExists(productId: string): Promise<void> {
  const id = toObjectId(productId, "product ID");

  const exists = await ProductModel.exists({ _id: id });

  if (!exists) {
    throw ApiError.notFound("Product not found.");
  }
}

async function getImageOrFail(productId: string, imageId: string) {
  const productObjectId = toObjectId(productId, "product ID");
  const imageObjectId = toObjectId(imageId, "image ID");

  const image = await ProductImageModel.findOne({
    _id: imageObjectId,
    productId: productObjectId,
  }).exec();

  if (!image) {
    throw ApiError.notFound("Product image not found.");
  }

  return image;
}

/**
 * A single product should have at most one primary image.
 * This service-level operation is not a substitute for a transaction;
 * the production database should also be tested for concurrent updates.
 */
async function makePrimary(
  productId: Types.ObjectId,
  imageId: Types.ObjectId,
): Promise<void> {
  await ProductImageModel.updateMany(
    { productId, isPrimary: true, _id: { $ne: imageId } },
    { $set: { isPrimary: false } },
  ).exec();

  const result = await ProductImageModel.updateOne(
    { productId, _id: imageId },
    { $set: { isPrimary: true } },
  ).exec();

  if (result.matchedCount !== 1) {
    throw ApiError.notFound("Product image not found.");
  }
}

/**
 * If Cloudinary upload fails midway, remove assets already uploaded.
 * If cleanup itself fails, the remaining asset needs reconciliation.
 */
async function cleanupUploadedAssets(
  assets: UploadedAsset[],
): Promise<void> {
  await Promise.allSettled(
    assets.map((asset) => deleteFromCloudinary(asset.publicId, "image")),
  );
}

export async function uploadProductImages(
  productId: string,
  files: Express.Multer.File[],
  input: ImageUploadBody,
) {
  await ensureProductExists(productId);

  if (!Array.isArray(files) || files.length === 0) {
    throw ApiError.badRequest("At least one image file is required.");
  }

  if (files.length > MAX_UPLOADS) {
    throw ApiError.badRequest(
      `You can upload at most ${MAX_UPLOADS} images per request.`,
    );
  }

  if (
    input.primaryIndex !== undefined &&
    input.primaryIndex >= files.length
  ) {
    throw ApiError.badRequest(
      "primaryIndex must refer to an uploaded image.",
    );
  }

  const productObjectId = toObjectId(productId, "product ID");

  const existingCount = await ProductImageModel.countDocuments({
    productId: productObjectId,
  }).exec();

  const existingPrimary = await ProductImageModel.findOne({
    productId: productObjectId,
    isPrimary: true,
  })
    .select("_id")
    .lean()
    .exec();

  const assets: UploadedAsset[] = [];

  try {
    for (const file of files) {
      if (!file.buffer?.length) {
        throw ApiError.badRequest(
          `Image "${file.originalname}" has no file content.`,
        );
      }

      const asset = await uploadBufferToCloudinary(
        {
          buffer: file.buffer,
          filename: file.originalname,
          mimeType: file.mimetype,
        },
        {
          folder: `noptrix/products/${productId}`,
          resourceType: "image",
          useUniqueFilename: true,
        },
      );

      assets.push(asset);
    }
  } catch (error) {
    await cleanupUploadedAssets(assets);
    throw error;
  }

  const shouldSetPrimary =
    input.primaryIndex !== undefined ||
    (!existingPrimary && existingCount === 0);

  const documents = assets.map((asset, index) => ({
    productId: productObjectId,
    url: asset.secureUrl,
    publicId: asset.publicId,
    alt: input.alt?.trim() ?? "",
    isPrimary: shouldSetPrimary
      ? input.primaryIndex !== undefined
        ? index === input.primaryIndex
        : index === 0
      : false,
    sortOrder: existingCount + index,
    width: asset.width,
    height: asset.height,
    format: asset.format,
    bytes: asset.bytes,
  }));

  let created: Awaited<
    ReturnType<typeof ProductImageModel.insertMany>
  > = [];

  try {
    created = await ProductImageModel.insertMany(documents);

    if (shouldSetPrimary) {
      const primaryIndex = input.primaryIndex ?? 0;
      const primaryImage = created[primaryIndex];

      if (!primaryImage) {
        throw ApiError.internal("Unable to select the primary image.");
      }

      await makePrimary(
        productObjectId,
        primaryImage._id as Types.ObjectId,
      );
    }

    return created;
  } catch (error) {
    // Compensate for failed persistence or primary-image update.
    if (created.length > 0) {
      await ProductImageModel.deleteMany({
        _id: { $in: created.map((image) => image._id) },
        productId: productObjectId,
      }).exec().catch(() => undefined);
    }

    await cleanupUploadedAssets(assets);

    // Restore the previous primary image if it still exists.
    if (existingPrimary?._id) {
      await ProductImageModel.updateOne(
        {
          _id: existingPrimary._id,
          productId: productObjectId,
        },
        { $set: { isPrimary: true } },
      ).exec().catch(() => undefined);
    }

    throw error;
  }
}

export async function listProductImages(
  productId: string,
  query: ImageListQuery,
) {
  await ensureProductExists(productId);

  const filter = {
    productId: toObjectId(productId, "product ID"),
  };

  const skip = (query.page - 1) * query.limit;

  const [items, total] = await Promise.all([
    ProductImageModel.find(filter)
      .sort({ isPrimary: -1, sortOrder: 1, createdAt: 1, _id: 1 })
      .skip(skip)
      .limit(query.limit)
      .lean()
      .exec(),

    ProductImageModel.countDocuments(filter).exec(),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getProductImage(productId: string, imageId: string) {
  await ensureProductExists(productId);
  return getImageOrFail(productId, imageId);
}

export async function updateProductImage(
  productId: string,
  imageId: string,
  input: ImageUpdateBody,
) {
  const image = await getImageOrFail(productId, imageId);

  if (input.isPrimary === true) {
    await makePrimary(
      image.productId,
      image._id as Types.ObjectId,
    );

    image.isPrimary = true;
  } else if (input.isPrimary === false && image.isPrimary) {
    // Promote another image before unsetting the current primary image.
    const replacement = await ProductImageModel.findOne({
      productId: image.productId,
      _id: { $ne: image._id },
    })
      .sort({ sortOrder: 1, createdAt: 1, _id: 1 })
      .exec();

    if (replacement) {
      await makePrimary(
        image.productId,
        replacement._id as Types.ObjectId,
      );
    }

    // The in-memory document must match the database update.
    image.isPrimary = false;
  }

  if (input.alt !== undefined) {
    image.alt = input.alt.trim();
  }

  if (input.sortOrder !== undefined) {
    image.sortOrder = input.sortOrder;
  }

  await image.save();

  return image;
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
) {
  const image = await getImageOrFail(productId, imageId);

  const deletedImageId = image._id.toString();
  const productObjectId = image.productId;
  const publicId = image.publicId;
  const wasPrimary = image.isPrimary;

  await image.deleteOne();

  let nextPrimaryImageId: string | null = null;

  if (wasPrimary) {
    const nextImage = await ProductImageModel.findOne({
      productId: productObjectId,
    })
      .sort({ sortOrder: 1, createdAt: 1, _id: 1 })
      .exec();

    if (nextImage) {
      await makePrimary(
        productObjectId,
        nextImage._id as Types.ObjectId,
      );

      nextPrimaryImageId = nextImage._id.toString();
    }
  }

  let storageCleanupPending = false;

  if (publicId) {
    try {
      await deleteFromCloudinary(publicId, "image");
    } catch {
      storageCleanupPending = true;
    }
  }

  return {
    id: deletedImageId,
    deleted: true,
    nextPrimaryImageId,
    storageCleanupPending,
  };
}