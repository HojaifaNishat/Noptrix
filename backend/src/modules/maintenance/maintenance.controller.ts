import type {
    Request,
    Response,
    NextFunction,
} from "express";

import {
    updateMaintenanceSchema,
} from "./maintenance.validator";

import {
    getMaintenanceState,
    updateMaintenanceState,
} from "./maintenance.service";

function getActorId(req: Request): string | undefined {
    if (req.ownerAuth?.ownerId) {
        return String(req.ownerAuth.ownerId);
    }

    if (req.adminAuth?.adminId) {
        return String(req.adminAuth.adminId);
    }

    return undefined;
}

export async function getMaintenanceController(
    _req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const state = await getMaintenanceState();

        res.status(200).json({
            success: true,
            message: "Maintenance state retrieved successfully.",
            data: state,
        });
    } catch (error) {
        next(error);
    }
}

export async function updateMaintenanceController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const parsed = updateMaintenanceSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: "Invalid maintenance settings.",
                errors: parsed.error.issues,
            });
            return;
        }

        const state = await updateMaintenanceState(
            parsed.data,
            getActorId(req),
        );

        res.status(200).json({
            success: true,
            message: "Maintenance state updated successfully.",
            data: state,
        });
    } catch (error) {
        next(error);
    }
}
