import { z } from "zod";
import { VACANCY_STATUSES } from "./vacancy.model";

export const createVacancySchema = z.object({
    title: z.string().trim().min(1).max(150),
    slug: z.string().trim().min(1).lowercase(),
    department: z.string().trim().min(1),
    location: z.string().trim().min(1),
    employmentType: z.string().trim().min(1),
    description: z.string().trim().min(10),
    requirements: z.array(z.string().trim().min(1)).min(1),
    status: z.enum([
        VACANCY_STATUSES.DRAFT,
        VACANCY_STATUSES.PUBLISHED,
        VACANCY_STATUSES.CLOSED,
    ]).optional(),
});

export const updateVacancySchema = createVacancySchema.partial();

export type CreateVacancyInput = z.infer<typeof createVacancySchema>;
export type UpdateVacancyInput = z.infer<typeof updateVacancySchema>;
