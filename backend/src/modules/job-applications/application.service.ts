import {
    Types,
} from "mongoose";

import {
    JobApplication,
    JobApplicationStatus,
    JOB_APPLICATION_STATUSES,
} from "./application.model";

import {
    CreateJobApplicationInput,
    JobApplicationQueryInput,
    UpdateJobApplicationStatusInput,
} from "./application.validator";

import {
    Vacancy,
} from "../job-vacancies/vacancy.model";

import {
    ApiError,
} from "../../utils/ApiError";

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
        );
    }

    return new Types.ObjectId(value);
};

const normalizeEmail = (
    email: string,
): string => {
    return email.trim().toLowerCase();
};

/*
|--------------------------------------------------------------------------
| Application Status Transitions
|--------------------------------------------------------------------------
|
| Normal recruitment flow:
|
| SUBMITTED
|     ↓
| UNDER_REVIEW
|     ↓
| SHORTLISTED
|     ↓
| INTERVIEW
|     ↓
| SELECTED
|
| From review stages, application can also be REJECTED.
| Applicant can withdraw before final states.
|
*/

const APPLICATION_STATUS_TRANSITIONS: Record<
    JobApplicationStatus,
    readonly JobApplicationStatus[]
> = {
    SUBMITTED: [
        "UNDER_REVIEW",
        "REJECTED",
        "WITHDRAWN",
    ],

    UNDER_REVIEW: [
        "SHORTLISTED",
        "REJECTED",
        "WITHDRAWN",
    ],

    SHORTLISTED: [
        "INTERVIEW",
        "REJECTED",
        "WITHDRAWN",
    ],

    INTERVIEW: [
        "SELECTED",
        "REJECTED",
        "WITHDRAWN",
    ],

    SELECTED: [],

    REJECTED: [],

    WITHDRAWN: [],
};

const canTransitionApplicationStatus = (
    currentStatus: JobApplicationStatus,
    nextStatus: JobApplicationStatus,
): boolean => {
    return APPLICATION_STATUS_TRANSITIONS[
        currentStatus
    ].includes(nextStatus);
};

/*
|--------------------------------------------------------------------------
| Create Application
|--------------------------------------------------------------------------
*/

export const createJobApplication = async (
    applicantId: string,
    input: CreateJobApplicationInput,
) => {
    const applicantObjectId =
        validateObjectId(
            applicantId,
            "applicantId",
        );

    const vacancyObjectId =
        validateObjectId(
            input.vacancyId,
            "vacancyId",
        );

    const vacancy =
        await Vacancy.findById(
            vacancyObjectId,
        );

    if (!vacancy) {
        throw ApiError.notFound(
            "Job vacancy not found.",
        );
    }

    if (vacancy.status !== "OPEN") {
        throw ApiError.badRequest(
            "Applications are only accepted for open vacancies.",
        );
    }

    if (
        vacancy.applicationDeadline &&
        vacancy.applicationDeadline.getTime() <
            Date.now()
    ) {
        throw ApiError.badRequest(
            "The application deadline has passed.",
        );
    }

    const existingApplication =
        await JobApplication.findOne({
            vacancyId: vacancyObjectId,
            applicantId: applicantObjectId,
        });

    if (existingApplication) {
        throw ApiError.conflict(
            "You have already applied for this vacancy.",
        );
    }

    const application =
        await JobApplication.create({
            vacancyId: vacancyObjectId,
            applicantId: applicantObjectId,
            name: input.name.trim(),
            email: normalizeEmail(
                input.email,
            ),
            phone: input.phone?.trim(),
            resumeUrl:
                input.resumeUrl?.trim(),
            coverLetter:
                input.coverLetter?.trim(),
            status: "SUBMITTED",
            appliedAt: new Date(),
        });

    return application;
};

/*
|--------------------------------------------------------------------------
| Get Application By ID
|--------------------------------------------------------------------------
*/

export const getJobApplicationById = async (
    applicationId: string,
) => {
    const applicationObjectId =
        validateObjectId(
            applicationId,
            "applicationId",
        );

    const application =
        await JobApplication.findById(
            applicationObjectId,
        )
            .populate(
                "vacancyId",
                "title slug department jobTitle status",
            )
            .populate(
                "applicantId",
                "name email phone",
            )
            .populate(
                "reviewedBy",
                "name email",
            );

    if (!application) {
        throw ApiError.notFound(
            "Job application not found.",
        );
    }

    return application;
};

