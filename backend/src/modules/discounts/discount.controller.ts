import type { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createDiscount,
  deleteDiscount,
  getDiscountById,
  listDiscounts,
  listPublicDiscounts,
  updateDiscount,
} from "./discount.service";

function getActorId(req: Request): string | undefined {
  const user = (
    req as Request & {
      user?: { _id?: unknown; id?: unknown; userId?: unknown };
    }
  ).user;

  const id = user?._id ?? user?.id ?? user?.userId;
  return id == null ? undefined : String(id);
}

function getParam(req: Request, name: string): string {
  const value = req.params[name];

  if (typeof value !== "string" || !value.trim()) {
    throw ApiError.badRequest(`Invalid ${name}`);
  }

  return value;
}

export const createDiscountController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await createDiscount(req.body, getActorId(req));
    res.status(201).json({ success: true, message: "Discount created", data });
  },
);

export const listDiscountsController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await listDiscounts({
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20),
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,
      status:
        req.query.status === "ACTIVE" || req.query.status === "INACTIVE"
          ? req.query.status
          : undefined,
      type:
        req.query.type === "PERCENTAGE" || req.query.type === "FIXED"
          ? req.query.type
          : undefined,
    });

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  },
);

export const listPublicDiscountsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const data = await listPublicDiscounts();
    res.json({ success: true, data });
  },
);

export const getDiscountController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getDiscountById(getParam(req, "discountId"));
    res.json({ success: true, data });
  },
);

export const updateDiscountController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await updateDiscount(
      getParam(req, "discountId"),
      req.body,
      getActorId(req),
    );

    res.json({ success: true, message: "Discount updated", data });
  },
);

export const deleteDiscountController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await deleteDiscount(getParam(req, "discountId"));
    res.json({ success: true, message: "Discount deleted", data });
  },
);
