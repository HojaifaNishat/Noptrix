import { Admin } from "../admins/admin.model";

import { Customer } from "../customers/customer.model";

import { JobApplication } from "../job-applications/application.model";

import { Rider } from "../riders/rider.model";

import { Seller } from "../sellers/seller.model";

import { SellerApplication } from "../seller-applications/seller-application.model";

import { User } from "../users/user.model";

import type { DashboardOverview } from "./dashboard.types";

/*
|--------------------------------------------------------------------------
| Dashboard Permission Helpers
|--------------------------------------------------------------------------
*/

const hasPermission = (
  permissions: readonly string[],
  requiredPermission: string,
): boolean => {
  const required = requiredPermission.trim().toLowerCase();

  return permissions.some((permission) => {
    const granted = permission.trim().toLowerCase();

    return (
      granted === "*" ||
      granted === required ||
      (granted.endsWith(".*") && required.startsWith(granted.slice(0, -1)))
    );
  });
};

/*
|--------------------------------------------------------------------------
| Dashboard Access Policy
|--------------------------------------------------------------------------
*/

function buildDashboardAccess(
  permissions: readonly string[],
  isOwner: boolean,
) {
  return {
    users: isOwner || hasPermission(permissions, "users.read"),
    customers: isOwner || hasPermission(permissions, "customers.read"),
    admins: isOwner,
    sellers: isOwner || hasPermission(permissions, "sellers.read"),
    riders: isOwner || hasPermission(permissions, "riders.read"),
    sellerApplications:
      isOwner || hasPermission(permissions, "seller_applications.read"),
    jobApplications:
      isOwner || hasPermission(permissions, "job_applications.read"),
  };
}

/*
|--------------------------------------------------------------------------
| Dashboard Overview Service
|--------------------------------------------------------------------------
*/

export async function getDashboardOverview(
  permissions: readonly string[],
  isOwner: boolean,
): Promise<DashboardOverview> {
  const access = buildDashboardAccess(permissions, isOwner);

  /*
   * Do not query modules the caller is not allowed to view.
   * A null result is converted to zero in the response.
   */
  const [
    users,
    customers,
    admins,
    sellers,
    riders,
    pendingSellerApplications,
    pendingJobApplications,
    sellerApplicationSummary,
    jobApplicationSummary,
  ] = await Promise.all([
    access.users ? User.countDocuments().exec() : Promise.resolve(null),

    access.customers ? Customer.countDocuments().exec() : Promise.resolve(null),

    access.admins
      ? Admin.countDocuments({ status: "ACTIVE" }).exec()
      : Promise.resolve(null),

    access.sellers ? Seller.countDocuments().exec() : Promise.resolve(null),

    access.riders ? Rider.countDocuments().exec() : Promise.resolve(null),

    access.sellerApplications
      ? SellerApplication.countDocuments({
          status: {
            $in: ["SUBMITTED", "UNDER_REVIEW"],
          },
        }).exec()
      : Promise.resolve(null),

    access.jobApplications
      ? JobApplication.countDocuments({
          status: {
            $in: ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW"],
          },
        }).exec()
      : Promise.resolve(null),

    access.sellerApplications
      ? SellerApplication.aggregate<{
          _id: string;
          count: number;
        }>([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]).exec()
      : Promise.resolve(null),

    access.jobApplications
      ? JobApplication.aggregate<{
          _id: string;
          count: number;
        }>([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]).exec()
      : Promise.resolve(null),
  ]);

  const sellerStatusCounts = new Map(
    (sellerApplicationSummary ?? []).map((item) => [item._id, item.count]),
  );

  const jobStatusCounts = new Map(
    (jobApplicationSummary ?? []).map((item) => [item._id, item.count]),
  );

  return {
    generatedAt: new Date().toISOString(),

    counts: {
      users: users ?? 0,
      customers: customers ?? 0,
      admins: admins ?? 0,
      sellers: sellers ?? 0,
      riders: riders ?? 0,

      pendingSellerApplications: pendingSellerApplications ?? 0,

      pendingJobApplications: pendingJobApplications ?? 0,
    },

    access,

    applications: {
      sellerApplications: {
        submitted: sellerStatusCounts.get("SUBMITTED") ?? 0,
        underReview: sellerStatusCounts.get("UNDER_REVIEW") ?? 0,
        approved: sellerStatusCounts.get("APPROVED") ?? 0,
        rejected: sellerStatusCounts.get("REJECTED") ?? 0,
      },

      jobApplications: {
        submitted: jobStatusCounts.get("SUBMITTED") ?? 0,
        underReview: jobStatusCounts.get("UNDER_REVIEW") ?? 0,
        shortlisted: jobStatusCounts.get("SHORTLISTED") ?? 0,
        interview: jobStatusCounts.get("INTERVIEW") ?? 0,
        selected: jobStatusCounts.get("SELECTED") ?? 0,
        rejected: jobStatusCounts.get("REJECTED") ?? 0,
        withdrawn: jobStatusCounts.get("WITHDRAWN") ?? 0,
      },
    },

    availability: {
      orders: false,
      products: false,
      revenue: false,
    },
  };
}
