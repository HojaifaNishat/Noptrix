import { model, Schema, type InferSchemaType } from "mongoose";

export const ATTRIBUTE_TYPES = [
  "TEXT",
  "NUMBER",
  "BOOLEAN",
  "SELECT",
  "MULTI_SELECT",
] as const;

export const ATTRIBUTE_STATUSES = ["ACTIVE", "INACTIVE"] as const;

const attributeSchema = new Schema(
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
      minlength: 2,
      maxlength: 160,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    type: {
      type: String,
      enum: ATTRIBUTE_TYPES,
      required: true,
    },
    options: {
      type: [{ type: String, trim: true, maxlength: 120 }],
      default: [],
      validate: {
        validator: (values: string[]) =>
          Array.isArray(values) &&
          new Set(values.map((v) => v.trim().toLowerCase())).size ===
            values.length,
        message: "Attribute options must be unique.",
      },
    },
    isRequired: { type: Boolean, default: false },
    isVariant: { type: Boolean, default: false },
    isFilterable: { type: Boolean, default: false },
    isSearchable: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ATTRIBUTE_STATUSES,
      default: "ACTIVE",
      required: true,
    },
    sortOrder: {
      type: Number,
      min: 0,
      max: 1_000_000,
      default: 0,
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

attributeSchema.index({ slug: 1 }, { unique: true });
attributeSchema.index({ name: 1 }, { unique: true });
attributeSchema.index({ status: 1, sortOrder: 1, name: 1 });
attributeSchema.index({ type: 1, status: 1 });
attributeSchema.index({ isVariant: 1, status: 1 });
attributeSchema.index({ name: "text", description: "text" });

export type IAttribute = InferSchemaType<typeof attributeSchema>;

export const Attribute = model("Attribute", attributeSchema);
