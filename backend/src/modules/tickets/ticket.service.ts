import { randomBytes } from "node:crypto";
import { Types } from "mongoose";

import { ApiError } from "../../utils/ApiError";
import { Ticket } from "./ticket.model";
import { TicketMessage } from "./ticket-message.model";
import {
    TICKET_STATUSES,
    TICKET_PRIORITIES,
    TICKET_AUTHOR_TYPES,
    type TicketStatus,
    type TicketPriority,
    type TicketAuthorType,
} from "./ticket.types";

const CLOSED_STATUSES: TicketStatus[] = [
    TICKET_STATUSES.RESOLVED,
    TICKET_STATUSES.CLOSED,
];

function objectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
        throw ApiError.badRequest("Invalid ID.");
    }

    return new Types.ObjectId(id);
}

export async function createTicket(
    customerId: string,
    input: {
        subject: string;
        description: string;
        category: string;
    },
) {
    const now = new Date();

    const ticket = await Ticket.create({
        ticketNumber:
            `NPT-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`,
        customerId: objectId(customerId),
        subject: input.subject,
        description: input.description,
        category: input.category.toLowerCase(),
        status: TICKET_STATUSES.OPEN,
        priority: TICKET_PRIORITIES.MEDIUM,
        lastMessageAt: now,
    });

    await TicketMessage.create({
        ticketId: ticket._id,
        authorId: objectId(customerId),
        authorType: TICKET_AUTHOR_TYPES.CUSTOMER,
        message: input.description,
        isInternalNote: false,
    });

    return ticket;
}

export async function listCustomerTickets(
    customerId: string,
    options: {
        page: number;
        limit: number;
        status?: TicketStatus;
        priority?: TicketPriority;
    },
) {
    const filter: Record<string, unknown> = {
        customerId: objectId(customerId),
    };

    if (options.status) filter.status = options.status;
    if (options.priority) filter.priority = options.priority;

    const [items, total] = await Promise.all([
        Ticket.find(filter)
            .sort({ updatedAt: -1 })
            .skip((options.page - 1) * options.limit)
            .limit(options.limit)
            .lean(),
        Ticket.countDocuments(filter),
    ]);

    return {
        items,
        pagination: {
            page: options.page,
            limit: options.limit,
            total,
            pages: Math.ceil(total / options.limit),
        },
    };
}

export async function listAllTickets(
    options: {
        page: number;
        limit: number;
        status?: TicketStatus;
        priority?: TicketPriority;
    },
) {
    const filter: Record<string, unknown> = {};

    if (options.status) filter.status = options.status;
    if (options.priority) filter.priority = options.priority;

    const [items, total] = await Promise.all([
        Ticket.find(filter)
            .sort({ updatedAt: -1 })
            .skip((options.page - 1) * options.limit)
            .limit(options.limit)
            .populate("customerId", "name email")
            .populate({
                path: "assignedAdminId",
                select: "userId status",
                populate: {
                    path: "userId",
                    select: "name email",
                },
            })
            .populate("assignedOwnerUserId", "name email")
            .lean(),
        Ticket.countDocuments(filter),
    ]);

    return {
        items,
        pagination: {
            page: options.page,
            limit: options.limit,
            total,
            pages: Math.ceil(total / options.limit),
        },
    };
}

export async function getTicket(
    ticketId: string,
    actor: {
        id: string;
        type: TicketAuthorType;
    },
) {
    const filter: Record<string, unknown> = {
        _id: objectId(ticketId),
    };

    if (actor.type === TICKET_AUTHOR_TYPES.CUSTOMER) {
        filter.customerId = objectId(actor.id);
    }

    const ticket = await Ticket.findOne(filter)
        .populate("customerId", "name email")
        .populate({
            path: "assignedAdminId",
            select: "userId status",
            populate: {
                path: "userId",
                select: "name email",
            },
        })
        .populate("assignedOwnerUserId", "name email")
        .lean();

    if (!ticket) {
        throw ApiError.notFound("Ticket not found.");
    }

    const messageFilter: Record<string, unknown> = {
        ticketId: objectId(ticketId),
    };

    // Customers must never see internal staff notes.
    if (actor.type === TICKET_AUTHOR_TYPES.CUSTOMER) {
        messageFilter.isInternalNote = false;
    }

    const messages = await TicketMessage.find(messageFilter)
        .sort({ createdAt: 1 })
        .lean();

    return { ticket, messages };
}

