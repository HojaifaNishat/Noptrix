import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { getAuthenticatedAdminId } from "../../middlewares/adminAuth.middleware";
import {
    createVacancy,
    getPublishedVacancies,
    getAllVacanciesForAdmin,
    updateVacancy,
    deleteVacancy,
} from "./vacancy.service";
import type {
    CreateVacancyInput,
    UpdateVacancyInput,
} from "./vacancy.validator";

const sanitizeVacancy = (vacancy: any) => {
    return typeof vacancy.toObject === "function" ? vacancy.toObject() : { ...vacancy };
};

export const getPublishedVacanciesController = asyncHandler(async (_req: Request, res: Response) => {
    const vacancies = await getPublishedVacancies();
    res.status(200).json({
        success: true,
        message: "Published vacancies retrieved successfully.",
        data: vacancies.map(sanitizeVacancy),
    });
});

export const getAllVacanciesController = asyncHandler(async (_req: Request, res: Response) => {
    const vacancies = await getAllVacanciesForAdmin();
    res.status(200).json({
        success: true,
        message: "All vacancies retrieved successfully.",
        data: vacancies.map(sanitizeVacancy),
    });
});

export const createVacancyController = asyncHandler(async (req: Request, res: Response) => {
    const adminId = getAuthenticatedAdminId(req) as string;
    const input = req.body as CreateVacancyInput;
    const vacancy = await createVacancy(input, adminId);

    res.status(201).json({
        success: true,
        message: "Job vacancy created successfully.",
        data: sanitizeVacancy(vacancy),
    });
});

export const updateVacancyController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const input = req.body as UpdateVacancyInput;
    const updatedVacancy = await updateVacancy(id, input);

    res.status(200).json({
        success: true,
        message: "Job vacancy updated successfully.",
        data: sanitizeVacancy(updatedVacancy),
    });
});

export const deleteVacancyController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await deleteVacancy(id);

    res.status(200).json({
        success: true,
        message: "Job vacancy deleted successfully.",
    });
});
