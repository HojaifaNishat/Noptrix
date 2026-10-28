import type { Request, Response, NextFunction } from "express";

import {
  getCustomerTransaction,
  listAllTransactions,
  listCustomerTransactions,
} from "./transaction.service";

import {
  transactionIdParamsSchema,
  transactionListQuerySchema,
} from "./transaction.validator";
import type { TransactionListQuery } from "./transaction.types";

export const getMyTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const customerId = req.userAuth?.userId;

    if (!customerId) {
      res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
      return;
    }

    const parsed = transactionListQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid transaction query.",
        errors: parsed.error.issues,
      });
      return;
    }

    const result = await listCustomerTransactions(
      customerId,
      parsed.data.page,
      parsed.data.limit,
    );

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTransactionById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const customerId = req.userAuth?.userId;

    if (!customerId) {
      res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
      return;
    }

    const parsed = transactionIdParamsSchema.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid transaction ID.",
        errors: parsed.error.issues,
      });
      return;
    }

    const transaction = await getCustomerTransaction(
      customerId,
      parsed.data.transactionId,
    );

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parsed = transactionListQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid transaction query.",
        errors: parsed.error.issues,
      });
      return;
    }

    const query: TransactionListQuery = {
      page: parsed.data.page,
      limit: parsed.data.limit,
      ...(parsed.data.type ? { type: parsed.data.type } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.orderId ? { orderId: parsed.data.orderId } : {}),
      ...(parsed.data.paymentId ? { paymentId: parsed.data.paymentId } : {}),
      ...(parsed.data.provider ? { provider: parsed.data.provider } : {}),
      ...(parsed.data.from ? { from: new Date(parsed.data.from) } : {}),
      ...(parsed.data.to ? { to: new Date(parsed.data.to) } : {}),
    };

    const result = await listAllTransactions(query);

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};
