import type { Request, Response, NextFunction } from "express";

import {
  getPublicPaymentMethods,
  listPaymentMethods,
  updatePaymentMethod,
} from "./payment-method.service";

import {
  paymentMethodListQuerySchema,
  paymentMethodParamsSchema,
  updatePaymentMethodSchema,
} from "./payment-method.validator";

export async function getPaymentMethods(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getPublicPaymentMethods();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminPaymentMethods(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsedQuery = paymentMethodListQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters.",
        errors: parsedQuery.error.issues,
      });
      return;
    }

    const includeDisabled = parsedQuery.data.includeDisabled === "true";

    const methods = await listPaymentMethods(includeDisabled);

    res.status(200).json({
      success: true,
      data: { methods },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminPaymentMethod(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsedParams = paymentMethodParamsSchema.safeParse(req.params);

    if (!parsedParams.success) {
      res.status(400).json({
        success: false,
        message: "Invalid payment method ID.",
        errors: parsedParams.error.issues,
      });
      return;
    }

    const parsedBody = updatePaymentMethodSchema.safeParse(req.body);

    if (!parsedBody.success) {
      res.status(400).json({
        success: false,
        message: "Invalid payment method data.",
        errors: parsedBody.error.issues,
      });
      return;
    }

    const method = await updatePaymentMethod(
      parsedParams.data.methodId,
      parsedBody.data,
    );

    res.status(200).json({
      success: true,
      message: "Payment method updated successfully.",
      data: { method },
    });
  } catch (error) {
    next(error);
  }
}
