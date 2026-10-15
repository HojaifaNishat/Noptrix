import type { Request, Response, NextFunction } from "express";
import {
    getCustomerPayment,
    listCustomerPayments,
} from "./payment.service";

const getPage = (value: unknown, fallback: number): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0
        ? Math.floor(parsed)
        : fallback;
};

export const getMyPayments = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
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
            data: result.items,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
};

export const getMyPaymentByTransactionId = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
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
};
