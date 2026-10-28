import {
  Types,
  Schema,
  model,
  models,
  type Model,
  type HydratedDocument,
} from "mongoose";

export interface IProductTagAssignment {
  productId: Types.ObjectId;
  tagId: Types.ObjectId;
  createdAt: Date;
}
export type ProductTagAssignmentDocument =
  HydratedDocument<IProductTagAssignment>;

const schema = new Schema<IProductTagAssignment>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    tagId: {
      type: Schema.Types.ObjectId,
      ref: "ProductTag",
      required: true,
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

schema.index(
  { productId: 1, tagId: 1 },
  { unique: true, name: "uniq_product_tag_assignment" },
);

export const ProductTagAssignment =
  (models.ProductTagAssignment as Model<IProductTagAssignment> | undefined) ??
  model<IProductTagAssignment>("ProductTagAssignment", schema);
