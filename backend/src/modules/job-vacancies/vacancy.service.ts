import { JobVacancy, VACANCY_STATUSES } from "./vacancy.model";
import { CreateVacancyInput, UpdateVacancyInput } from "./vacancy.validator";
import { ApiError } from "../../utils/ApiError";
import { Types } from "mongoose";

export const createVacancy = async (input: CreateVacancyInput, adminId: string) => {
    const existing = await JobVacancy.findOne({ slug: input.slug });
    if (existing) {
        throw ApiError.conflict("A vacancy with this slug already exists.", {
            code: "VACANCY_SLUG_EXISTS",
        });
    }

    return JobVacancy.create({
        ...input,
        createdBy: new Types.ObjectId(adminId),
    });
};

export const getPublishedVacancies = async () => {
    return JobVacancy.find({ status: VACANCY_STATUSES.PUBLISHED }).sort({ createdAt: -1 });
};

export const getAllVacanciesForAdmin = async () => {
    return JobVacancy.find().sort({ createdAt: -1 });
};

export const updateVacancy = async (id: string, input: UpdateVacancyInput) => {
    if (!Types.ObjectId.isValid(id)) {
        throw ApiError.badRequest("Invalid vacancy ID.");
    }

    const vacancy = await JobVacancy.findById(id);
    if (!vacancy) {
        throw ApiError.notFound("Job vacancy not found.");
    }

    Object.assign(vacancy, input);
    await vacancy.save();
    return vacancy;
};

export const deleteVacancy = async (id: string) => {
    if (!Types.ObjectId.isValid(id)) {
        throw ApiError.badRequest("Invalid vacancy ID.");
    }

    const vacancy = await JobVacancy.findByIdAndDelete(id);
    if (!vacancy) {
        throw ApiError.notFound("Job vacancy not found.");
    }
    return vacancy;
};
