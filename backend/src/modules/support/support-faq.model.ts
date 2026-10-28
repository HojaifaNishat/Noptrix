import {
  Schema,
  model,
  models,
  type Model,
  type HydratedDocument,
  type Types,
} from "mongoose";

export interface SupportFaqFields {
  question: string;
  answer: string;
  categoryId: Types.ObjectId;
  isPublished: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type SupportFaqDocument = HydratedDocument<SupportFaqFields>;

const supportFaqSchema = new Schema<SupportFaqFields>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 300,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 10000,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "SupportCategory",
      required: true,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
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

supportFaqSchema.index({ isPublished: 1, sortOrder: 1 });

export const SupportFaq: Model<SupportFaqFields> =
  (models.SupportFaq as Model<SupportFaqFields> | undefined) ??
  model<SupportFaqFields>("SupportFaq", supportFaqSchema);
