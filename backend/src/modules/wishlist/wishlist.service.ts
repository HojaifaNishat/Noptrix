import { Types } from "mongoose";

import { ApiError } from "../../utils/ApiError";
import ProductModel from "../products/product.model";
import ProductVariantModel from "../product-variants/variant.model";
import WishlistModel from "./wishlist.model";

import type {
  AddWishlistItemInput,
  CreateWishlistInput,
  UpdateWishlistInput,
  WishlistFilters,
} from "./wishlist.types";

function toObjectId(value: string | Types.ObjectId, label: string) {
  if (!Types.ObjectId.isValid(String(value))) {
    throw ApiError.badRequest(`Invalid ${label}`);
  }

  return new Types.ObjectId(String(value));
}

function normalizeUserId(userId: string | Types.ObjectId) {
  return toObjectId(userId, "user ID");
}

async function getOwnedWishlist(
  userId: Types.ObjectId,
  wishlistId: string | Types.ObjectId,
  includeArchived = false,
) {
  const id = toObjectId(wishlistId, "wishlist ID");

  const wishlist = await WishlistModel.findOne({
    _id: id,
    userId,
    ...(includeArchived ? {} : { status: "ACTIVE" }),
  });

  if (!wishlist) {
    throw ApiError.notFound("Wishlist not found");
  }

  return wishlist;
}

async function ensureProductAndVariant(
  input: AddWishlistItemInput,
) {
  const productId = toObjectId(input.productId, "product ID");

  const product = await ProductModel.findById(productId).lean();

  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  if (product.status !== "ACTIVE" || product.archivedAt) {
    throw ApiError.badRequest(
      "Inactive or archived products cannot be added to a wishlist",
    );
  }

  let variantId: Types.ObjectId | undefined;

  if (input.variantId) {
    variantId = toObjectId(input.variantId, "variant ID");

    const variant = await ProductVariantModel.findOne({
      _id: variantId,
      productId,
      status: "ACTIVE",
    }).lean();

    if (!variant) {
      throw ApiError.badRequest(
        "Variant is invalid, inactive, or belongs to another product",
      );
    }
  } else if (product.type === "VARIABLE") {
    throw ApiError.badRequest(
      "Select a variant for this product",
    );
  }

  return { productId, variantId };
}

export async function createWishlist(
  authenticatedUserId: string | Types.ObjectId,
  input: CreateWishlistInput = {},
) {
  const userId = normalizeUserId(authenticatedUserId);
  const name = input.name?.trim() || "My Wishlist";

  const existing = await WishlistModel.findOne({
    userId,
    name,
    status: "ACTIVE",
  });

  if (existing) {
    throw ApiError.conflict(
      "A wishlist with this name already exists",
    );
  }

  const hasDefault = await WishlistModel.exists({
    userId,
    status: "ACTIVE",
    isDefault: true,
  });

  return WishlistModel.create({
    userId,
    name,
    description: input.description,
    items: [],
    status: "ACTIVE",
    isDefault: !hasDefault,
  });
}

