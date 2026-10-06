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

export interface DashboardApplicationSummary {
    sellerApplications: {
        submitted: number;
        underReview: number;
        approved: number;
        rejected: number;
    };

    jobApplications: {
        submitted: number;
        underReview: number;
        shortlisted: number;
        interview: number;
        selected: number;
        rejected: number;
        withdrawn: number;
    };
}

export interface DashboardOverview {
    generatedAt: string;

    counts: DashboardCounts;

    applications: DashboardApplicationSummary;

    availability: {
        orders: false;
        products: false;
        revenue: false;
    };
}
