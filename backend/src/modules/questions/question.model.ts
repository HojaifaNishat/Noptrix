import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type Model,
  type Types,
} from "mongoose";

export const QUESTION_STATUSES = [
  "PENDING",
  "APPROVED",
  "ANSWERED",
  "REJECTED",
] as const;

export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export interface QuestionAnswer {
  answer: string;
  answeredBy: Types.ObjectId;
  answeredByRole: "ADMIN" | "SELLER";
  answeredAt: Date;
}

export interface QuestionFields {
  customerId: Types.ObjectId;
  productId: Types.ObjectId;
  question: string;
  status: QuestionStatus;
  answer?: QuestionAnswer;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  moderationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type QuestionDocument = HydratedDocument<QuestionFields>;

const answerSchema = new Schema<QuestionAnswer>(
  {
    answer: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 10000,
    },
    answeredBy: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    answeredByRole: {
      type: String,
      enum: ["ADMIN", "SELLER"],
      required: true,
    },
    answeredAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    _id: false,
    versionKey: false,
  },
);

const questionSchema = new Schema<QuestionFields>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 3000,
    },
    status: {
      type: String,
      enum: QUESTION_STATUSES,
      default: "PENDING",
      required: true,
      index: true,
    },
    answer: {
      type: answerSchema,
      default: undefined,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      default: undefined,
    },
    moderatedAt: {
      type: Date,
      default: undefined,
    },
    moderationReason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

questionSchema.index({
  productId: 1,
  status: 1,
  createdAt: -1,
});

questionSchema.index({
  customerId: 1,
  createdAt: -1,
});

export const Question: Model<QuestionFields> =
  (models.Question as Model<QuestionFields> | undefined) ??
  model<QuestionFields>("Question", questionSchema);
