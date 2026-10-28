import type { Request, Response, NextFunction } from "express";

import { ShippingService } from "./shipping.service";
import {
  createShippingSchema,
  updateShippingStatusSchema,
  assignShippingRiderSchema,
  shippingIdSchema,
  trackingNumberSchema,
  listShippingSchema,
} from "./shipping.validator";

function sendError(error: unknown, res: Response, next: NextFunction) {
  if (
    error instanceof Error &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  return next(error);
}

function getActorId(req: Request): string | undefined {
  const user = (
    req as Request & {
      user?: { id?: string; _id?: string };
    }
  ).user;

  return user?.id ?? user?._id;
}

export class ShippingController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createShippingSchema.parse({ body: req.body });

      const shipment = await ShippingService.create(
        parsed.body,
        getActorId(req),
      );

      return res.status(201).json({
        success: true,
        message: "Shipment created successfully",
        data: shipment,
      });
    } catch (error) {
      return sendError(error, res, next);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = shippingIdSchema.parse({ params: req.params });
      const shipment = await ShippingService.getById(parsed.params.id);

      return res.status(200).json({
        success: true,
        data: shipment,
      });
    } catch (error) {
      return sendError(error, res, next);
    }
  }

  static async track(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = trackingNumberSchema.parse({
        params: req.params,
      });

      const shipment = await ShippingService.track(
        parsed.params.trackingNumber,
      );

      return res.status(200).json({
        success: true,
        data: shipment,
      });
    } catch (error) {
      return sendError(error, res, next);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateShippingStatusSchema.parse({
        params: req.params,
        body: req.body,
      });

      const shipment = await ShippingService.updateStatus(
        parsed.params.id,
        parsed.body,
      );

      return res.status(200).json({
        success: true,
        message: "Shipment status updated",
        data: shipment,
      });
    } catch (error) {
      return sendError(error, res, next);
    }
  }

  static async assignRider(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = assignShippingRiderSchema.parse({
        params: req.params,
        body: req.body,
      });

      const shipment = await ShippingService.assignRider(
        parsed.params.id,
        parsed.body.riderId,
      );

      return res.status(200).json({
        success: true,
        message: "Rider assigned successfully",
        data: shipment,
      });
    } catch (error) {
      return sendError(error, res, next);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = shippingIdSchema.parse({
        params: req.params,
      });

      const reason =
        typeof req.body?.reason === "string"
          ? req.body.reason.trim()
          : "Cancelled by administrator";

      if (!reason || reason.length > 500) {
        return res.status(400).json({
          success: false,
          message: "Cancellation reason must be between 1 and 500 characters",
        });
      }

      const shipment = await ShippingService.cancel(parsed.params.id, reason);

      return res.status(200).json({
        success: true,
        message: "Shipment cancelled",
        data: shipment,
      });
    } catch (error) {
      return sendError(error, res, next);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = listShippingSchema.parse({
        query: req.query,
      });

      const result = await ShippingService.list(parsed.query);

      return res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      return sendError(error, res, next);
    }
  }
}
