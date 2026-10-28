import type { Request, Response, NextFunction } from "express";

import { getMaintenanceState } from "./maintenance.service";

const EXEMPT_PATHS = ["/health", "/maintenance"];

function isExemptPath(path: string): boolean {
  return EXEMPT_PATHS.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export async function maintenanceModeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Allow preflight requests and essential operational endpoints.
  if (req.method === "OPTIONS" || isExemptPath(req.path)) {
    next();
    return;
  }

  try {
    const state = await getMaintenanceState();

    if (!state.enabled) {
      next();
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Retry-After", "300");

    res.status(503).json({
      success: false,
      code: "MAINTENANCE_MODE",
      message: state.message,
      data: {
        maintenance: true,
        startsAt: state.startsAt ?? null,
        endsAt: state.endsAt ?? null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Do not silently allow requests when the maintenance
    // state cannot be read. Forward the failure to error handling.
    next(error);
  }
}