export async function replyToTicket(
    ticketId: string,
    actor: {
        id: string;
        type: TicketAuthorType;
    },
    message: string,
    isInternalNote = false,
) {
    const filter: Record<string, unknown> = {
        _id: objectId(ticketId),
    };

    if (actor.type === TICKET_AUTHOR_TYPES.CUSTOMER) {
        filter.customerId = objectId(actor.id);
    }

    const ticket = await Ticket.findOne(filter);

    if (!ticket) {
        throw ApiError.notFound("Ticket not found.");
    }

    if (CLOSED_STATUSES.includes(ticket.status)) {
        throw ApiError.conflict(
            "This ticket is closed. Reopen it before replying.",
        );
    }

    if (
        isInternalNote &&
        actor.type === TICKET_AUTHOR_TYPES.CUSTOMER
    ) {
        throw ApiError.forbidden("Internal notes are staff-only.");
    }

    await TicketMessage.create({
        ticketId: ticket._id,
        authorId: objectId(actor.id),
        authorType: actor.type,
        message,
        isInternalNote,
    });

    ticket.lastMessageAt = new Date();

    if (actor.type === TICKET_AUTHOR_TYPES.CUSTOMER) {
        ticket.status = TICKET_STATUSES.OPEN;
    } else if (!isInternalNote) {
        ticket.status = TICKET_STATUSES.WAITING_FOR_CUSTOMER;
    }

    await ticket.save();

    return ticket;
}

export async function updateTicket(
    ticketId: string,
    input: {
        status?: TicketStatus;
        priority?: TicketPriority;
    },
) {
    const ticket = await Ticket.findById(objectId(ticketId));

    if (!ticket) {
        throw ApiError.notFound("Ticket not found.");
    }

    if (input.status !== undefined) {
        ticket.status = input.status;

        if (input.status === TICKET_STATUSES.RESOLVED) {
            ticket.resolvedAt = new Date();
            ticket.closedAt = null;
        } else if (input.status === TICKET_STATUSES.CLOSED) {
            ticket.closedAt = new Date();
        } else {
            ticket.resolvedAt = null;
            ticket.closedAt = null;
        }
    }

    if (input.priority !== undefined) {
        ticket.priority = input.priority;
    }

    await ticket.save();
    return ticket;
}

export async function assignTicket(
    ticketId: string,
    assignee:
        | { type: "ADMIN"; id: string }
        | { type: "OWNER"; id: string },
) {
    const ticket = await Ticket.findById(objectId(ticketId));

    if (!ticket) {
        throw ApiError.notFound("Ticket not found.");
    }

    if (assignee.type === "OWNER") {
        const { Owner } = await import("../owners/owner.model.js");

        const owner = await Owner.findOne({
            userId: objectId(assignee.id),
            role: "OWNER",
            status: "ACTIVE",
        }).select("userId");

        if (!owner) {
            throw ApiError.notFound("Active OWNER account not found.");
        }

        ticket.assignedOwnerUserId = owner.userId;
        ticket.assignedAdminId = null;
    } else {
        const { Admin } = await import("../admins/admin.model.js");

        const admin = await Admin.findOne({
            _id: objectId(assignee.id),
            status: "ACTIVE",
        }).select("_id");

        if (!admin) {
            throw ApiError.notFound("Active admin assignee not found.");
        }

        ticket.assignedAdminId = admin._id;
        ticket.assignedOwnerUserId = null;
    }

    await ticket.save();
    return ticket;
}

export async function closeCustomerTicket(
    ticketId: string,
    customerId: string,
) {
    const ticket = await Ticket.findOne({
        _id: objectId(ticketId),
        customerId: objectId(customerId),
    });

    if (!ticket) {
        throw ApiError.notFound("Ticket not found.");
    }

    ticket.status = TICKET_STATUSES.CLOSED;
    ticket.closedAt = new Date();

    await ticket.save();
    return ticket;
}
