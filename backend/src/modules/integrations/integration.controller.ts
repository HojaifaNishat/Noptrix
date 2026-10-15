import type {
    Request,
    Response,
    NextFunction,
} from "express";

import {
    createIntegrationSchema,
    integrationIdSchema,
    listIntegrationsSchema,
    updateIntegrationSchema,
} from "./integration.validator";

import {
    createIntegration,
    deleteIntegration,
    getIntegrationById,
    IntegrationServiceError,
    listIntegrations,
    updateIntegration,
} from "./integration.service";

function actorIdFromRequest(req: Request): string | undefined {
    return req.ownerAuth?.ownerId
        ? String(req.ownerAuth.ownerId)
        : req.adminAuth?.adminId
            ? String(req.adminAuth.adminId)
            : undefined;
}

function handleServiceError(
    error: unknown,
    res: Response,
    next: NextFunction,
): void {
    if (error instanceof IntegrationServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
            code: error.code,
        });
        return;
    }

    next(error);
}

export async function listIntegrationsController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const parsed = listIntegrationsSchema.safeParse(req.query);

        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: "Invalid integration filters.",
                errors: parsed.error.issues,
            });
            return;
        }

        const result = await listIntegrations(parsed.data);

        res.status(200).json({
            success: true,
            message: "Integrations retrieved successfully.",
            data: result.items,
            pagination: result.pagination,
        });
    } catch (error) {
        handleServiceError(error, res, next);
    }
}

export async function getIntegrationController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const parsed = integrationIdSchema.safeParse(req.params);

        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: "Invalid integration ID.",
                errors: parsed.error.issues,
            });
            return;
        }

        const result = await getIntegrationById(parsed.data.id);

        res.status(200).json({
            success: true,
            message: "Integration retrieved successfully.",
            data: result,
        });
    } catch (error) {
        handleServiceError(error, res, next);
    }
}

export async function createIntegrationController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const parsed = createIntegrationSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: "Invalid integration payload.",
                errors: parsed.error.issues,
            });
            return;
        }

        const result = await createIntegration(
            parsed.data,
            actorIdFromRequest(req),
        );

        res.status(201).json({
            success: true,
            message: "Integration created successfully.",
            data: result,
        });
    } catch (error) {
        handleServiceError(error, res, next);
    }
}

export async function updateIntegrationController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const id = integrationIdSchema.safeParse(req.params);
        const body = updateIntegrationSchema.safeParse(req.body);

        if (!id.success || !body.success) {
            res.status(400).json({
                success: false,
                message: "Invalid integration update payload.",
                errors: [
                    ...(!id.success ? id.error.issues : []),
                    ...(!body.success ? body.error.issues : []),
                ],
            });
            return;
        }

        const result = await updateIntegration(
            id.data.id,
            body.data,
            actorIdFromRequest(req),
        );

        res.status(200).json({
            success: true,
            message: "Integration updated successfully.",
            data: result,
        });
    } catch (error) {
        handleServiceError(error, res, next);
    }
}

export async function deleteIntegrationController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const parsed = integrationIdSchema.safeParse(req.params);

        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: "Invalid integration ID.",
                errors: parsed.error.issues,
            });
            return;
        }

        await deleteIntegration(parsed.data.id);

        res.status(200).json({
            success: true,
            message: "Integration deleted successfully.",
        });
    } catch (error) {
        handleServiceError(error, res, next);
    }
}
