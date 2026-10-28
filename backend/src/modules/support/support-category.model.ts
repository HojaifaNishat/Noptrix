import {
  Schema,
  model,
  models,
  type Model,
  type HydratedDocument,
} from "mongoose";

export interface SupportCategoryFields {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type SupportCategoryDocument = HydratedDocument<SupportCategoryFields>;

const supportCategorySchema = new Schema<SupportCategoryFields>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

supportCategorySchema.index({ isActive: 1, sortOrder: 1 });

export const SupportCategory: Model<SupportCategoryFields> =
  (models.SupportCategory as Model<SupportCategoryFields> | undefined) ??
  model<SupportCategoryFields>("SupportCategory", supportCategorySchema);
