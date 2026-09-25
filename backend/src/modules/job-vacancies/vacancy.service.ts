import {
    Types,
} from "mongoose";

import {
    Vacancy,
    VacancyStatus,
    VacancyEmploymentType,
    VacancySalaryType,
    VACANCY_STATUSES,
} from "./vacancy.model";

import {
    ApiError,
} from "../../utils/ApiError";

import {
    CreateVacancyInput,
    UpdateVacancyInput,
    UpdateVacancyStatusInput,
    VacancyQueryInput,
} from "./vacancy.validator";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const validateObjectId = (
    value: string,
    fieldName: string,
): Types.ObjectId => {
    if (!Types.ObjectId.isValid(value)) {
        throw ApiError.badRequest(
            `Invalid ${fieldName}.`,
            {
                code: `INVALID_${fieldName
                    .replace(/\s+/g, "_")
                    .toUpperCase()}`,
            },
        );
    }

    return new Types.ObjectId(value);
};

const normalizeSlug = (
    slug: string,
): string => {
    return slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
};


/*
|--------------------------------------------------------------------------
| Creator Validation
|--------------------------------------------------------------------------
*/

const validateCreator = (
    userId: string,
): Types.ObjectId => {
    return validateObjectId(
        userId,
        "creator ID",
    );
};


/*
|--------------------------------------------------------------------------
| Create Vacancy
|--------------------------------------------------------------------------
*/

export const createVacancy = async (
    input: CreateVacancyInput & {
        createdBy: string;
    },
) => {
    const createdBy =
        validateCreator(
            input.createdBy,
        );

    const slug =
        normalizeSlug(
            input.slug,
        );

    if (!slug) {
        throw ApiError.badRequest(
            "A valid vacancy slug is required.",
            {
                code: "INVALID_VACANCY_SLUG",
            },
        );
    }

    const existingSlug =
        await Vacancy.findOne({
            slug,
        })
            .select("_id")
            .lean()
            .exec();

    if (existingSlug) {
        throw ApiError.conflict(
            "A vacancy with this slug already exists.",
            {
                code: "VACANCY_SLUG_EXISTS",
            },
        );
    }

    const existingTitle =
        await Vacancy.findOne({
            title: input.title.trim(),
        })
            .select("_id")
            .lean()
            .exec();

    if (existingTitle) {
        throw ApiError.conflict(
            "A vacancy with this title already exists.",
            {
                code: "VACANCY_TITLE_EXISTS",
            },
        );
    }

    const vacancy =
        await Vacancy.create({
            ...input,

            slug,

            employmentType:
                input.employmentType as VacancyEmploymentType,

            salaryType:
                input.salaryType as VacancySalaryType,

            status:
                (input.status ??
                    VACANCY_STATUSES.DRAFT) as VacancyStatus,

            createdBy,

            updatedBy:
                createdBy,

            publishedAt:
                input.status ===
                VACANCY_STATUSES.OPEN
                    ? new Date()
                    : undefined,
        });

    return vacancy;
};


/*
|--------------------------------------------------------------------------
| Get Vacancy By ID
|--------------------------------------------------------------------------
*/

export const getVacancyById = async (
    vacancyId: string,
) => {
    const _id =
        validateObjectId(
            vacancyId,
            "vacancy ID",
        );

    const vacancy =
        await Vacancy.findById(
            _id,
        )
            .populate(
                "createdBy",
                "name email phone",
            )
            .populate(
                "updatedBy",
                "name email phone",
            )
            .exec();

    if (!vacancy) {
        throw ApiError.notFound(
            "Job vacancy not found.",
            {
                code: "VACANCY_NOT_FOUND",
            },
        );
    }

    return vacancy;
};


/*
|--------------------------------------------------------------------------
| Get Vacancy By Slug
|--------------------------------------------------------------------------
*/

export const getVacancyBySlug = async (
    slug: string,
) => {
    const normalizedSlug =
        normalizeSlug(slug);

    if (!normalizedSlug) {
        throw ApiError.badRequest(
            "A valid vacancy slug is required.",
            {
                code: "INVALID_VACANCY_SLUG",
            },
        );
    }

    const vacancy =
        await Vacancy.findOne({
            slug: normalizedSlug,
        })
            .populate(
                "createdBy",
                "name email phone",
            )
            .populate(
                "updatedBy",
                "name email phone",
            )
            .exec();

    if (!vacancy) {
        throw ApiError.notFound(
            "Job vacancy not found.",
            {
                code: "VACANCY_NOT_FOUND",
            },
        );
    }

    return vacancy;
};


/*
|--------------------------------------------------------------------------
| Get Vacancies
|--------------------------------------------------------------------------
*/

