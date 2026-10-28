import mongoose, {
  Schema,
  model,
  type Model,
  type HydratedDocument,
} from "mongoose";

import {
  SUPPLIER_STATUSES,
  type Supplier,
  type SupplierAddress,
  type SupplierContact,
  type SupplierAuditEntry,
} from "./supplier.types";

const supplierAddressSchema = new Schema<SupplierAddress>(
  {
    street: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    state: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
  },
  { _id: false, strict: "throw" },
);

const supplierContactSchema = new Schema<SupplierContact>(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 25,
    },
    designation: {
      type: String,
      trim: true,
      maxlength: 100,
    },
  },
  { _id: false, strict: "throw" },
);

const supplierAuditSchema = new Schema<SupplierAuditEntry>(
  {
    action: {
      type: String,
      enum: ["CREATED", "UPDATED", "STATUS_CHANGED"],
      required: true,
      immutable: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      immutable: true,
    },
    performedAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },
    changes: {
      type: Schema.Types.Mixed,
      immutable: true,
    },
  },
  { _id: false, versionKey: false, strict: "throw" },
);

export type SupplierDocument = HydratedDocument<Supplier>;

const supplierSchema = new Schema<Supplier>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      immutable: true,
      maxlength: 40,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 180,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 25,
    },
    alternatePhone: {
      type: String,
      trim: true,
      maxlength: 25,
    },
    website: {
      type: String,
      trim: true,
      maxlength: 2048,
    },
    taxId: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    registrationNumber: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    address: {
      type: supplierAddressSchema,
      required: true,
    },
    contactPerson: {
      type: supplierContactSchema,
      default: undefined,
    },
    paymentTermsDays: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 365,
      validate: {
        validator: Number.isSafeInteger,
        message: "Payment terms must be a safe integer.",
      },
    },
    creditLimit: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isFinite,
        message: "Credit limit must be finite.",
      },
    },
    currency: {
      type: String,
      required: true,
      default: "SAR",
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
      match: /^[A-Z]{3}$/,
    },
    status: {
      type: String,
      required: true,
      enum: SUPPLIER_STATUSES,
      default: "ACTIVE",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (values: string[]) =>
          values.length <= 30 &&
          values.every(
            (value) =>
              typeof value === "string" &&
              value.trim().length > 0 &&
              value.trim().length <= 40,
          ),
        message: "Supplier tags are invalid.",
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      immutable: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    auditTrail: {
      type: [supplierAuditSchema],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: "__v",
    strict: "throw",
    minimize: true,
  },
);

supplierSchema.index({ code: 1 }, { unique: true, name: "uniq_supplier_code" });

supplierSchema.index({ slug: 1 }, { unique: true, name: "uniq_supplier_slug" });

supplierSchema.index({ name: 1, status: 1 }, { name: "supplier_name_status" });

supplierSchema.index(
  { status: 1, createdAt: -1 },
  { name: "supplier_status_created_at" },
);

supplierSchema.index(
  { "address.city": 1, "address.country": 1 },
  { name: "supplier_city_country" },
);

supplierSchema.index({ tags: 1 }, { name: "supplier_tags" });

supplierSchema.index(
  { email: 1 },
  {
    name: "supplier_email",
    partialFilterExpression: { email: { $type: "string", $gt: "" } },
  },
);

export const SupplierModel =
  (mongoose.models.Supplier as Model<Supplier> | undefined) ??
  model<Supplier>("Supplier", supplierSchema);

export default SupplierModel;
