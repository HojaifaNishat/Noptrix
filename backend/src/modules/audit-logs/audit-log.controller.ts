import type {
    Request,
    Response,
    NextFunction,
} from "express";

import { Types } from "mongoose";

import {
    listAuditLogsSchema,
    auditLogIdSchema,
} from "./audit-log.validator";

import {
    getAuditLogById,
    listAuditLogs,
} from "./audit-log.service";

export async function listAuditLogsController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const parsed = listAuditLogsSchema.safeParse(req.query);

        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: "Invalid audit log filters.",
                errors: parsed.error.issues,
            });
            return;
        }

        const result = await listAuditLogs(parsed.data);

        res.status(200).json({
            success: true,
            message: "Audit logs retrieved successfully.",
            data: result.items,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
}

export async function getAuditLogByIdController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const parsed = auditLogIdSchema.safeParse(req.params);

        if (!parsed.success || !Types.ObjectId.isValid(parsed.data.id)) {
            res.status(400).json({
                success: false,
                message: "Invalid audit log ID.",
            });
            return;
        }

        const item = await getAuditLogById(parsed.data.id);

        if (!item) {
            res.status(404).json({
                success: false,
                message: "Audit log not found.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Audit log retrieved successfully.",
            data: item,
        });
    } catch (error) {
        next(error);
    }
}
