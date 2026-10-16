import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { Product } from "../products/product.model";
import { ProductVariant } from "./variant.model";

function duplicate(error: unknown): never {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
        throw ApiError.conflict("Variant SKU already exists.", { code: "PRODUCT_VARIANT_DUPLICATE_SKU" });
    }
    throw error;
}
export async function listProductVariants(productId: string, activeOnly = false) {
    if (!Types.ObjectId.isValid(productId)) throw ApiError.badRequest("Invalid product ID.");
    const filter: Record<string, unknown> = { productId: new Types.ObjectId(productId) };
    if (activeOnly) filter.isActive = true;
    return ProductVariant.find(filter).sort({ createdAt: 1 }).lean().exec();
}
export async function createProductVariant(input: Record<string, unknown>) {
    const productId = String(input.productId);
    if (!Types.ObjectId.isValid(productId)) throw ApiError.badRequest("Invalid product ID.");
    if (!(await Product.exists({ _id: productId }))) throw ApiError.notFound("Product not found.");
    const price = Number(input.price);
    if (!Number.isFinite(price) || price <= 0) throw ApiError.badRequest("Variant price must be greater than zero.");
    if (input.compareAtPrice !== undefined && (!Number.isFinite(Number(input.compareAtPrice)) || Number(input.compareAtPrice) < price)) {
        throw ApiError.badRequest("compareAtPrice must be greater than or equal to price.");
    }
    try { return await ProductVariant.create({ ...input, sku: String(input.sku).trim().toUpperCase() }); }
    catch (error) { return duplicate(error); }
}
export async function updateProductVariant(id: string, input: Record<string, unknown>) {
    if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest("Invalid variant ID.");
    const variant = await ProductVariant.findById(id).exec();
    if (!variant) throw ApiError.notFound("Product variant not found.");
    const price = input.price === undefined ? variant.price : Number(input.price);
    const compareAtPrice = input.compareAtPrice === undefined ? variant.compareAtPrice : Number(input.compareAtPrice);
    if (compareAtPrice !== undefined && compareAtPrice < price) throw ApiError.badRequest("compareAtPrice must be greater than or equal to price.");
    try {
        Object.assign(variant, input);
        if (typeof input.sku === "string") variant.sku = input.sku.trim().toUpperCase();
        await variant.save();
        return variant;
    } catch (error) { return duplicate(error); }
}
export async function deleteProductVariant(id: string) {
    if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest("Invalid variant ID.");
    const variant = await ProductVariant.findById(id).exec();
    if (!variant) throw ApiError.notFound("Product variant not found.");
    await variant.deleteOne();
}