export const getVacancies = async (
    query: VacancyQueryInput,
) => {
    const {
        status,
        department,
        employmentType,
        isRemote,
        search,
        page = 1,
        limit = 20,
    } = query;

    const filter: Record<
        string,
        unknown
    > = {};

    if (status) {
        filter.status =
            status;
    }

    if (department) {
        filter.department =
            department.trim();
    }

    if (employmentType) {
        filter.employmentType =
            employmentType;
    }

    if (isRemote !== undefined) {
        filter.isRemote =
            isRemote;
    }

    if (search?.trim()) {
        const searchRegex =
            new RegExp(
                search.trim(),
                "i",
            );

        filter.$or = [
            {
                title: searchRegex,
            },
            {
                department: searchRegex,
            },
            {
                jobTitle: searchRegex,
            },
            {
                description: searchRegex,
            },
        ];
    }

    const skip =
        (page - 1) * limit;

    const [
        items,
        total,
    ] = await Promise.all([
        Vacancy.find(filter)
            .sort({
                createdAt: -1,
            })
            .skip(skip)
            .limit(limit)
            .populate(
                "createdBy",
                "name email phone",
            )
            .populate(
                "updatedBy",
                "name email phone",
            )
            .exec(),

        Vacancy.countDocuments(
            filter,
        ),
    ]);

    const totalPages =
        Math.ceil(
            total / limit,
        );

    return {
        items,

        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage:
                page < totalPages,
            hasPreviousPage:
                page > 1,
        },
    };
};


/*
|--------------------------------------------------------------------------
| Get Public Vacancies
|--------------------------------------------------------------------------
*/

export const getPublicVacancies = async (
    query: VacancyQueryInput,
) => {
    return getVacancies({
        ...query,

        status:
            VACANCY_STATUSES.OPEN as VacancyStatus,
    });
};


/*
|--------------------------------------------------------------------------
| Update Vacancy
|--------------------------------------------------------------------------
*/

export const updateVacancy = async (
    vacancyId: string,
    input: UpdateVacancyInput,
    updatedBy: string,
) => {
    const _id =
        validateObjectId(
            vacancyId,
            "vacancy ID",
        );

    const updaterId =
        validateObjectId(
            updatedBy,
            "updater ID",
        );

    const vacancy =
        await Vacancy.findById(
            _id,
        ).exec();

    if (!vacancy) {
        throw ApiError.notFound(
            "Job vacancy not found.",
            {
                code: "VACANCY_NOT_FOUND",
            },
        );
    }

    if (input.slug !== undefined) {
        const slug =
            normalizeSlug(
                input.slug,
            );

        if (!slug) {
            throw ApiError.badRequest(
                "A valid vacancy slug is required.",
                {
                    code: "INVALID_VACANCY_SLUG",
                },
            );
        }

        const duplicate =
            await Vacancy.findOne({
                slug,
                _id: {
                    $ne: _id,
                },
            })
                .select("_id")
                .lean()
                .exec();

        if (duplicate) {
            throw ApiError.conflict(
                "A vacancy with this slug already exists.",
                {
                    code: "VACANCY_SLUG_EXISTS",
                },
            );
        }

        vacancy.slug =
            slug;
    }

    if (input.title !== undefined) {
        const title =
            input.title.trim();

        const duplicate =
            await Vacancy.findOne({
                title,
                _id: {
                    $ne: _id,
                },
            })
                .select("_id")
                .lean()
                .exec();

        if (duplicate) {
            throw ApiError.conflict(
                "A vacancy with this title already exists.",
                {
                    code: "VACANCY_TITLE_EXISTS",
                },
            );
        }

        vacancy.title =
            title;
    }

    if (
        input.department !==
        undefined
    ) {
        vacancy.department =
            input.department.trim();
    }

    if (
        input.jobTitle !==
        undefined
    ) {
        vacancy.jobTitle =
            input.jobTitle.trim();
    }

    if (
        input.description !==
        undefined
    ) {
        vacancy.description =
            input.description.trim();
    }

    if (
        input.responsibilities !==
        undefined
    ) {
        vacancy.responsibilities =
            input.responsibilities;
    }

    if (
        input.requirements !==
        undefined
    ) {
        vacancy.requirements =
            input.requirements;
    }

    if (
        input.qualifications !==
        undefined
    ) {
        vacancy.qualifications =
            input.qualifications;
    }

    if (
        input.skills !==
        undefined
    ) {
        vacancy.skills =
            input.skills;
    }

    if (
        input.employmentType !==
        undefined
    ) {
        vacancy.employmentType =
            input.employmentType as VacancyEmploymentType;
    }

    if (
        input.location !==
        undefined
    ) {
        vacancy.location =
            input.location?.trim();
    }

    if (
        input.isRemote !==
        undefined
    ) {
        vacancy.isRemote =
            input.isRemote;
    }

    if (
        input.salaryType !==
        undefined
    ) {
        vacancy.salaryType =
            input.salaryType as VacancySalaryType;
    }

    if (
        input.salaryMin !==
        undefined
    ) {
        vacancy.salaryMin =
            input.salaryMin ?? undefined;
    }

    if (
        input.salaryMax !==
        undefined
    ) {
        vacancy.salaryMax =
            input.salaryMax ?? undefined;
    }

    if (
        input.salaryCurrency !==
        undefined
    ) {
        vacancy.salaryCurrency =
            input.salaryCurrency
            ? input.salaryCurrency
                .trim()
                .toUpperCase()
                : undefined;
    }

    if (
        input.openings !==
        undefined
    ) {
        vacancy.openings =
            input.openings;
    }

    if (
        input.applicationDeadline !==
        undefined
    ) {
        vacancy.applicationDeadline =
            input.applicationDeadline ??
            undefined;
    }

    vacancy.updatedBy =
        updaterId;

    await vacancy.save();

    return vacancy;
};


