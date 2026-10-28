import type { Request, Response, NextFunction } from "express";

import { listActivityLogsSchema } from "./activity-log.validator";

import { listActivityLogs } from "./activity-log.service";

export async function listActivityLogsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = listActivityLogsSchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid activity log filters.",
        errors: parsed.error.issues,
      });
      return;
    }

    const result = await listActivityLogs(parsed.data);

    res.status(200).json({
      success: true,
      message: "Activity logs retrieved successfully.",
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}
