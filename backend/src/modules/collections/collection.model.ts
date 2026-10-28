import { model, Schema, type HydratedDocument } from "mongoose";

import { COLLECTION_STATUSES, type ICollection } from "./collection.types";

export type CollectionDocument = HydratedDocument<ICollection>;

const collectionSchema = new Schema<ICollection>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      maxlength: 160,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
    },

    image: {
      type: String,
      trim: true,
      maxlength: 2048,
    },

    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    status: {
      type: String,
      enum: COLLECTION_STATUSES,
      default: "ACTIVE",
      required: true,
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    seoTitle: {
      type: String,
      trim: true,
      maxlength: 160,
    },

    seoDescription: {
      type: String,
      trim: true,
      maxlength: 320,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

collectionSchema.index({
  status: 1,
  isFeatured: 1,
  sortOrder: 1,
});

collectionSchema.index({
  name: "text",
  description: "text",
});

export const Collection = model<ICollection>("Collection", collectionSchema);

export default Collection;
