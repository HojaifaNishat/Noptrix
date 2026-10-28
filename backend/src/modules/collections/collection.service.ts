import { startSession, Types, type ClientSession } from "mongoose";

import { ApiError } from "../../utils/ApiError";
import { ProductModel } from "../products/product.model";
import { Collection } from "./collection.model";

import type {
  ICollectionFilters,
  ICreateCollectionInput,
  IUpdateCollectionInput,
} from "./collection.types";

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

function throwCollectionWriteError(error: unknown): never {
  if (isDuplicateKeyError(error)) {
    throw ApiError.conflict("A collection with this slug already exists.");
  }

  throw error;
}

async function withCollectionTransaction<T>(
  work: (session: ClientSession) => Promise<T>,
): Promise<T> {
  const session = await startSession();

  try {
    let result!: T;

    await session.withTransaction(async () => {
      result = await work(session);
    });

    return result;
  } finally {
    await session.endSession();
  }
}

function createSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.map((id) => id.toLowerCase()))];
}

function toObjectIds(ids: string[]): Types.ObjectId[] {
  return uniqueIds(ids).map((id) => new Types.ObjectId(id));
}

async function assertProductsExist(
  ids: string[],
  session: ClientSession,
): Promise<void> {
  const objectIds = toObjectIds(ids);

  if (objectIds.length === 0) {
    return;
  }

  const existingCount = await ProductModel.countDocuments({
    _id: { $in: objectIds },
  })
    .session(session)
    .exec();

  if (existingCount !== objectIds.length) {
    throw ApiError.badRequest("One or more product IDs do not exist.");
  }
}

async function ensureUniqueSlug(
  slug: string,
  session: ClientSession,
  excludeId?: string,
): Promise<void> {
  const query: Record<string, unknown> = { slug };

  if (excludeId) {
    query._id = { $ne: new Types.ObjectId(excludeId) };
  }

  const existing = await Collection.exists(query).session(session);

  if (existing) {
    throw ApiError.conflict("A collection with this slug already exists.");
  }
}

async function syncProductCollectionLinks(
  collectionId: Types.ObjectId,
  addIds: Types.ObjectId[],
  removeIds: Types.ObjectId[],
  session: ClientSession,
): Promise<void> {
  if (removeIds.length > 0) {
    await ProductModel.updateMany(
      { _id: { $in: removeIds } },
      { $pull: { collectionIds: collectionId } },
      { session },
    ).exec();
  }

  if (addIds.length > 0) {
    await ProductModel.updateMany(
      { _id: { $in: addIds } },
      { $addToSet: { collectionIds: collectionId } },
      { session },
    ).exec();
  }
}

async function getPopulatedCollection(id: Types.ObjectId | string) {
  return Collection.findById(id).populate("products").exec();
}

export async function createCollection(input: ICreateCollectionInput) {
  const slug = createSlug(input.slug || input.name);

  if (!slug) {
    throw ApiError.badRequest(
      "A valid collection slug could not be generated.",
    );
  }

  const productIds = toObjectIds(input.products ?? []);

  try {
    const collectionId = await withCollectionTransaction(async (session) => {
      await ensureUniqueSlug(slug, session);
      await assertProductsExist(productIds.map(String), session);

      const [collection] = await Collection.create(
        [
          {
            ...input,
            slug,
            products: productIds,
          },
        ],
        { session },
      );

      if (!collection) {
        throw new Error("Collection creation returned no document.");
      }

      await syncProductCollectionLinks(collection._id, productIds, [], session);

      return collection._id;
    });

    return getPopulatedCollection(collectionId);
  } catch (error) {
    throwCollectionWriteError(error);
  }
}

export async function getCollectionById(id: string) {
  const collection = await getPopulatedCollection(id);

  if (!collection) {
    throw ApiError.notFound("Collection not found.");
  }

  return collection;
}

export async function getCollectionBySlug(slug: string) {
  const collection = await Collection.findOne({
    slug: slug.toLowerCase(),
    status: "ACTIVE",
  })
    .populate({
      path: "products",
      match: { status: "ACTIVE" },
    })
    .exec();

  if (!collection) {
    throw ApiError.notFound("Collection not found.");
  }

  return collection;
}

export async function listCollections(
  filters: ICollectionFilters,
  options: { publicOnly?: boolean } = {},
) {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    isFeatured,
    sortBy = "sortOrder",
    sortOrder = "asc",
  } = filters;

  const query: Record<string, unknown> = {};

  if (options.publicOnly) {
    query.status = "ACTIVE";
  } else if (status) {
    query.status = status;
  }

  if (typeof isFeatured === "boolean") {
    query.isFeatured = isFeatured;
  }

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    query.$or = [
      { name: { $regex: escapedSearch, $options: "i" } },
      { slug: { $regex: escapedSearch, $options: "i" } },
      {
        description: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
    ];
  }

  const safePage = Math.max(1, Math.floor(Number(page) || 1));

  const safeLimit = Math.min(100, Math.max(1, Math.floor(Number(limit) || 20)));

  const skip = (safePage - 1) * safeLimit;
  const direction = sortOrder === "asc" ? 1 : -1;

  const [items, total] = await Promise.all([
    Collection.find(query)
      .sort({ [sortBy]: direction, _id: 1 })
      .skip(skip)
      .limit(safeLimit)
      .populate(
        options.publicOnly
          ? {
              path: "products",
              match: { status: "ACTIVE" },
            }
          : { path: "products" },
      )
      .lean()
      .exec(),

    Collection.countDocuments(query).exec(),
  ]);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
      hasNextPage: safePage * safeLimit < total,
      hasPreviousPage: safePage > 1,
    },
  };
}

