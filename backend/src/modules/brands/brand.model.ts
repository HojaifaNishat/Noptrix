import { model, Schema, type InferSchemaType } from "mongoose";

export const BRAND_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type BrandStatus = (typeof BRAND_STATUSES)[number];

const brandLogoAssetSchema = new Schema(
  {
    publicId: { type: String, required: true, trim: true },
    secureUrl: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    assetId: { type: String, required: true, trim: true },
    version: { type: Number, required: true, min: 0 },
    resourceType: {
      type: String,
      enum: ["image"],
      required: true,
      default: "image",
    },
    format: { type: String, required: true, trim: true },
    bytes: { type: Number, required: true, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    originalFilename: { type: String, trim: true },
  },
  { _id: false, versionKey: false },
);

const brandSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 160,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },
    // Kept for compatibility with existing frontend consumers.
    logo: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: "",
    },
    // Cloudinary metadata for safe replacement and deletion.
    logoAsset: {
      type: brandLogoAssetSchema,
      default: undefined,
    },
    website: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: "",
    },
    status: {
      type: String,
      enum: BRAND_STATUSES,
      default: "ACTIVE",
      required: true,
    },
    sortOrder: {
      type: Number,
      min: 0,
      max: 1_000_000,
      default: 0,
    },
    seo: {
      title: { type: String, trim: true, maxlength: 160, default: "" },
      description: { type: String, trim: true, maxlength: 320, default: "" },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
    strict: "throw",
    versionKey: false,
    minimize: false,
  },
);

brandSchema.index({ slug: 1 }, { unique: true });
brandSchema.index({ name: 1 }, { unique: true });
brandSchema.index({ status: 1, sortOrder: 1, name: 1 });
brandSchema.index({ createdAt: -1 });
brandSchema.index({ name: "text", description: "text" });
brandSchema.index({ "logoAsset.publicId": 1 });

export type IBrand = InferSchemaType<typeof brandSchema>;
export const Brand = model("Brand", brandSchema);
