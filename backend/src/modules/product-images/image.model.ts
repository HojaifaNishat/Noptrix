import { Types, Schema, model, models, type Model, type HydratedDocument } from "mongoose";

export interface IProductImage {
    productId: Types.ObjectId;
    url: string;
    publicId?: string;
    alt: string;
    sortOrder: number;
    isPrimary: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type ProductImageDocument = HydratedDocument<IProductImage>;

const schema = new Schema<IProductImage>({
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    url: { type: String, required: true, trim: true, maxlength: 2048 },
    publicId: { type: String, trim: true, maxlength: 500 },
    alt: { type: String, trim: true, maxlength: 300, default: "" },
    sortOrder: { type: Number, min: 0, max: 1000000, default: 0 },
    isPrimary: { type: Boolean, default: false, index: true },
}, { timestamps: true, versionKey: false });

schema.index({ productId: 1, sortOrder: 1 });
schema.index({ productId: 1, isPrimary: 1 });

export const ProductImage = (models.ProductImage as Model<IProductImage> | undefined)
    ?? model<IProductImage>("ProductImage", schema);
