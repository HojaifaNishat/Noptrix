import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type Model,
  type Types,
} from "mongoose";

import { TICKET_AUTHOR_TYPES, type TicketAuthorType } from "./ticket.types";

export interface TicketMessageFields {
  ticketId: Types.ObjectId;
  authorId: Types.ObjectId;
  authorType: TicketAuthorType;
  message: string;
  isInternalNote: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TicketMessageDocument = HydratedDocument<TicketMessageFields>;

const ticketMessageSchema = new Schema<TicketMessageFields>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      immutable: true,
      index: true,
    },

    authorId: {
      type: Schema.Types.ObjectId,
      required: true,
      immutable: true,
    },

    authorType: {
      type: String,
      enum: Object.values(TICKET_AUTHOR_TYPES),
      required: true,
      immutable: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 10000,
    },

    isInternalNote: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

ticketMessageSchema.index({
  ticketId: 1,
  createdAt: 1,
});

export const TicketMessage: Model<TicketMessageFields> =
  (models.TicketMessage as Model<TicketMessageFields> | undefined) ??
  model<TicketMessageFields>("TicketMessage", ticketMessageSchema);
