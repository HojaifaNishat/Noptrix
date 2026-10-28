import type { Request, Response, NextFunction } from "express";

import { DeliveryZoneService } from "./delivery-zone.service";

import {
  createDeliveryZoneSchema,
  updateDeliveryZoneSchema,
  deliveryZoneIdSchema,
  deliveryZoneSlugSchema,
  listDeliveryZonesSchema,
  checkDeliveryZoneSchema,
} from "./delivery-zone.validator";

function getActorId(req: Request): string | undefined {
  const user = (
    req as Request & {
      user?: { id?: string; _id?: string };
    }
  ).user;

  return user?.id ?? user?._id;
}

function handleError(error: unknown, res: Response, next: NextFunction) {
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

export class DeliveryZoneController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createDeliveryZoneSchema.parse({
        body: req.body,
      });

      const zone = await DeliveryZoneService.create(
        parsed.body,
        getActorId(req),
      );

      return res.status(201).json({
        success: true,
        message: "Delivery zone created",
        data: zone,
      });
    } catch (error) {
      return handleError(error, res, next);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = deliveryZoneIdSchema.parse({
        params: req.params,
      });

      const zone = await DeliveryZoneService.getById(parsed.params.id);

      return res.status(200).json({
        success: true,
        data: zone,
      });
    } catch (error) {
      return handleError(error, res, next);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = deliveryZoneSlugSchema.parse({
        params: req.params,
      });

      const zone = await DeliveryZoneService.getBySlug(parsed.params.slug);

      if (zone.status !== "active") {
        return res.status(404).json({
          success: false,
          message: "Delivery zone not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: zone,
      });
    } catch (error) {
      return handleError(error, res, next);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateDeliveryZoneSchema.parse({
        params: req.params,
        body: req.body,
      });

      const zone = await DeliveryZoneService.update(
        parsed.params.id,
        parsed.body,
        getActorId(req),
      );

      return res.status(200).json({
        success: true,
        message: "Delivery zone updated",
        data: zone,
      });
    } catch (error) {
      return handleError(error, res, next);
    }
  }

  static async setStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = deliveryZoneIdSchema.parse({
        params: req.params,
      });

      const status = req.body?.status as "active" | "inactive";

      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be active or inactive",
        });
      }

      const zone = await DeliveryZoneService.setStatus(
        parsed.params.id,
        status,
        getActorId(req),
      );

      return res.status(200).json({
        success: true,
        message: "Delivery zone status updated",
        data: zone,
      });
    } catch (error) {
      return handleError(error, res, next);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = deliveryZoneIdSchema.parse({
        params: req.params,
      });

      await DeliveryZoneService.remove(parsed.params.id);

      return res.status(200).json({
        success: true,
        message: "Delivery zone deleted",
      });
    } catch (error) {
      return handleError(error, res, next);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = listDeliveryZonesSchema.parse({
        query: req.query,
      });

      const result = await DeliveryZoneService.list(parsed.query);

      return res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      return handleError(error, res, next);
    }
  }

  static async checkAvailability(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const parsed = checkDeliveryZoneSchema.parse({
        query: req.query,
      });

      const result = await DeliveryZoneService.checkAvailability(parsed.query);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return handleError(error, res, next);
    }
  }
}
