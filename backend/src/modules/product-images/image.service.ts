import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { Product } from "../products/product.model";
import { ProductImage } from "./image.model";

export async function listProductImages(productId: string) {
    if (!Types.ObjectId.isValid(productId)) throw ApiError.badRequest("Invalid product ID.");
    return ProductImage.find({ productId: new Types.ObjectId(productId) }).sort({ isPrimary: -1, sortOrder: 1, createdAt: 1 }).lean().exec();
}

export async function createProductImage(input: Record<string, unknown>) {
    const productId = String(input.productId);
    if (!Types.ObjectId.isValid(productId)) throw ApiError.badRequest("Invalid product ID.");
    if (typeof input.url !== "string" || !/^https?:\/\//i.test(input.url)) {
        throw ApiError.badRequest("Image URL must be a valid HTTP or HTTPS URL.");
    }
    if (!(await Product.exists({ _id: productId }))) throw ApiError.notFound("Product not found.");
    if (input.isPrimary === true) {
        await ProductImage.updateMany({ productId: new Types.ObjectId(productId) }, { $set: { isPrimary: false } }).exec();
    }
    const image = await ProductImage.create(input);
    await Product.updateOne({ _id: productId }, {
        $addToSet: { images: String(input.url) },
    }).exec();
    return image;
}

export async function updateProductImage(id: string, input: Record<string, unknown>) {
    if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest("Invalid image ID.");
    const image = await ProductImage.findById(id).exec();
    if (!image) throw ApiError.notFound("Product image not found.");
    if (input.isPrimary === true) {
        await ProductImage.updateMany({ productId: image.productId, _id: { $ne: image._id } },
            { $set: { isPrimary: false } }).exec();
    }
    const oldUrl = image.url;
    Object.assign(image, input);
    await image.save();
    if (typeof input.url === "string" && input.url !== oldUrl) {
        await Product.updateOne({ _id: image.productId }, { $pull: { images: oldUrl } }).exec();
        await Product.updateOne({ _id: image.productId }, { $addToSet: { images: input.url } }).exec();
    }
    return image;
}

export async function deleteProductImage(id: string) {
    if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest("Invalid image ID.");
    const image = await ProductImage.findById(id).exec();
    if (!image) throw ApiError.notFound("Product image not found.");
    await image.deleteOne();
    const stillUsed = await ProductImage.exists({ productId: image.productId, url: image.url });
    if (!stillUsed) await Product.updateOne({ _id: image.productId }, { $pull: { images: image.url } }).exec();
}
