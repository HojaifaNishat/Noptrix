import mongoose, { Document, Model, Schema, Types, model } from "mongoose";

export interface IInventory {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventoryDocument extends IInventory, Document {
  readonly availableQuantity: number;
}

const inventorySchema = new Schema<IInventoryDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      immutable: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reservedQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator(value: number) {
          return Number.isFinite(value) && value >= 0;
        },
        message: "Reserved quantity must be a non-negative number.",
      },
    },
    lowStockThreshold: {
      type: Number,
      required: true,
      min: 0,
      default: 5,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

inventorySchema.virtual("availableQuantity").get(
  function (this: IInventoryDocument) {
    return Math.max(0, this.quantity - this.reservedQuantity);
  },
);

inventorySchema.index(
  { productId: 1 },
  { unique: true, name: "uniq_inventory_product" },
);
inventorySchema.index({ quantity: 1, reservedQuantity: 1 });

export const Inventory: Model<IInventoryDocument> =
  (mongoose.models.Inventory as Model<IInventoryDocument> | undefined) ??
  model<IInventoryDocument>("Inventory", inventorySchema);
