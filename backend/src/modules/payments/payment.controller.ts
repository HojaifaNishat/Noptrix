import type { Request, Response, NextFunction } from "express";

import { getCustomerPayment, listCustomerPayments } from "./payment.service";

import { initiateCustomerPayment } from "./payment.service";

const getPage = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

export async function initiatePaymentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const customerId = req.userAuth?.userId;

    if (!customerId) {
      res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
      return;
    }

    const orderId =
      typeof req.body?.orderId === "string" ? req.body.orderId : "";

    const idempotencyKey = req.header("Idempotency-Key") ?? "";

    const result = await initiateCustomerPayment({
      customerId,
      orderId,
      method: req.body?.method,
      idempotencyKey,
    });

    res.status(result.reused ? 200 : 201).json({
      success: true,
      data: result.payment,
      reused: result.reused,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyPayments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const customerId = req.userAuth?.userId;

    if (!customerId) {
      res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
      return;
    }

    const result = await listCustomerPayments(
      customerId,
      getPage(req.query.page, 1),
      getPage(req.query.limit, 20),
    );

    res.status(200).json({
      success: true,
      data: result.payments,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyPaymentByTransactionId(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const customerId = req.userAuth?.userId;

    if (!customerId) {
      res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
      return;
    }

    const payment = await getCustomerPayment(
      customerId,
      String(req.params.transactionId ?? ""),
    );

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}
