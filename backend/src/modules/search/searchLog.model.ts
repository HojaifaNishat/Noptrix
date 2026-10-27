
import mongoose, { Schema, type Model } from "mongoose";

export interface SearchLog {
  query: string;
  normalizedQuery: string;
  resultCount: number;
  categoryId?: mongoose.Types.ObjectId;
  brandId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const searchLogSchema = new Schema<SearchLog>(
  {
    query: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    normalizedQuery: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },
    resultCount: {
      type: Number,
      required: true,
      min: 0,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
    },
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    collection: "search_logs",
  },
);

searchLogSchema.index({ normalizedQuery: 1, createdAt: -1 });
searchLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 },
);

export const SearchLogModel: Model<SearchLog> =
  (mongoose.models.SearchLog as Model<SearchLog> | undefined) ??
  mongoose.model<SearchLog>("SearchLog", searchLogSchema);

export default SearchLogModel;
