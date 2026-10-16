import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { Product } from "../products/product.model";
import { ProductTag } from "./tag.model";
import { ProductTagAssignment } from "./product-tag-assignment.model";

const slugify = (s: string) => s.normalize("NFKD").toLowerCase().trim()
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function duplicate(error: unknown): never {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
        throw ApiError.conflict("Tag slug already exists.", { code: "PRODUCT_TAG_DUPLICATE" });
    }
    throw error;
}

export async function listProductTags() {
    return ProductTag.find().sort({ name: 1 }).lean().exec();
}
export async function createProductTag(input: Record<string, unknown>) {
    try {
        const name = String(input.name);
        return await ProductTag.create({ ...input, slug: typeof input.slug === "string" ? slugify(input.slug) : slugify(name) });
    } catch (error) { return duplicate(error); }
}
export async function updateProductTag(id: string, input: Record<string, unknown>) {
    if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest("Invalid tag ID.");
    const tag = await ProductTag.findById(id).exec();
    if (!tag) throw ApiError.notFound("Product tag not found.");
    try {
        Object.assign(tag, input);
        if (typeof input.name === "string" && input.slug === undefined) tag.slug = slugify(input.name);
        if (typeof input.slug === "string") tag.slug = slugify(input.slug);
        await tag.save();
        return tag;
    } catch (error) { return duplicate(error); }
}
export async function deleteProductTag(id: string) {
    if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest("Invalid tag ID.");
    const tag = await ProductTag.findById(id).exec();
    if (!tag) throw ApiError.notFound("Product tag not found.");
    await ProductTagAssignment.deleteMany({ tagId: tag._id }).exec();
    await tag.deleteOne();
}
export async function assignProductTag(productId: string, tagId: string) {
    if (!Types.ObjectId.isValid(productId) || !Types.ObjectId.isValid(tagId)) throw ApiError.badRequest("Invalid product or tag ID.");
    const [product, tag] = await Promise.all([
        Product.exists({ _id: productId }), ProductTag.exists({ _id: tagId }),
    ]);
    if (!product) throw ApiError.notFound("Product not found.");
    if (!tag) throw ApiError.notFound("Product tag not found.");
    try { return await ProductTagAssignment.create({ productId: new Types.ObjectId(productId), tagId: new Types.ObjectId(tagId) }); }
    catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
            throw ApiError.conflict("This tag is already assigned to the product.");
        }
        throw error;
    }
}
export async function listTagsForProduct(productId: string) {
    if (!Types.ObjectId.isValid(productId)) throw ApiError.badRequest("Invalid product ID.");
    return ProductTagAssignment.find({ productId: new Types.ObjectId(productId) }).populate("tagId").lean().exec();
}
export async function unassignProductTag(productId: string, tagId: string) {
    if (!Types.ObjectId.isValid(productId) || !Types.ObjectId.isValid(tagId)) {
        throw ApiError.badRequest("Invalid product or tag ID.");
    }
    const result = await ProductTagAssignment.deleteOne({ productId: new Types.ObjectId(productId), tagId: new Types.ObjectId(tagId) }).exec();
    if (!result.deletedCount) throw ApiError.notFound("Product tag assignment not found.");
}
