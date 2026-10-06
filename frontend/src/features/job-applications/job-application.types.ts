export const JOB_APPLICATION_STATUSES = [
    "SUBMITTED",
    "UNDER_REVIEW",
    "SHORTLISTED",
    "INTERVIEW",
    "SELECTED",
    "REJECTED",
    "WITHDRAWN",
] as const;

export type JobApplicationStatus =
    (typeof JOB_APPLICATION_STATUSES)[number];


export interface JobApplicationVacancy {
    id?: string;
    _id?: string;

    title: string;

    slug?: string;

    department?: string;

    jobTitle?: string;

    status?: string;
}


export interface JobApplicationUser {
    id?: string;
    _id?: string;

    name?: string;

    email?: string;

    phone?: string;
}


export interface JobApplicationReviewer {
    id?: string;
    _id?: string;

    name?: string;

    email?: string;
}


export interface JobApplication {
    id?: string;
    _id: string;

    vacancyId: JobApplicationVacancy | string;

    applicantId?: JobApplicationUser | string;

    name: string;

    email: string;

    phone?: string;

    resumeUrl?: string;

    coverLetter?: string;

    status: JobApplicationStatus;

    appliedAt: string;

    reviewedAt?: string;

    reviewedBy?: JobApplicationReviewer | string;

    interviewAt?: string;

    selectedAt?: string;

    rejectedAt?: string;

    withdrawnAt?: string;

    rejectionReason?: string;

    notes?: string;

    createdAt?: string;

    updatedAt?: string;
}


export interface CreateJobApplicationInput {
    vacancyId: string;

    name: string;

    email: string;

    phone?: string;

    resumeUrl?: string;

    coverLetter?: string;
}


export interface UpdateJobApplicationInput {
    status: JobApplicationStatus;

    rejectionReason?: string;

    notes?: string;

    interviewAt?: string;
}


export interface JobApplicationListParams {
    page?: number;

    limit?: number;

    search?: string;

    status?: JobApplicationStatus;

    vacancyId?: string;

    applicantId?: string;
}


export interface JobApplicationPagination {
    page: number;

    limit: number;

    total: number;

    totalPages: number;

    hasNextPage?: boolean;

    hasPreviousPage?: boolean;
}


export interface JobApplicationList {
    applications: JobApplication[];

    pagination: JobApplicationPagination;
}


export interface VacancyApplicationSummary {
    vacancyId: string;

    total: number;

    byStatus: Record<
        JobApplicationStatus,
        number
    >;
}
