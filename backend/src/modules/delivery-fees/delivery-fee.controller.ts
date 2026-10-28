import type { Request, Response, NextFunction } from "express";

import { DeliveryFeeService } from "./delivery-fee.service";
import {
  createDeliveryFeeSchema,
  updateDeliveryFeeSchema,
  deliveryFeeIdSchema,
  deliveryFeeSlugSchema,
  listDeliveryFeesSchema,
  calculateDeliveryFeeSchema,
} from "./delivery-fee.validator";

function actorId(req: Request): string | undefined {
  const user = (
    req as Request & {
      user?: { id?: string; _id?: string };
    }
  ).user;

  return user?.id ?? user?._id;
}

function sendError(
  error: unknown,
  next: NextFunction,
): { statusCode: number; message: string } | undefined {
  if (
    error instanceof Error &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return {
      statusCode: error.statusCode,
      message: error.message,
    };
  }

  next(error);
  return undefined;
}

export class DeliveryFeeController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createDeliveryFeeSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed.",
          errors: parsed.error.flatten(),
        });
      }

      const fee = await DeliveryFeeService.create(parsed.data, actorId(req));

      return res.status(201).json({
        success: true,
        message: "Delivery fee rule created successfully.",
        data: fee,
      });
    } catch (error) {
      const known = sendError(error, next);
      if (known) {
        return res.status(known.statusCode).json({
          success: false,
          message: known.message,
        });
      }
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = listDeliveryFeesSchema.safeParse(req.query);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters.",
          errors: parsed.error.flatten(),
        });
      }

      const result = await DeliveryFeeService.list(parsed.data);

      return res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = deliveryFeeIdSchema.safeParse(req.params);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid delivery fee ID.",
        });
      }

      const fee = await DeliveryFeeService.getById(parsed.data.id);

      return res.status(200).json({ success: true, data: fee });
    } catch (error) {
      return next(error);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = deliveryFeeSlugSchema.safeParse(req.params);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid delivery fee slug.",
        });
      }

      const fee = await DeliveryFeeService.getBySlug(parsed.data.slug);

      return res.status(200).json({ success: true, data: fee });
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const params = deliveryFeeIdSchema.safeParse(req.params);
      const body = updateDeliveryFeeSchema.safeParse(req.body);

      if (!params.success || !body.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid delivery fee update.",
          errors: !params.success
            ? params.error.flatten()
            : body.success
              ? undefined
              : body.error.flatten(),
        });
      }

      const fee = await DeliveryFeeService.update(
        params.data.id,
        body.data,
        actorId(req),
      );

      return res.status(200).json({
        success: true,
        message: "Delivery fee rule updated successfully.",
        data: fee,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async setStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const params = deliveryFeeIdSchema.safeParse(req.params);
      const body = req.body as { status?: unknown };

      if (
        !params.success ||
        (body.status !== "active" && body.status !== "inactive")
      ) {
        return res.status(400).json({
          success: false,
          message: "Provide a valid ID and status.",
        });
      }

      const fee = await DeliveryFeeService.setStatus(
        params.data.id,
        body.status,
        actorId(req),
      );

      return res.status(200).json({
        success: true,
        message: "Delivery fee status updated.",
        data: fee,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = deliveryFeeIdSchema.safeParse(req.params);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid delivery fee ID.",
        });
      }

      const result = await DeliveryFeeService.remove(parsed.data.id);

      return res.status(200).json({
        success: true,
        message: "Delivery fee rule deleted successfully.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async calculate(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = calculateDeliveryFeeSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid delivery fee calculation input.",
          errors: parsed.error.flatten(),
        });
      }

      const result = await DeliveryFeeService.calculate(parsed.data);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}