/*
|--------------------------------------------------------------------------
| Get Applicant's Applications
|--------------------------------------------------------------------------
*/

export const getMyJobApplications = async (
    applicantId: string,
    query: JobApplicationQueryInput,
) => {
    const applicantObjectId =
        validateObjectId(
            applicantId,
            "applicantId",
        );

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filter: Record<
        string,
        unknown
    > = {
        applicantId:
            applicantObjectId,
    };

    if (query.status) {
        filter.status =
            query.status;
    }

    if (query.vacancyId) {
        filter.vacancyId =
            validateObjectId(
                query.vacancyId,
                "vacancyId",
            );
    }

    const searchFilter =
        query.search?.trim();

    if (searchFilter) {
        filter.$or = [
            {
                name: {
                    $regex:
                        searchFilter,
                    $options: "i",
                },
            },
            {
                email: {
                    $regex:
                        searchFilter,
                    $options: "i",
                },
            },
        ];
    }

    const skip =
        (page - 1) * limit;

    const [
        applications,
        total,
    ] = await Promise.all([
        JobApplication.find(filter)
            .populate(
                "vacancyId",
                "title slug department jobTitle status",
            )
            .sort({
                createdAt: -1,
            })
            .skip(skip)
            .limit(limit)
            .lean(),

        JobApplication.countDocuments(
            filter,
        ),
    ]);

    return {
        applications,

        pagination: {
            page,
            limit,
            total,
            totalPages:
                Math.ceil(
                    total / limit,
                ),
        },
    };
};

/*
|--------------------------------------------------------------------------
| Get All Applications
|--------------------------------------------------------------------------
*/

export const getAllJobApplications =
    async (
        query: JobApplicationQueryInput,
    ) => {
        const page =
            query.page ?? 1;

        const limit =
            query.limit ?? 20;

        const filter: Record<
            string,
            unknown
        > = {};

        if (query.status) {
            filter.status =
                query.status;
        }

        if (query.vacancyId) {
            filter.vacancyId =
                validateObjectId(
                    query.vacancyId,
                    "vacancyId",
                );
        }

        if (query.applicantId) {
            filter.applicantId =
                validateObjectId(
                    query.applicantId,
                    "applicantId",
                );
        }

        const searchFilter =
            query.search?.trim();

        if (searchFilter) {
            filter.$or = [
                {
                    name: {
                        $regex:
                            searchFilter,
                        $options: "i",
                    },
                },
                {
                    email: {
                        $regex:
                            searchFilter,
                        $options: "i",
                    },
                },
            ];
        }

        const skip =
            (page - 1) * limit;

        const [
            applications,
            total,
        ] = await Promise.all([
            JobApplication.find(
                filter,
            )
                .populate(
                    "vacancyId",
                    "title slug department jobTitle status",
                )
                .populate(
                    "applicantId",
                    "name email phone",
                )
                .populate(
                    "reviewedBy",
                    "name email",
                )
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
                .lean(),

            JobApplication.countDocuments(
                filter,
            ),
        ]);

        return {
            applications,

            pagination: {
                page,
                limit,
                total,
                totalPages:
                    Math.ceil(
                        total / limit,
                    ),
            },
        };
    };

/*
|--------------------------------------------------------------------------
| Update Application Status
|--------------------------------------------------------------------------
*/

