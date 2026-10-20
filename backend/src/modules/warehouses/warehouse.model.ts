import mongoose, {
  Schema,
  model,
  type Model,
  type HydratedDocument,
} from "mongoose";

export const WAREHOUSE_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type WarehouseStatus = (typeof WAREHOUSE_STATUSES)[number];

export interface Warehouse {
  name: string;
  code: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  status: WarehouseStatus;
  isDefault: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deactivatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type WarehouseDocument = HydratedDocument<Warehouse>;

const warehouseSchema = new Schema<Warehouse>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 32,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    city: {
      type: String,
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
      trim: true,
      maxlength: 100,
    },
    contactName: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    contactPhone: {
      type: String,
      trim: true,
      maxlength: 32,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    status: {
      type: String,
      enum: WAREHOUSE_STATUSES,
      default: "ACTIVE",
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    deactivatedAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

warehouseSchema.index(
  { code: 1 },
  { unique: true, name: "uniq_warehouse_code" },
);
warehouseSchema.index(
  { status: 1, name: 1 },
  { name: "warehouse_status_name" },
);
warehouseSchema.index(
  { isDefault: 1 },
  {
    unique: true,
    name: "uniq_default_warehouse",
    partialFilterExpression: { isDefault: true },
  },
);

export const WarehouseModel: Model<Warehouse> =
  (mongoose.models.Warehouse as Model<Warehouse> | undefined) ??
  model<Warehouse>("Warehouse", warehouseSchema);

export default WarehouseModel;
