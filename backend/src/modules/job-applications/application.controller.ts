import {
    Request,
    Response,
} from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
    submitApplication,
    getAllApplications,
    getApplicationById,
    updateApplicationStatus,
    deleteApplication,
} from "./application.service";
import type {
    CreateApplicationInput,
    UpdateApplicationStatusInput,
    ApplicationIdParam,
} from "./application.validator";

const sanitizeApp = (app: any) => {
    return typeof app.toObject ===
        "function"
        ? app.toObject()
        : { ...app };
};

export const submitApplicationController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {
            const input =
                req.body as CreateApplicationInput;
            const application =
                await submitApplication(
                    input
                );

            res.status(201).json({
                success: true,
                message:
                    "Application submitted successfully.",
                data: sanitizeApp(
                    application
                ),
            });
        }
    );

export const getAllApplicationsController =
    asyncHandler(
        async (
            _req: Request,
            res: Response
        ) => {
            const applications =
                await getAllApplications();

            res.status(200).json({
                success: true,
                message:
                    "Job applications retrieved successfully.",
                data: applications.map(
                    sanitizeApp
                ),
            });
        }
    );

export const getApplicationController =
    asyncHandler(
        async (
            req: Request<
                ApplicationIdParam
            >,
            res: Response
        ) => {
            const application =
                await getApplicationById(
                    req.params.id
                );

            res.status(200).json({
                success: true,
                message:
                    "Job application retrieved successfully.",
                data: sanitizeApp(
                    application
                ),
            });
        }
    );

export const updateApplicationStatusController =
    asyncHandler(
        async (
            req: Request<
                ApplicationIdParam,
                unknown,
                UpdateApplicationStatusInput
            >,
            res: Response
        ) => {
            const {
                status,
                notes,
            } = req.body;
            const updated =
                await updateApplicationStatus(
                    req.params.id,
                    status,
                    notes
                );

            res.status(200).json({
                success: true,
                message:
                    "Application status updated successfully.",
                data: sanitizeApp(
                    updated
                ),
            });
        }
    );

export const deleteApplicationController =
    asyncHandler(
        async (
            req: Request<
                ApplicationIdParam
            >,
            res: Response
        ) => {
            await deleteApplication(
                req.params.id
            );

            res.status(200).json({
                success: true,
                message:
                    "Job application deleted successfully.",
            });
        }
    );
