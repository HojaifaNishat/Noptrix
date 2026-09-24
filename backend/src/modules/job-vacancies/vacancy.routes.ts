import { Router } from "express";
import { adminAuth, adminSecretVerified, getAuthenticatedAdminId } from "../../middlewares/adminAuth.middleware";
import { requireEmployeePermission } from "../employees/employee-authorization.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
    createVacancy,
    getPublishedVacancies,
    getAllVacanciesForAdmin,
    updateVacancy,
    deleteVacancy,
} from "./vacancy.service";
import { createVacancySchema, updateVacancySchema } from "./vacancy.validator";

const router = Router();

// Public: Get all published job openings (for candidates to see)
router.get(
    "/",
    asyncHandler(async (_req, res) => {
        const vacancies = await getPublishedVacancies();
        res.status(200).json({ success: true, data: vacancies });
    })
);

// Admin: Get all vacancies
router.get(
    "/admin/vacancies",
    adminAuth,
    adminSecretVerified,
    requireEmployeePermission("employees.read"),
    asyncHandler(async (_req, res) => {
        const vacancies = await getAllVacanciesForAdmin();
        res.status(200).json({ success: true, data: vacancies });
    })
);

// Admin: Create vacancy
router.post(
    "/admin/vacancies",
    adminAuth,
    adminSecretVerified,
    requireEmployeePermission("employees.manage"),
    validate(createVacancySchema, "body"),
    asyncHandler(async (req, res) => {
        const rawAdminId = getAuthenticatedAdminId(req);
        const adminId = Array.isArray(rawAdminId) ? rawAdminId[0] : rawAdminId;

        const vacancy = await createVacancy(req.body, adminId);
        res.status(201).json({ success: true, message: "Vacancy created successfully.", data: vacancy });
    })
);

// Admin: Update vacancy
router.patch(
    "/admin/vacancies/:id",
    adminAuth,
    adminSecretVerified,
    requireEmployeePermission("employees.manage"),
    validate(updateVacancySchema, "body"),
    asyncHandler(async (req, res) => {
        const rawId = req.params.id;
        const id = Array.isArray(rawId) ? rawId[0] : rawId;

        const updated = await updateVacancy(id, req.body);
        res.status(200).json({ success: true, message: "Vacancy updated successfully.", data: updated });
    })
);

// Admin: Delete vacancy
router.delete(
    "/admin/vacancies/:id",
    adminAuth,
    adminSecretVerified,
    requireEmployeePermission("employees.manage"),
    asyncHandler(async (req, res) => {
        const rawId = req.params.id;
        const id = Array.isArray(rawId) ? rawId[0] : rawId;

        await deleteVacancy(id);
        res.status(200).json({ success: true, message: "Vacancy deleted successfully." });
    })
);

export default router;
