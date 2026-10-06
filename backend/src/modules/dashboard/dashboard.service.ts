import {
    Admin,
} from "../admins/admin.model";

import {
    Customer,
} from "../customers/customer.model";

import {
    JobApplication,
} from "../job-applications/application.model";

import {
    Rider,
} from "../riders/rider.model";

import {
    Seller,
} from "../sellers/seller.model";

import {
    SellerApplication,
} from "../seller-applications/seller-application.model";

import {
    User,
} from "../users/user.model";

import type {
    DashboardOverview,
} from "./dashboard.types";


/*
|--------------------------------------------------------------------------
| Dashboard Service
|--------------------------------------------------------------------------
*/

export async function getDashboardOverview(): Promise<DashboardOverview> {
    const [
        users,
        customers,
        admins,
        sellers,
        riders,

        pendingSellerApplications,
        pendingJobApplications,

        sellerSubmitted,
        sellerUnderReview,
        sellerApproved,
        sellerRejected,

        jobSubmitted,
        jobUnderReview,
        jobShortlisted,
        jobInterview,
        jobSelected,
        jobRejected,
        jobWithdrawn,
    ] = await Promise.all([
        /*
         * Platform users
         */
        User.countDocuments(),

        /*
         * Customer profiles
         */
        Customer.countDocuments(),

        /*
         * Administration accounts
         */
        Admin.countDocuments({
            status: "ACTIVE",
        }),

        /*
         * Seller accounts
         */
        Seller.countDocuments(),

        /*
         * Rider accounts
         */
        Rider.countDocuments(),

        /*
         * Seller applications requiring attention
         */
        SellerApplication.countDocuments({
            status: {
                $in: [
                    "SUBMITTED",
                    "UNDER_REVIEW",
                ],
            },
        }),

        /*
         * Job applications requiring attention
         */
        JobApplication.countDocuments({
            status: {
                $in: [
                    "SUBMITTED",
                    "UNDER_REVIEW",
                    "SHORTLISTED",
                    "INTERVIEW",
                ],
            },
        }),

        /*
         * Seller application summary
         */
        SellerApplication.countDocuments({
            status: "SUBMITTED",
        }),

        SellerApplication.countDocuments({
            status: "UNDER_REVIEW",
        }),

        SellerApplication.countDocuments({
            status: "APPROVED",
        }),

        SellerApplication.countDocuments({
            status: "REJECTED",
        }),

        /*
         * Job application summary
         */
        JobApplication.countDocuments({
            status: "SUBMITTED",
        }),

        JobApplication.countDocuments({
            status: "UNDER_REVIEW",
        }),

        JobApplication.countDocuments({
            status: "SHORTLISTED",
        }),

        JobApplication.countDocuments({
            status: "INTERVIEW",
        }),

        JobApplication.countDocuments({
            status: "SELECTED",
        }),

        JobApplication.countDocuments({
            status: "REJECTED",
        }),

        JobApplication.countDocuments({
            status: "WITHDRAWN",
        }),
    ]);

    return {
        generatedAt:
            new Date().toISOString(),

        counts: {
            users,
            customers,
            admins,
            sellers,
            riders,

            pendingSellerApplications,
            pendingJobApplications,
        },

        applications: {
            sellerApplications: {
                submitted:
                    sellerSubmitted,

                underReview:
                    sellerUnderReview,

                approved:
                    sellerApproved,

                rejected:
                    sellerRejected,
            },

            jobApplications: {
                submitted:
                    jobSubmitted,

                underReview:
                    jobUnderReview,

                shortlisted:
                    jobShortlisted,

                interview:
                    jobInterview,

                selected:
                    jobSelected,

                rejected:
                    jobRejected,

                withdrawn:
                    jobWithdrawn,
            },
        },

        /*
         * These modules are not implemented yet.
         *
         * Do not return fake numbers.
         */
        availability: {
            orders: false,
            products: false,
            revenue: false,
        },
    };
}
