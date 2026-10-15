import {
    Schema,
    model,
    models,
    type HydratedDocument,
    type Model,
    type Types,
} from "mongoose";

import {
    TICKET_STATUSES,
    TICKET_PRIORITIES,
    type TicketStatus,
    type TicketPriority,
} from "./ticket.types";

export interface TicketFields {
    ticketNumber: string;
    customerId: Types.ObjectId;
    subject: string;
    description: string;
    category: string;
    status: TicketStatus;
    priority: TicketPriority;
    assignedAdminId?: Types.ObjectId | null;
    assignedOwnerUserId?: Types.ObjectId | null;
    lastMessageAt: Date;
    resolvedAt?: Date | null;
    closedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export type TicketDocument = HydratedDocument<TicketFields>;

const ticketSchema = new Schema<TicketFields>(
    {
        ticketNumber: {
            type: String,
            required: true,
            unique: true,
            immutable: true,
            trim: true,
        },

        customerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            immutable: true,
            index: true,
        },

        subject: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 160,
        },

        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
            maxlength: 10000,
        },

        category: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 80,
            index: true,
        },

        status: {
            type: String,
            enum: Object.values(TICKET_STATUSES),
            default: TICKET_STATUSES.OPEN,
            required: true,
            index: true,
        },

        priority: {
            type: String,
            enum: Object.values(TICKET_PRIORITIES),
            default: TICKET_PRIORITIES.MEDIUM,
            required: true,
            index: true,
        },

        assignedAdminId: {
            type: Schema.Types.ObjectId,
            ref: "Admin",
            default: null,
            index: true,
        },

        assignedOwnerUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },

        lastMessageAt: {
            type: Date,
            default: Date.now,
            index: true,
        },

        resolvedAt: {
            type: Date,
            default: null,
        },

        closedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

ticketSchema.index({
    customerId: 1,
    updatedAt: -1,
});

ticketSchema.index({
    status: 1,
    priority: -1,
    updatedAt: -1,
});

export const Ticket: Model<TicketFields> =
    (models.Ticket as Model<TicketFields> | undefined) ??
    model<TicketFields>("Ticket", ticketSchema);
