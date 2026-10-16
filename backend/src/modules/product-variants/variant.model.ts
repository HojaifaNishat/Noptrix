import { Types, Schema, model, models, type Model, type HydratedDocument } from "mongoose";

export interface IProductVariant {
    productId: Types.ObjectId;
    name: string;
    sku: string;
    options: Record<string, string>;
    price: number;
    compareAtPrice?: number;
    stock: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export type ProductVariantDocument = HydratedDocument<IProductVariant>;

const schema = new Schema<IProductVariant>({
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 180 },
    sku: { type: String, required: true, trim: true, uppercase: true, maxlength: 80 },
    options: { type: Schema.Types.Mixed, default: {} },
    price: { type: Number, required: true, min: 0.01 },
    compareAtPrice: { type: Number, min: 0.01 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true, versionKey: false, strict: "throw" });

schema.index({ sku: 1 }, { unique: true, name: "uniq_product_variant_sku" });
schema.index({ productId: 1, isActive: 1 });

export const ProductVariant =
    (models.ProductVariant as Model<IProductVariant> | undefined)
    ?? model<IProductVariant>("ProductVariant", schema);
