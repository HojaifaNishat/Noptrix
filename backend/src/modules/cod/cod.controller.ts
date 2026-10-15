import type { Request, Response, NextFunction } from "express";

import {
    getMyCodRecord,
    listMyCodRecords,
} from "./cod.service";
import { ApiError } from "../../utils/ApiError";

function getCustomerId(req: Request): string {
    const userId = req.userAuth?.userId;

    if (!userId) {
        throw ApiError.unauthorized("Authentication is required.");
    }

    return userId;
}

function parsePositiveInteger(
    value: unknown,
    fallback: number,
): number {
    if (typeof value !== "string" || !/^\d+$/.test(value)) {
        return fallback;
    }

    const parsed = Number(value);

    return Number.isSafeInteger(parsed) && parsed > 0
        ? parsed
        : fallback;
}

export async function getMyCodRecords(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const result = await listMyCodRecords(
            getCustomerId(req),
            parsePositiveInteger(req.query.page, 1),
            parsePositiveInteger(req.query.limit, 20),
        );

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

export async function getMyCodRecordById(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const rawRecordId = req.params.recordId;

        if (typeof rawRecordId !== "string") {
            throw ApiError.badRequest("COD record ID is invalid.");
        }

        const record = await getMyCodRecord(
            getCustomerId(req),
            rawRecordId,
        );

        res.status(200).json({
            success: true,
            data: record,
        });
    } catch (error) {
        next(error);
    }
}
