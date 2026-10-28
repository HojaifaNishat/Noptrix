import {
  Schema,
  Types,
  model,
  models,
  type HydratedDocument,
  type Model,
} from "mongoose";

export interface Rating {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

export type RatingDocument = HydratedDocument<Rating>;

const ratingSchema = new Schema<Rating>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      immutable: true,
    },
    value: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number from 1 to 5.",
      },
    },
  },
  { timestamps: true, versionKey: false },
);

ratingSchema.index(
  { userId: 1, productId: 1 },
  { unique: true, name: "rating_user_product_unique" },
);
ratingSchema.index({ productId: 1, createdAt: -1 });
ratingSchema.index({ productId: 1, value: 1 });

const RatingModel: Model<Rating> =
  (models.Rating as Model<Rating> | undefined) ??
  model<Rating>("Rating", ratingSchema);

export default RatingModel;
