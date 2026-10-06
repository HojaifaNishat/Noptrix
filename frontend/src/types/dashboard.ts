/*
|--------------------------------------------------------------------------
| Dashboard Types
|--------------------------------------------------------------------------
*/

export interface DashboardCounts {
    users: number;
    customers: number;
    admins: number;
    sellers: number;
    riders: number;

    pendingSellerApplications: number;
    pendingJobApplications: number;
}

export interface SellerApplicationSummary {
    submitted: number;
    underReview: number;
    approved: number;
    rejected: number;
}

export interface JobApplicationSummary {
    submitted: number;
    underReview: number;
    shortlisted: number;
    interview: number;
    selected: number;
    rejected: number;
    withdrawn: number;
}

export interface DashboardOverview {
    generatedAt: string;

    counts: DashboardCounts;

    applications: {
        sellerApplications: SellerApplicationSummary;
        jobApplications: JobApplicationSummary;
    };

    availability: {
        orders: boolean;
        products: boolean;
        revenue: boolean;
    };
}
