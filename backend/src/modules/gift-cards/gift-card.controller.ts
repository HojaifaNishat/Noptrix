import type { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createGiftCard,
  getGiftCardBalance,
  getGiftCardById,
  listGiftCards,
  setGiftCardStatus,
} from "./gift-card.service";

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

export const createGiftCardController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await createGiftCard(req.body, getActorId(req));

    res.status(201).json({
      success: true,
      message: "Gift card created",
      data,
    });
  },
);

export const listGiftCardsController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await listGiftCards({
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20),
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,
      status:
        req.query.status === "ACTIVE" ||
        req.query.status === "INACTIVE" ||
        req.query.status === "DEPLETED"
          ? req.query.status
          : undefined,
    });

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  },
);

export const getGiftCardController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getGiftCardById(getParam(req, "giftCardId"));
    res.json({ success: true, data });
  },
);

export const giftCardBalanceController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getGiftCardBalance(req.body.code);
    res.json({ success: true, data });
  },
);

export const updateGiftCardStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await setGiftCardStatus(
      getParam(req, "giftCardId"),
      req.body.status,
      getActorId(req),
    );

    res.json({ success: true, message: "Gift card status updated", data });
  },
);
