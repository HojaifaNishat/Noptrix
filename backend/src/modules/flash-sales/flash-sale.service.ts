import { Types } from "mongoose";
import FlashSaleModel from "./flash-sale.model";
import type {
  CreateFlashSaleInput,
  FlashSaleListQuery,
  UpdateFlashSaleInput,
} from "./flash-sale.types";
import { ApiError } from "../../utils/ApiError";

function validateSaleInput(input: Partial<CreateFlashSaleInput>) {
  if (input.startsAt && input.endsAt && input.endsAt <= input.startsAt) {
    throw ApiError.badRequest("End date must be after start date");
  }

  if (input.products) {
    const ids = input.products.map((item) => item.productId);

    if (new Set(ids).size !== ids.length) {
      throw ApiError.badRequest("Duplicate products are not allowed");
    }

    for (const product of input.products) {
      if (!Number.isFinite(product.salePrice) || product.salePrice < 0) {
        throw ApiError.badRequest("Invalid flash-sale price");
      }
    }
  }
}

function toProductDocuments(
  products: NonNullable<CreateFlashSaleInput["products"]>,
) {
  return products.map((item) => ({
    productId: new Types.ObjectId(item.productId),
    salePrice: item.salePrice,
    quantityLimit: item.quantityLimit ?? null,
    soldQuantity: 0,
  }));
}

export async function createFlashSale(
  input: CreateFlashSaleInput,
  actorId?: string,
) {
  validateSaleInput(input);

  return FlashSaleModel.create({
    ...input,
    products: toProductDocuments(input.products),
    createdBy: actorId ? new Types.ObjectId(actorId) : undefined,
    updatedBy: actorId ? new Types.ObjectId(actorId) : undefined,
  });
}

export async function getFlashSaleById(flashSaleId: string) {
  if (!Types.ObjectId.isValid(flashSaleId)) {
    throw ApiError.badRequest("Invalid flash-sale ID");
  }

  const sale = await FlashSaleModel.findById(flashSaleId);

  if (!sale) {
    throw ApiError.notFound("Flash sale not found");
  }

  return sale;
}

export async function listFlashSales(query: FlashSaleListQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const filter: Record<string, unknown> = {};

  if (query.status) filter.status = query.status;

  if (query.search) {
    filter.name = { $regex: query.search, $options: "i" };
  }

  const [items, total] = await Promise.all([
    FlashSaleModel.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    FlashSaleModel.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateFlashSale(
  flashSaleId: string,
  input: UpdateFlashSaleInput,
  actorId?: string,
) {
  const sale = await getFlashSaleById(flashSaleId);

  const mergedStartsAt = input.startsAt ?? sale.startsAt;
  const mergedEndsAt = input.endsAt ?? sale.endsAt;

  if (mergedEndsAt <= mergedStartsAt) {
    throw ApiError.badRequest("End date must be after start date");
  }

  if (input.products) {
    validateSaleInput({ products: input.products });
  }

  // Do not reset soldQuantity when editing a sale's product prices.
  if (input.products) {
    type ExistingSaleProduct = {
      productId: Types.ObjectId;
      salePrice: number;
      quantityLimit?: number | null;
      soldQuantity: number;
    };

    const existing = new Map<string, ExistingSaleProduct>(
      (sale.products as unknown as ExistingSaleProduct[]).map(
        (item): [string, ExistingSaleProduct] => [String(item.productId), item],
      ),
    );

    sale.products = input.products.map((item) => {
      const previous = existing.get(item.productId);

      return {
        productId: new Types.ObjectId(item.productId),
        salePrice: item.salePrice,
        quantityLimit: item.quantityLimit ?? null,
        soldQuantity: previous?.soldQuantity ?? 0,
      };
    }) as typeof sale.products;
  }

  if (input.name !== undefined) sale.name = input.name;
  if (input.description !== undefined) sale.description = input.description;
  if (input.startsAt !== undefined) sale.startsAt = input.startsAt;
  if (input.endsAt !== undefined) sale.endsAt = input.endsAt;
  if (input.status !== undefined) sale.status = input.status;
  if (input.priority !== undefined) sale.priority = input.priority;
  if (actorId) sale.updatedBy = new Types.ObjectId(actorId);

  await sale.save();
  return sale;
}

export async function deleteFlashSale(flashSaleId: string) {
  const sale = await getFlashSaleById(flashSaleId);
  await sale.deleteOne();

  return { id: flashSaleId, deleted: true };
}

export async function listActiveFlashSales() {
  const now = new Date();

  return FlashSaleModel.find({
    status: "ACTIVE",
    startsAt: { $lte: now },
    endsAt: { $gt: now },
  }).sort({ priority: -1, startsAt: 1 });
}
