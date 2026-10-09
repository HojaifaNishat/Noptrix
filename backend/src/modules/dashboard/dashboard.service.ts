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

const hasPermission = (
    permissions: readonly string[],
    requiredPermission: string,
): boolean => {
    const required = requiredPermission.toLowerCase();

    return permissions.some((permission) => {
        const granted = permission.trim().toLowerCase();

        return (
            granted === "*" ||
            granted === required ||
            (granted.endsWith(".*") &&
                required.startsWith(granted.slice(0, -1)))
        );
    });
};

export async function getDashboardOverview(
    permissions: readonly string[],
    isOwner: boolean,
): Promise<DashboardOverview> {
    const access = {
        users: isOwner || hasPermission(permissions, "users.read"),
        customers: isOwner || hasPermission(permissions, "customers.read"),
        admins: isOwner,
        sellers: isOwner || hasPermission(permissions, "sellers.read"),
        riders: isOwner || hasPermission(permissions, "riders.read"),
        sellerApplications:
            isOwner ||
            hasPermission(permissions, "seller_applications.read"),
        jobApplications:
            isOwner ||
            hasPermission(permissions, "job_applications.read"),
    };

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
            users: access.users ? users : 0,
            customers: access.customers ? customers : 0,
            admins: access.admins ? admins : 0,
            sellers: access.sellers ? sellers : 0,
            riders: access.riders ? riders : 0,
            pendingSellerApplications:
                access.sellerApplications
                    ? pendingSellerApplications
                    : 0,
            pendingJobApplications:
                access.jobApplications
                    ? pendingJobApplications
                    : 0,
        },

        access,

        applications: {
            sellerApplications: access.sellerApplications
                ? {
                submitted:
                    sellerSubmitted,

                underReview:
                    sellerUnderReview,

                approved:
                    sellerApproved,

                rejected:
                    sellerRejected,
                }
                : {
                    submitted: 0,
                    underReview: 0,
                    approved: 0,
                    rejected: 0,
                },

            jobApplications: access.jobApplications
                ? {
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
                }
                : {
                    submitted: 0,
                    underReview: 0,
                    shortlisted: 0,
                    interview: 0,
                    selected: 0,
                    rejected: 0,
                    withdrawn: 0,
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
