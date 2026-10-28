import mongoose, { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { Seller } from "../sellers/seller.model";
import ProductModel from "../products/product.model";
import SellerProductModel from "./seller-product.model";
import type {
  SellerProductCreateInput,
  SellerProductUpdateInput,
  SellerProductListQuery,
} from "./seller-product.types";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getActiveSeller(tokenSubject: string) {
  if (!Types.ObjectId.isValid(tokenSubject)) {
    throw ApiError.unauthorized("Invalid seller identity.");
  }

  const seller = await Seller.findById(tokenSubject);

  if (!seller) {
    throw ApiError.forbidden("Seller account was not found.");
  }

  if (seller.status !== "ACTIVE") {
    throw ApiError.forbidden("Only active sellers can manage products.");
  }

  return seller;
}

function normalizeSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

function handleDuplicate(error: unknown): never {
  const e = error as {
    code?: number;
    keyPattern?: Record<string, unknown>;
  };

  if (e?.code === 11000) {
    const field = Object.keys(e.keyPattern ?? {})[0] ?? "field";
    throw ApiError.conflict(`A product with this ${field} already exists.`);
  }

  throw error;
}

async function assertReferences(
  input: Partial<SellerProductCreateInput>,
): Promise<void> {
  const check = async (name: string, id?: string) => {
    if (!id) return;

    let refModel;
    try {
      refModel = mongoose.model(name);
    } catch {
      throw ApiError.internal(`${name} model is not registered.`);
    }

    if (!(await refModel.exists({ _id: id }))) {
      throw ApiError.badRequest(`${name} reference does not exist.`);
    }
  };

  await check("Category", input.categoryId);
  await check("Subcategory", input.subcategoryId);
  await check("Brand", input.brandId);

  if (input.subcategoryId && input.categoryId) {
    const subcategory = (await mongoose
      .model("Subcategory")
      .findById(input.subcategoryId)
      .select("categoryId")
      .lean()) as { categoryId?: Types.ObjectId } | null;

    if (
      subcategory?.categoryId &&
      String(subcategory.categoryId) !== input.categoryId
    ) {
      throw ApiError.badRequest(
        "Subcategory does not belong to the selected category.",
      );
    }
  }

  if (input.collectionIds?.length) {
    const uniqueIds = [...new Set(input.collectionIds)];
    const count = await mongoose.model("Collection").countDocuments({
      _id: { $in: uniqueIds },
    });

    if (count !== uniqueIds.length) {
      throw ApiError.badRequest("One or more collections do not exist.");
    }
  }
}

function assertPriceRules(input: Partial<SellerProductCreateInput>) {
  if (
    input.price !== undefined &&
    input.compareAtPrice !== undefined &&
    input.compareAtPrice <= input.price
  ) {
    throw ApiError.badRequest("compareAtPrice must be greater than price.");
  }

  if (input.type === "DIGITAL" && input.requiresShipping === true) {
    throw ApiError.badRequest("Digital products cannot require shipping.");
  }
}

async function getOwnedProduct(sellerId: Types.ObjectId, productId: string) {
  if (!Types.ObjectId.isValid(productId)) {
    throw ApiError.badRequest("Invalid product ID.");
  }

  const product = await ProductModel.findOne({
    _id: productId,
    sellerId,
  });

  if (!product) throw ApiError.notFound("Product not found.");

  return product;
}

export async function createSellerProduct(
  tokenSubject: string,
  input: SellerProductCreateInput,
) {
  const seller = await getActiveSeller(tokenSubject);

  assertPriceRules(input);
  await assertReferences(input);

  const name = input.name.trim();
  const slug = normalizeSlug(input.slug || name);

  if (slug.length < 2) {
    throw ApiError.badRequest("A valid product slug is required.");
  }

  let productId: Types.ObjectId | undefined;

  try {
    const product = await ProductModel.create({
      ...input,
      name,
      slug,
      sellerId: seller._id,
      status: "DRAFT",
      featured: false,
      sku: input.sku?.trim().toUpperCase() || undefined,
      barcode: input.barcode?.trim() || undefined,
      currency: input.currency?.trim().toUpperCase() || "BDT",
      tags: [...new Set((input.tags ?? []).map((tag) => tag.trim()))],
      collectionIds: input.collectionIds ?? [],
    });

    productId = product._id;

    const submission = await SellerProductModel.create({
      sellerId: seller._id,
      productId: product._id,
      status: "PENDING",
      submittedAt: new Date(),
    });

    return { product, submission };
  } catch (error) {
    if (productId) {
      await ProductModel.deleteOne({
        _id: productId,
        sellerId: seller._id,
      }).catch(() => undefined);
    }

    handleDuplicate(error);
  }
}

export async function listSellerProducts(
  tokenSubject: string,
  query: SellerProductListQuery,
) {
  const seller = await getActiveSeller(tokenSubject);
  const filter: Record<string, unknown> = { sellerId: seller._id };

  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.categoryId) filter.categoryId = query.categoryId;
  if (query.subcategoryId) filter.subcategoryId = query.subcategoryId;
  if (query.brandId) filter.brandId = query.brandId;

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const price: Record<string, number> = {};
    if (query.minPrice !== undefined) price.$gte = query.minPrice;
    if (query.maxPrice !== undefined) price.$lte = query.maxPrice;
    filter.price = price;
  }

  if (query.inStock === "true") {
    filter.$or = [{ trackInventory: false }, { stockQuantity: { $gt: 0 } }];
  } else if (query.inStock === "false") {
    filter.trackInventory = true;
    filter.stockQuantity = { $lte: 0 };
  }

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), "i");
    filter.$and = [
      { $or: [{ name: regex }, { sku: regex }, { barcode: regex }] },
    ];
  }

  const page = query.page;
  const limit = query.limit;
  const direction = query.sortOrder === "asc" ? 1 : -1;

  const [products, total] = await Promise.all([
    ProductModel.find(filter)
      .sort({ [query.sortBy]: direction, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ProductModel.countDocuments(filter),
  ]);

  const productIds = products.map((product) => product._id);
  const submissions = await SellerProductModel.find({
    sellerId: seller._id,
    productId: { $in: productIds },
  }).lean();

  const submissionByProduct = new Map(
    submissions.map((item) => [String(item.productId), item]),
  );

  return {
    products: products.map((product) => ({
      product,
      submission: submissionByProduct.get(String(product._id)) ?? null,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getSellerProduct(
  tokenSubject: string,
  productId: string,
) {
  const seller = await getActiveSeller(tokenSubject);
  const product = await getOwnedProduct(seller._id, productId);
  const submission = await SellerProductModel.findOne({
    sellerId: seller._id,
    productId: product._id,
  });

  return { product, submission };
}

export async function updateSellerProduct(
  tokenSubject: string,
  productId: string,
  input: SellerProductUpdateInput,
) {
  const seller = await getActiveSeller(tokenSubject);
  const product = await getOwnedProduct(seller._id, productId);

  const previousStatus = product.status;

  assertPriceRules({
    price: input.price ?? product.price,
    compareAtPrice: input.compareAtPrice ?? product.compareAtPrice,
    type: input.type ?? product.type,
    requiresShipping: input.requiresShipping ?? product.requiresShipping,
  });

  await assertReferences({
    categoryId: input.categoryId ?? String(product.categoryId),
    subcategoryId:
      input.subcategoryId ??
      (product.subcategoryId ? String(product.subcategoryId) : undefined),
    brandId:
      input.brandId ?? (product.brandId ? String(product.brandId) : undefined),
    collectionIds: input.collectionIds ?? product.collectionIds.map(String),
  });

  const changes: Record<string, unknown> = { ...input };

  if (input.name !== undefined) {
    changes.name = input.name.trim();
    if (input.slug === undefined) changes.slug = normalizeSlug(input.name);
  }
  if (input.slug !== undefined) changes.slug = normalizeSlug(input.slug);
  if (input.sku !== undefined) changes.sku = input.sku.trim().toUpperCase();
  if (input.barcode !== undefined) changes.barcode = input.barcode.trim();
  if (input.currency !== undefined) {
    changes.currency = input.currency.trim().toUpperCase();
  }
  if (input.tags !== undefined) {
    changes.tags = [...new Set(input.tags.map((tag) => tag.trim()))];
  }

  try {
    Object.assign(product, changes);
    product.sellerId = seller._id;
    product.featured = false;

    // A seller cannot change a published product without another review.
    const submission = await SellerProductModel.findOne({
      sellerId: seller._id,
      productId: product._id,
    });

    if (submission && previousStatus === "ACTIVE") {
      product.status = "DRAFT";
      submission.status = "PENDING";
      submission.submittedAt = new Date();
      submission.reviewedAt = undefined;
      submission.reviewedBy = undefined;
      submission.rejectionReason = undefined;
      await submission.save();
    } else if (submission?.status === "REJECTED") {
      // Edits alone do not resubmit a rejected product.
      // Seller must call the explicit resubmit endpoint.
    } else if (submission?.status === "PENDING") {
      submission.submittedAt = new Date();
      await submission.save();
    }

    await product.save();
    return { product, submission };
  } catch (error) {
    handleDuplicate(error);
  }
}

export async function resubmitSellerProduct(
  tokenSubject: string,
  productId: string,
) {
  const seller = await getActiveSeller(tokenSubject);
  const product = await getOwnedProduct(seller._id, productId);

  const submission = await SellerProductModel.findOne({
    sellerId: seller._id,
    productId: product._id,
  });

  if (!submission) {
    throw ApiError.notFound("Seller submission not found.");
  }

  if (submission.status !== "REJECTED") {
    throw ApiError.badRequest("Only rejected submissions can be resubmitted.");
  }

  product.status = "DRAFT";
  product.featured = false;
  submission.status = "PENDING";
  submission.submittedAt = new Date();
  submission.reviewedAt = undefined;
  submission.reviewedBy = undefined;
  submission.rejectionReason = undefined;

  await product.save();
  await submission.save();

  return { product, submission };
}

export async function archiveSellerProduct(
  tokenSubject: string,
  productId: string,
) {
  const seller = await getActiveSeller(tokenSubject);
  const product = await getOwnedProduct(seller._id, productId);

  product.status = "ARCHIVED";
  product.archivedAt = new Date();
  product.featured = false;
  await product.save();

  return product;
}

export async function listPendingSellerProducts() {
  return SellerProductModel.find({ status: "PENDING" })
    .sort({ submittedAt: 1 })
    .populate("sellerId")
    .populate("productId");
}

export async function reviewSellerProduct(
  submissionId: string,
  decision: "APPROVED" | "REJECTED",
  reviewerId: string,
  rejectionReason?: string,
) {
  if (!Types.ObjectId.isValid(submissionId)) {
    throw ApiError.badRequest("Invalid submission ID.");
  }

  const submission = await SellerProductModel.findById(submissionId);
  if (!submission) throw ApiError.notFound("Submission not found.");

  if (submission.status !== "PENDING") {
    throw ApiError.conflict("Only pending submissions can be reviewed.");
  }

  const product = await ProductModel.findById(submission.productId);
  if (!product) throw ApiError.notFound("Submitted product not found.");

  if (decision === "REJECTED" && !rejectionReason?.trim()) {
    throw ApiError.badRequest("A rejection reason is required.");
  }

  if (decision === "APPROVED") {
    product.status = "ACTIVE";
    product.archivedAt = undefined;
    product.featured = false;
  } else {
    product.status = "DRAFT";
    product.featured = false;
    submission.rejectionReason = rejectionReason!.trim();
  }

  submission.status = decision;
  submission.reviewedAt = new Date();

  if (Types.ObjectId.isValid(reviewerId)) {
    submission.reviewedBy = new Types.ObjectId(reviewerId);
  }

  await product.save();
  await submission.save();

  return { product, submission };
}
