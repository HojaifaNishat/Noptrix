import { Schema, model, models, type HydratedDocument, type Model} from "mongoose";

export interface IProductTag {
    name: string;
    slug: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}
export type ProductTagDocument = HydratedDocument<IProductTag>;

const schema = new Schema<IProductTag>({
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
}, { timestamps: true, versionKey: false });

schema.index({ slug: 1 }, { unique: true, name: "uniq_product_tag_slug" });
schema.index({ name: 1 });

export const ProductTag = (models.ProductTag as Model<IProductTag> | undefined)
    ?? model<IProductTag>("ProductTag", schema);