/*
|--------------------------------------------------------------------------
| Update Vacancy Status
|--------------------------------------------------------------------------
*/

export const updateVacancyStatus =
    async (
        vacancyId: string,
        input: UpdateVacancyStatusInput,
        updatedBy: string,
    ) => {
        const _id =
            validateObjectId(
                vacancyId,
                "vacancy ID",
            );

        const updaterId =
            validateObjectId(
                updatedBy,
                "updater ID",
            );

        const vacancy =
            await Vacancy.findById(
                _id,
            ).exec();

        if (!vacancy) {
            throw ApiError.notFound(
                "Job vacancy not found.",
                {
                    code:
                        "VACANCY_NOT_FOUND",
                },
            );
        }

        const newStatus =
            input.status as VacancyStatus;

        /*
        |--------------------------------------------------------------------------
        | Closed vacancies cannot be reopened directly
        |--------------------------------------------------------------------------
        */

        if (
            vacancy.status ===
                VACANCY_STATUSES.CLOSED &&
            newStatus ===
                VACANCY_STATUSES.OPEN
        ) {
            throw ApiError.badRequest(
                "A closed vacancy cannot be reopened directly.",
                {
                    code:
                        "CLOSED_VACANCY_CANNOT_REOPEN",
                },
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Cancelled vacancies cannot be reopened
        |--------------------------------------------------------------------------
        */

        if (
            vacancy.status ===
                VACANCY_STATUSES.CANCELLED &&
            newStatus ===
                VACANCY_STATUSES.OPEN
        ) {
            throw ApiError.badRequest(
                "A cancelled vacancy cannot be reopened.",
                {
                    code:
                        "CANCELLED_VACANCY_CANNOT_REOPEN",
                },
            );
        }

        vacancy.status =
            newStatus;

        if (
            newStatus ===
            VACANCY_STATUSES.OPEN
        ) {
            if (
                !vacancy.publishedAt
            ) {
                vacancy.publishedAt =
                    new Date();
            }

            vacancy.closedAt =
                undefined;
        }

        if (
            newStatus ===
            VACANCY_STATUSES.CLOSED
        ) {
            vacancy.closedAt =
                new Date();
        }

        if (
            newStatus ===
            VACANCY_STATUSES.CANCELLED
        ) {
            vacancy.closedAt =
                new Date();
        }

        vacancy.updatedBy =
            updaterId;

        await vacancy.save();

        return vacancy;
    };


/*
|--------------------------------------------------------------------------
| Publish Vacancy
|--------------------------------------------------------------------------
*/

export const publishVacancy = async (
    vacancyId: string,
    updatedBy: string,
) => {
    return updateVacancyStatus(
        vacancyId,
        {
            status:
                VACANCY_STATUSES.OPEN,
        },
        updatedBy,
    );
};


/*
|--------------------------------------------------------------------------
| Pause Vacancy
|--------------------------------------------------------------------------
*/

export const pauseVacancy = async (
    vacancyId: string,
    updatedBy: string,
) => {
    return updateVacancyStatus(
        vacancyId,
        {
            status:
                VACANCY_STATUSES.PAUSED,
        },
        updatedBy,
    );
};


/*
|--------------------------------------------------------------------------
| Close Vacancy
|--------------------------------------------------------------------------
*/

export const closeVacancy = async (
    vacancyId: string,
    updatedBy: string,
) => {
    return updateVacancyStatus(
        vacancyId,
        {
            status:
                VACANCY_STATUSES.CLOSED,
        },
        updatedBy,
    );
};