export async function getOrCreateDefaultWishlist(
  authenticatedUserId: string | Types.ObjectId,
) {
  const userId = normalizeUserId(authenticatedUserId);

  let wishlist = await WishlistModel.findOne({
    userId,
    status: "ACTIVE",
    isDefault: true,
  });

  if (wishlist) return wishlist;

  try {
    wishlist = await WishlistModel.findOneAndUpdate(
      {
        userId,
        status: "ACTIVE",
        isDefault: true,
      },
      {
        $setOnInsert: {
          userId,
          name: "My Wishlist",
          items: [],
          status: "ACTIVE",
          isDefault: true,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    if (!wishlist) {
      throw ApiError.internal(
        "Failed to create the default wishlist",
      );
    }

    return wishlist;
  } catch (error) {
    const existing = await WishlistModel.findOne({
      userId,
      status: "ACTIVE",
      isDefault: true,
    });

    if (existing) return existing;

    throw error;
  }
}

export async function listWishlists(
  authenticatedUserId: string | Types.ObjectId,
  filters: WishlistFilters = {},
) {
  const userId = normalizeUserId(authenticatedUserId);

  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

  const query: Record<string, unknown> = {
    userId,
    status: filters.status ?? "ACTIVE",
  };

  if (filters.search?.trim()) {
    query.name = {
      $regex: filters.search.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      ),
      $options: "i",
    };
  }

  const [items, total] = await Promise.all([
    WishlistModel.find(query)
      .sort({ isDefault: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    WishlistModel.countDocuments(query),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getWishlist(
  authenticatedUserId: string | Types.ObjectId,
  wishlistId: string,
) {
  const userId = normalizeUserId(authenticatedUserId);

  return getOwnedWishlist(userId, wishlistId);
}

export async function updateWishlist(
  authenticatedUserId: string | Types.ObjectId,
  wishlistId: string,
  input: UpdateWishlistInput,
) {
  const userId = normalizeUserId(authenticatedUserId);
  const wishlist = await getOwnedWishlist(userId, wishlistId);

  if (input.name !== undefined) {
    const duplicate = await WishlistModel.exists({
      userId,
      status: "ACTIVE",
      name: input.name.trim(),
      _id: { $ne: wishlist._id },
    });

    if (duplicate) {
      throw ApiError.conflict(
        "A wishlist with this name already exists",
      );
    }

    wishlist.name = input.name.trim();
  }

  if (input.description !== undefined) {
    wishlist.description =
      input.description === null
        ? undefined
        : input.description.trim();
  }

  await wishlist.save();

  return wishlist;
}

export async function deleteWishlist(
  authenticatedUserId: string | Types.ObjectId,
  wishlistId: string,
) {
  const userId = normalizeUserId(authenticatedUserId);
  const wishlist = await getOwnedWishlist(userId, wishlistId);

  if (wishlist.isDefault) {
    throw ApiError.badRequest(
      "The default wishlist cannot be deleted; archive it or clear its items",
    );
  }

  await wishlist.deleteOne();

  return { deleted: true, wishlistId: String(wishlist._id) };
}

export async function addWishlistItem(
  authenticatedUserId: string | Types.ObjectId,
  wishlistId: string,
  input: AddWishlistItemInput,
) {
  const userId = normalizeUserId(authenticatedUserId);
  const wishlist = await getOwnedWishlist(userId, wishlistId);
  const { productId, variantId } =
    await ensureProductAndVariant(input);

  const duplicate = wishlist.items.some(
    (item) =>
      String(item.productId) === String(productId) &&
      String(item.variantId ?? "") === String(variantId ?? ""),
  );

  if (duplicate) {
    throw ApiError.conflict(
      "This product variant is already in the wishlist",
    );
  }

  if (wishlist.items.length >= 500) {
    throw ApiError.badRequest(
      "A wishlist can contain at most 500 items",
    );
  }

  wishlist.items.push({
    productId,
    variantId,
    addedAt: new Date(),
  });

  await wishlist.save();

  return wishlist;
}

export async function removeWishlistItem(
  authenticatedUserId: string | Types.ObjectId,
  wishlistId: string,
  itemId: string,
) {
  const userId = normalizeUserId(authenticatedUserId);
  const wishlist = await getOwnedWishlist(userId, wishlistId);
  const id = toObjectId(itemId, "wishlist item ID");

  const item = wishlist.items.find(
    (entry) => String(entry._id) === String(id),
  );

  if (!item) {
    throw ApiError.notFound("Wishlist item not found");
  }

  wishlist.items = wishlist.items.filter(
    (entry) => String(entry._id) !== String(id),
  ) as typeof wishlist.items;

  await wishlist.save();

  return wishlist;
}

export async function removeWishlistProduct(
  authenticatedUserId: string | Types.ObjectId,
  wishlistId: string,
  productId: string,
  variantId?: string,
) {
  const userId = normalizeUserId(authenticatedUserId);
  const wishlist = await getOwnedWishlist(userId, wishlistId);
  const productObjectId = toObjectId(productId, "product ID");

  const variantObjectId = variantId
    ? toObjectId(variantId, "variant ID")
    : undefined;

  const matchingItem = wishlist.items.some(
    (item) =>
      String(item.productId) === String(productObjectId) &&
      String(item.variantId ?? "") ===
        String(variantObjectId ?? ""),
  );

  if (!matchingItem) {
    throw ApiError.notFound("Wishlist item not found");
  }

  wishlist.items = wishlist.items.filter(
    (item) =>
      !(
        String(item.productId) === String(productObjectId) &&
        String(item.variantId ?? "") ===
          String(variantObjectId ?? "")
      ),
  ) as typeof wishlist.items;

  await wishlist.save();

  return wishlist;
}

export async function clearWishlist(
  authenticatedUserId: string | Types.ObjectId,
  wishlistId: string,
) {
  const userId = normalizeUserId(authenticatedUserId);
  const wishlist = await getOwnedWishlist(userId, wishlistId);

  wishlist.items.splice(0, wishlist.items.length);

  await wishlist.save();

  return wishlist;
}

export async function archiveWishlist(
  authenticatedUserId: string | Types.ObjectId,
  wishlistId: string,
) {
  const userId = normalizeUserId(authenticatedUserId);
  const wishlist = await getOwnedWishlist(userId, wishlistId);

  wishlist.status = "ARCHIVED";
  wishlist.isDefault = false;

  await wishlist.save();

  return wishlist;
}

export async function setDefaultWishlist(
  authenticatedUserId: string | Types.ObjectId,
  wishlistId: string,
) {
  const userId = normalizeUserId(authenticatedUserId);
  const wishlist = await getOwnedWishlist(userId, wishlistId);

  await WishlistModel.updateMany(
    {
      userId,
      status: "ACTIVE",
      isDefault: true,
      _id: { $ne: wishlist._id },
    },
    { $set: { isDefault: false } },
  );

  wishlist.isDefault = true;
  await wishlist.save();

  return wishlist;
}
