import type { RequestHandler } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import {
    createTicket,
    listCustomerTickets,
    listAllTickets,
    getTicket,
    replyToTicket,
    updateTicket,
    assignTicket,
    closeCustomerTicket,
} from "./ticket.service";
import {
    createTicketSchema,
    ticketIdParamSchema,
    ticketMessageSchema,
    updateTicketSchema,
    assignTicketSchema,
    ticketListQuerySchema,
} from "./ticket.validator";
import { TICKET_AUTHOR_TYPES } from "./ticket.types";

function parseOrThrow<T>(
    schema: { parse: (value: unknown) => T },
    value: unknown,
): T {
    return schema.parse(value);
}

function userId(req: Parameters<RequestHandler>[0]): string {
    const id = req.userAuth?.userId;

    if (!id) {
        throw new Error("Authenticated customer context missing.");
    }

    return id;
}

function adminActor(req: Parameters<RequestHandler>[0]) {
    const auth = req.adminAuth;

    if (!auth?.adminId) {
        throw new Error("Authenticated staff context missing.");
    }

    const isOwner = auth.role?.toUpperCase() === "OWNER";

    return {
        id: auth.adminId,
        type: isOwner
            ? TICKET_AUTHOR_TYPES.OWNER
            : TICKET_AUTHOR_TYPES.ADMIN,
    } as const;
}

export const createTicketController: RequestHandler =
    asyncHandler(async (req, res) => {
        const input = parseOrThrow(createTicketSchema, req.body);
        const ticket = await createTicket(userId(req), input);

        res.status(201).json({
            success: true,
            message: "Support ticket created.",
            data: ticket,
        });
    });

export const listCustomerTicketsController: RequestHandler =
    asyncHandler(async (req, res) => {
        const query = parseOrThrow(ticketListQuerySchema, req.query);
        const result = await listCustomerTickets(userId(req), query);

        res.status(200).json({
            success: true,
            message: "Your tickets retrieved.",
            data: result.items,
            meta: result.pagination,
        });
    });

export const getCustomerTicketController: RequestHandler =
    asyncHandler(async (req, res) => {
        const params = parseOrThrow(ticketIdParamSchema, req.params);
        const result = await getTicket(params.ticketId, {
            id: userId(req),
            type: TICKET_AUTHOR_TYPES.CUSTOMER,
        });

        res.status(200).json({
            success: true,
            message: "Ticket retrieved.",
            data: result,
        });
    });

export const customerReplyController: RequestHandler =
    asyncHandler(async (req, res) => {
        const params = parseOrThrow(ticketIdParamSchema, req.params);
        const input = parseOrThrow(ticketMessageSchema, req.body);

        const ticket = await replyToTicket(
            params.ticketId,
            {
                id: userId(req),
                type: TICKET_AUTHOR_TYPES.CUSTOMER,
            },
            input.message,
        );

        res.status(201).json({
            success: true,
            message: "Reply added.",
            data: ticket,
        });
    });

export const closeCustomerTicketController: RequestHandler =
    asyncHandler(async (req, res) => {
        const params = parseOrThrow(ticketIdParamSchema, req.params);
        const ticket = await closeCustomerTicket(
            params.ticketId,
            userId(req),
        );

        res.status(200).json({
            success: true,
            message: "Ticket closed.",
            data: ticket,
        });
    });

export const listAdminTicketsController: RequestHandler =
    asyncHandler(async (req, res) => {
        const query = parseOrThrow(ticketListQuerySchema, req.query);
        const result = await listAllTickets(query);

        res.status(200).json({
            success: true,
            message: "Ticket inbox retrieved.",
            data: result.items,
            meta: result.pagination,
        });
    });

export const getAdminTicketController: RequestHandler =
    asyncHandler(async (req, res) => {
        const params = parseOrThrow(ticketIdParamSchema, req.params);
        const result = await getTicket(params.ticketId, adminActor(req));

        res.status(200).json({
            success: true,
            message: "Ticket retrieved.",
            data: result,
        });
    });

export const adminReplyController: RequestHandler =
    asyncHandler(async (req, res) => {
        const params = parseOrThrow(ticketIdParamSchema, req.params);
        const input = parseOrThrow(ticketMessageSchema, req.body);
        const ticket = await replyToTicket(
            params.ticketId,
            adminActor(req),
            input.message,
        );

        res.status(201).json({
            success: true,
            message: "Staff reply added.",
            data: ticket,
        });
    });

export const adminInternalNoteController: RequestHandler =
    asyncHandler(async (req, res) => {
        const params = parseOrThrow(ticketIdParamSchema, req.params);
        const input = parseOrThrow(ticketMessageSchema, req.body);
        const ticket = await replyToTicket(
            params.ticketId,
            adminActor(req),
            input.message,
            true,
        );

        res.status(201).json({
            success: true,
            message: "Internal note added.",
            data: ticket,
        });
    });

export const updateTicketController: RequestHandler =
    asyncHandler(async (req, res) => {
        const params = parseOrThrow(ticketIdParamSchema, req.params);
        const input = parseOrThrow(updateTicketSchema, req.body);
        const ticket = await updateTicket(params.ticketId, input);

        res.status(200).json({
            success: true,
            message: "Ticket updated.",
            data: ticket,
        });
    });

export const assignTicketController: RequestHandler =
    asyncHandler(async (req, res) => {
        const params = parseOrThrow(ticketIdParamSchema, req.params);
        const input = parseOrThrow(assignTicketSchema, req.body);
        const actor = adminActor(req);

        const ticket = await assignTicket(
            params.ticketId,
            input.assigneeType === "OWNER"
                ? { type: "OWNER", id: actor.id }
                : { type: "ADMIN", id: input.adminId },
        );

        res.status(200).json({
            success: true,
            message: "Ticket assigned.",
            data: ticket,
        });
    });
