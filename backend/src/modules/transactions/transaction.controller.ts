import type { Request, Response, NextFunction } from "express";
import { listCustomerTransactions } from "./transaction.service";

export const getMyTransactions = async (
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

        const rawPage = Number(req.query.page);
        const rawLimit = Number(req.query.limit);

        const result = await listCustomerTransactions(
            customerId,
            Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1,
            Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 20,
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