export const updateJobApplicationStatus =
    async (
        applicationId: string,
        reviewerId: string,
        input: UpdateJobApplicationStatusInput,
    ) => {
        const applicationObjectId =
            validateObjectId(
                applicationId,
                "applicationId",
            );

        const reviewerObjectId =
            validateObjectId(
                reviewerId,
                "reviewerId",
            );

        const application =
            await JobApplication.findById(
                applicationObjectId,
            );

        if (!application) {
            throw ApiError.notFound(
                "Job application not found.",
            );
        }

        const nextStatus =
            input.status as JobApplicationStatus;

        /*
        |--------------------------------------------------------------------------
        | Prevent Invalid Status Transition
        |--------------------------------------------------------------------------
        */

        if (
            !canTransitionApplicationStatus(
                application.status,
                nextStatus,
            )
        ) {
            throw ApiError.badRequest(
                `Cannot change application status from ${application.status} to ${nextStatus}.`,
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Update Status
        |--------------------------------------------------------------------------
        */

        application.status =
            nextStatus;

        application.reviewedBy =
            reviewerObjectId;

        application.reviewedAt =
            new Date();

        /*
        |--------------------------------------------------------------------------
        | Interview
        |--------------------------------------------------------------------------
        */

        if (
            input.interviewAt
        ) {
            application.interviewAt =
                input.interviewAt;
        }

        /*
        |--------------------------------------------------------------------------
        | Notes
        |--------------------------------------------------------------------------
        */

        if (
            input.notes !==
            undefined
        ) {
            application.notes =
                input.notes;
        }

        /*
        |--------------------------------------------------------------------------
        | Selected
        |--------------------------------------------------------------------------
        */

        if (
            nextStatus ===
            "SELECTED"
        ) {
            application.selectedAt =
                new Date();
        }

        /*
        |--------------------------------------------------------------------------
        | Rejected
        |--------------------------------------------------------------------------
        */

        if (
            nextStatus ===
            "REJECTED"
        ) {
            application.rejectedAt =
                new Date();

            application.rejectionReason =
                input.rejectionReason?.trim();
        }

        await application.save();

        return application;
    };

/*
|--------------------------------------------------------------------------
| Withdraw Application
|--------------------------------------------------------------------------
*/

export const withdrawJobApplication =
    async (
        applicationId: string,
        applicantId: string,
    ) => {
        const applicationObjectId =
            validateObjectId(
                applicationId,
                "applicationId",
            );

        const applicantObjectId =
            validateObjectId(
                applicantId,
                "applicantId",
            );

        const application =
            await JobApplication.findById(
                applicationObjectId,
            );

        if (!application) {
            throw ApiError.notFound(
                "Job application not found.",
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Ownership Check
        |--------------------------------------------------------------------------
        */

        if (
            !application.applicantId.equals(
                applicantObjectId,
            )
        ) {
            throw ApiError.forbidden(
                "You are not allowed to withdraw this application.",
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Already Withdrawn
        |--------------------------------------------------------------------------
        */

        if (
            application.status ===
            "WITHDRAWN"
        ) {
            throw ApiError.badRequest(
                "Application is already withdrawn.",
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Allowed Withdrawal States
        |--------------------------------------------------------------------------
        */

        const withdrawableStatuses:
            JobApplicationStatus[] = [
                "SUBMITTED",
                "UNDER_REVIEW",
                "SHORTLISTED",
                "INTERVIEW",
            ];

        if (
            !withdrawableStatuses.includes(
                application.status,
            )
        ) {
            throw ApiError.badRequest(
                `Application cannot be withdrawn from ${application.status} status.`,
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Withdraw
        |--------------------------------------------------------------------------
        */

        application.status =
            "WITHDRAWN";

        application.withdrawnAt =
            new Date();

        await application.save();

        return application;
    };

/*
|--------------------------------------------------------------------------
| Vacancy Application Summary
|--------------------------------------------------------------------------
*/

export const getVacancyApplicationSummary =
    async (
        vacancyId: string,
    ) => {
        const vacancyObjectId =
            validateObjectId(
                vacancyId,
                "vacancyId",
            );

        const vacancy =
            await Vacancy.findById(
                vacancyObjectId,
            );

        if (!vacancy) {
            throw ApiError.notFound(
                "Job vacancy not found.",
            );
        }

        const summary =
            await JobApplication.aggregate(
                [
                    {
                        $match: {
                            vacancyId:
                                vacancyObjectId,
                        },
                    },
                    {
                        $group: {
                            _id: "$status",
                            count: {
                                $sum: 1,
                            },
                        },
                    },
                ],
            );

        const result: Record<
            JobApplicationStatus,
            number
        > = {
            SUBMITTED: 0,
            UNDER_REVIEW: 0,
            SHORTLISTED: 0,
            INTERVIEW: 0,
            SELECTED: 0,
            REJECTED: 0,
            WITHDRAWN: 0,
        };

        for (
            const item of summary
        ) {
            const status =
                item._id as JobApplicationStatus;

            if (
                JOB_APPLICATION_STATUSES.includes(
                    status,
                )
            ) {
                result[status] =
                    item.count;
            }
        }

        return {
            vacancyId,

            total: Object.values(
                result,
            ).reduce(
                (
                    sum,
                    count,
                ) =>
                    sum + count,
                0,
            ),

            byStatus: result,
        };
    };