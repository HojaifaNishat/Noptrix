import type { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createInvoice,
  getInvoiceById,
  listInvoices,
  updateInvoiceStatus,
} from "./invoice.service";

function getParam(req: Request, key: string): string {
  const value = req.params[key];

  if (typeof value !== "string" || !value.trim()) {
    throw ApiError.badRequest(`Invalid ${key}`);
  }

  return value;
}

function getActorId(req: Request): string | undefined {
  const user = (
    req as Request & {
      user?: { _id?: unknown; id?: unknown; userId?: unknown };
    }
  ).user;

  const id = user?._id ?? user?.id ?? user?.userId;
  return id == null ? undefined : String(id);
}

export const createInvoiceController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await createInvoice(req.body, getActorId(req));

    res.status(201).json({
      success: true,
      message: "Invoice created",
      data,
    });
  },
);

export const listInvoicesController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await listInvoices({
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20),
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,
      status:
        typeof req.query.status === "string"
          ? (req.query.status as
              "DRAFT" | "ISSUED" | "PAID" | "VOID" | "OVERDUE")
          : undefined,
      customerId:
        typeof req.query.customerId === "string"
          ? req.query.customerId
          : undefined,
    });

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  },
);

export const getInvoiceController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getInvoiceById(getParam(req, "invoiceId"));
    res.json({ success: true, data });
  },
);

export const updateInvoiceStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await updateInvoiceStatus(
      getParam(req, "invoiceId"),
      req.body.status,
    );

    res.json({ success: true, message: "Invoice status updated", data });
  },
);
