import type { NextFunction, Request, Response } from "express";
import * as promotionService from "./promotion.service";

function sendError(error: unknown, next: NextFunction, res: Response) {
  const statusCode =
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
      ? error.statusCode
      : undefined;

  if (statusCode) {
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : "Request failed",
    });
    return;
  }

  next(error);
}

function actorId(req: Request): string | undefined {
  const user = req as Request & {
    user?: { id?: string; _id?: string };
    owner?: { id?: string; _id?: string };
  };

  return user.owner?.id ?? user.owner?._id ?? user.user?.id ?? user.user?._id;
}

export async function createPromotion(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const promotion = await promotionService.createPromotion(
      req.body,
      actorId(req),
    );

    res.status(201).json({
      success: true,
      message: "Promotion created successfully",
      data: promotion,
    });
  } catch (error) {
    sendError(error, next, res);
  }
}

export async function getAllPromotions(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await promotionService.getAllPromotions(req.query as never);

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    sendError(error, next, res);
  }
}

export async function getPublicPromotions(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const promotions = await promotionService.getPublicPromotions();

    res.status(200).json({
      success: true,
      data: promotions,
    });
  } catch (error) {
    sendError(error, next, res);
  }
}

export async function getPromotionById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const promotion = await promotionService.getPromotionById(
      req.params.promotionId as string,
    );

    res.status(200).json({ success: true, data: promotion });
  } catch (error) {
    sendError(error, next, res);
  }
}

export async function getPromotionBySlug(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const promotion = await promotionService.getPromotionBySlug(
      req.params.slug as string,
    );

    res.status(200).json({ success: true, data: promotion });
  } catch (error) {
    sendError(error, next, res);
  }
}

export async function updatePromotion(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const promotion = await promotionService.updatePromotion(
      req.params.promotionId as string,
      req.body,
      actorId(req),
    );

    res.status(200).json({
      success: true,
      message: "Promotion updated successfully",
      data: promotion,
    });
  } catch (error) {
    sendError(error, next, res);
  }
}

export async function changePromotionStatus(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const promotion = await promotionService.changePromotionStatus(
      req.params.promotionId as string,
      req.body.status,
      actorId(req),
    );

    res.status(200).json({
      success: true,
      message: "Promotion status updated successfully",
      data: promotion,
    });
  } catch (error) {
    sendError(error, next, res);
  }
}

export async function deletePromotion(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await promotionService.deletePromotion(
      req.params.promotionId as string,
    );

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    sendError(error, next, res);
  }
}