export async function updateCollection(
  id: string,
  input: IUpdateCollectionInput,
) {
  try {
    const collectionId = await withCollectionTransaction(async (session) => {
      const collection = await Collection.findById(id).session(session).exec();

      if (!collection) {
        throw ApiError.notFound("Collection not found.");
      }

      if (input.slug !== undefined || input.name !== undefined) {
        const newSlug = createSlug(input.slug || input.name || collection.name);

        if (!newSlug) {
          throw ApiError.badRequest(
            "A valid collection slug could not be generated.",
          );
        }

        await ensureUniqueSlug(newSlug, session, id);
        collection.slug = newSlug;
      }

      if (input.name !== undefined) {
        collection.name = input.name;
      }

      if (input.description !== undefined) {
        collection.description = input.description;
      }

      if (input.image !== undefined) {
        collection.image = input.image;
      }

      if (input.status !== undefined) {
        collection.status = input.status;
      }

      if (input.isFeatured !== undefined) {
        collection.isFeatured = input.isFeatured;
      }

      if (input.sortOrder !== undefined) {
        collection.sortOrder = input.sortOrder;
      }

      if (input.seoTitle !== undefined) {
        collection.seoTitle = input.seoTitle;
      }

      if (input.seoDescription !== undefined) {
        collection.seoDescription = input.seoDescription;
      }

      if (input.products !== undefined) {
        await assertProductsExist(input.products, session);

        const previousIds = collection.products.map((productId) =>
          productId.toString().toLowerCase(),
        );

        const nextIds = uniqueIds(input.products);
        const nextProducts = toObjectIds(nextIds);

        const nextSet = new Set(nextIds);
        const previousSet = new Set(previousIds);

        const removedIds = collection.products.filter(
          (productId) => !nextSet.has(productId.toString().toLowerCase()),
        );

        const addedIds = nextProducts.filter(
          (productId) => !previousSet.has(productId.toString()),
        );

        collection.products = nextProducts;

        await collection.save({ session });

        await syncProductCollectionLinks(
          collection._id,
          addedIds,
          removedIds,
          session,
        );
      } else {
        await collection.save({ session });
      }

      return collection._id;
    });

    return getPopulatedCollection(collectionId);
  } catch (error) {
    throwCollectionWriteError(error);
  }
}

export async function addProductsToCollection(
  id: string,
  productIds: string[],
) {
  try {
    const collectionId = await withCollectionTransaction(async (session) => {
      const collection = await Collection.findById(id).session(session).exec();

      if (!collection) {
        throw ApiError.notFound("Collection not found.");
      }

      await assertProductsExist(productIds, session);

      const existingSet = new Set(
        collection.products.map((productId) => productId.toString()),
      );

      const addedIds = toObjectIds(productIds).filter(
        (productId) => !existingSet.has(productId.toString()),
      );

      if (addedIds.length > 0) {
        collection.products.push(...addedIds);

        await collection.save({ session });

        await syncProductCollectionLinks(collection._id, addedIds, [], session);
      }

      return collection._id;
    });

    return getPopulatedCollection(collectionId);
  } catch (error) {
    throwCollectionWriteError(error);
  }
}

export async function removeProductsFromCollection(
  id: string,
  productIds: string[],
) {
  try {
    const collectionId = await withCollectionTransaction(async (session) => {
      const collection = await Collection.findById(id).session(session).exec();

      if (!collection) {
        throw ApiError.notFound("Collection not found.");
      }

      await assertProductsExist(productIds, session);

      const idsToRemove = new Set(uniqueIds(productIds));

      const removedIds = collection.products.filter((productId) =>
        idsToRemove.has(productId.toString().toLowerCase()),
      );

      if (removedIds.length > 0) {
        collection.products = collection.products.filter(
          (productId) => !idsToRemove.has(productId.toString().toLowerCase()),
        );

        await collection.save({ session });

        await syncProductCollectionLinks(
          collection._id,
          [],
          removedIds,
          session,
        );
      }

      return collection._id;
    });

    return getPopulatedCollection(collectionId);
  } catch (error) {
    throwCollectionWriteError(error);
  }
}

export async function deleteCollection(id: string) {
  try {
    await withCollectionTransaction(async (session) => {
      const collection = await Collection.findById(id).session(session).exec();

      if (!collection) {
        throw ApiError.notFound("Collection not found.");
      }

      await ProductModel.updateMany(
        { collectionIds: collection._id },
        { $pull: { collectionIds: collection._id } },
        { session },
      ).exec();

      await collection.deleteOne({ session });
    });

    return { id, deleted: true };
  } catch (error) {
    throwCollectionWriteError(error);
  }
}
