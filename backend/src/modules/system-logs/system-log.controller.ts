import type {
    Request,
    Response,
    NextFunction,
} from "express";

import {
    listSystemLogsSchema,
} from "./system-log.validator";

import {
    listSystemLogs,
} from "./system-log.service";

export async function listSystemLogsController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const parsed = listSystemLogsSchema.safeParse(req.query);

        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: "Invalid system log filters.",
                errors: parsed.error.issues,
            });
            return;
        }

        const result = await listSystemLogs(parsed.data);

        res.status(200).json({
            success: true,
            message: "System logs retrieved successfully.",
            data: result.items,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
}
