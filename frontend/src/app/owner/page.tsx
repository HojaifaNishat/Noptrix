"use client";

import Link from "next/link";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  KeyRound,
  Package,
  RefreshCw,
  Shield,
  ShoppingCart,
  Store,
  Truck,
  UserCheck,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

import { useAuthStore } from "@/stores/auth.store";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface OverviewCard {
  readonly title: string;
  readonly value: string;
  readonly description: string;
  readonly icon: typeof Users;
  readonly href?: string;
}

interface OperationItem {
  readonly title: string;
  readonly value: string;
  readonly description: string;
  readonly href: string;
  readonly icon: typeof ShoppingCart;
}

interface QuickAction {
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly icon: typeof Users;
}

/*
|--------------------------------------------------------------------------
| Dashboard Configuration
|--------------------------------------------------------------------------
|
| Real business metrics will be connected to the Owner Dashboard API.
| Until then, the UI intentionally displays "—" instead of fake numbers.
|
|--------------------------------------------------------------------------
*/

const OVERVIEW_CARDS: OverviewCard[] = [
  {
    title: "Total Revenue",
    value: "—",
    description: "Lifetime platform revenue",
    icon: CircleDollarSign,
  },
  {
    title: "Total Orders",
    value: "—",
    description: "All orders across the platform",
    icon: ShoppingCart,
    href: "/admin/orders",
  },
  {
    title: "Customers",
    value: "—",
    description: "Registered customer accounts",
    icon: Users,
    href: "/admin/customers",
  },
  {
    title: "Sellers",
    value: "—",
    description: "Registered marketplace sellers",
    icon: Store,
    href: "/admin/sellers",
  },
  {
    title: "Riders",
    value: "—",
    description: "Registered delivery riders",
    icon: Truck,
    href: "/admin/riders",
  },
  {
    title: "Employees",
    value: "—",
    description: "Active platform employees",
    icon: UserRound,
    href: "/admin/employees",
  },
  {
    title: "Products",
    value: "—",
    description: "Products currently in catalog",
    icon: Package,
    href: "/admin/products",
  },
  {
    title: "Low Stock",
    value: "—",
    description: "Products requiring attention",
    icon: AlertTriangle,
    href: "/admin/low-stock",
  },
];

const OPERATIONS: OperationItem[] = [
  {
    title: "Pending Orders",
    value: "—",
    description: "Orders waiting for action",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Pending Payments",
    value: "—",
    description: "Payments requiring review",
    href: "/admin/payments",
    icon: CreditCard,
  },
  {
    title: "Active Deliveries",
    value: "—",
    description: "Orders currently in delivery",
    href: "/admin/delivery",
    icon: Truck,
  },
  {
    title: "Seller Applications",
    value: "—",
    description: "Applications awaiting review",
    href: "/admin/seller-applications",
    icon: Store,
  },
  {
    title: "Job Applications",
    value: "—",
    description: "Recruitment applications to review",
    href: "/admin/job-applications",
    icon: BriefcaseBusiness,
  },
  {
    title: "Low Stock Alerts",
    value: "—",
    description: "Inventory needs attention",
    href: "/admin/low-stock",
    icon: AlertTriangle,
  },
];

const FINANCIAL_ITEMS = [
  {
    label: "Revenue",
    value: "—",
    icon: CircleDollarSign,
  },
  {
    label: "Expenses",
    value: "—",
    icon: Wallet,
  },
  {
    label: "Profit",
    value: "—",
    icon: BarChart3,
  },
  {
    label: "Refunds",
    value: "—",
    icon: RefreshCw,
  },
  {
    label: "Seller Payouts",
    value: "—",
    icon: Store,
  },
  {
    label: "Rider Payouts",
    value: "—",
    icon: Truck,
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: "Manage Customers",
    description: "Review and manage marketplace customers.",
    href: "/admin/customers",
    icon: Users,
  },
  {
    title: "Manage Sellers",
    description: "Review and manage marketplace sellers.",
    href: "/admin/sellers",
    icon: Store,
  },
  {
    title: "Manage Orders",
    description: "Monitor and operate platform orders.",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Recruitment",
    description: "Manage vacancies and applications.",
    href: "/admin/job-vacancies",
    icon: BriefcaseBusiness,
  },
  {
    title: "Security Center",
    description: "Review platform security controls.",
    href: "/admin/security",
    icon: Shield,
  },
];

/*
|--------------------------------------------------------------------------
| Reusable Section Header
|--------------------------------------------------------------------------
*/

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
}) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-xl font-bold text-gray-900">
        {title}
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        {description}
      </p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Owner Dashboard
|--------------------------------------------------------------------------
*/

export default function OwnerDashboardPage() {
  const user = useAuthStore((state) => state.user);

  const firstName = user?.name?.trim().split(/\s+/)[0];

  return (
    <main className="min-h-screen bg-gray-50 p-5 sm:p-6 lg:p-8 dark:bg-black">
      <div className="mx-auto max-w-[1600px]">

        {/* -------------------------------------------------------
                    Header
        ------------------------------------------------------- */}

        <header className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <Shield className="h-4 w-4" />

              <span>Owner Console</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              Good to see you
              {firstName ? `, ${firstName}` : ""}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Your executive control center for the NOPTRIX marketplace,
              operations, finance, security, and access management.
            </p>
          </div>

          <Link
            href="/owner/profile"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-black dark:text-gray-300 dark:hover:bg-gray-900"
          >
            <UserRound className="h-4 w-4" />

            My Profile
          </Link>
        </header>

        {/* -------------------------------------------------------
                    System Authority
        ------------------------------------------------------- */}

        <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-black">
          <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-black">
                <Shield className="h-6 w-6" />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Full Owner Authority
                </h2>

                <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500">
                  Owner access is independent of normal role-permission
                  assignments. You have full platform authority, including
                  administration, security, roles, permissions, and system
                  configuration.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 rounded-lg bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 dark:bg-gray-900 dark:text-gray-300">
              <Activity className="h-4 w-4" />

              System Control
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------
                    Executive Overview
        ------------------------------------------------------- */}

        <section className="mb-10">
          <SectionHeader
            eyebrow="Executive Overview"
            title="Platform at a glance"
            description="High-level business metrics from across NOPTRIX."
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {OVERVIEW_CARDS.map(
              ({
                title,
                value,
                description,
                icon: Icon,
                href,
              }) => {
                const content = (
                  <>
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                        <Icon className="h-5 w-5" />
                      </div>

                      {href && (
                        <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-1 group-hover:text-gray-700" />
                      )}
                    </div>

                    <p className="text-sm font-medium text-gray-500">
                      {title}
                    </p>

                    <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                      {value}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-gray-500">
                      {description}
                    </p>
                  </>
                );

                if (href) {
                  return (
                    <Link
                      key={title}
                      href={href}
                      className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:bg-black dark:hover:border-gray-700"
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <div
                    key={title}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-black"
                  >
                    {content}
                  </div>
                );
              },
            )}
          </div>
        </section>

        {/* -------------------------------------------------------
                    Business Analytics
        ------------------------------------------------------- */}

        <section className="mb-10">
          <SectionHeader
            eyebrow="Business Analytics"
            title="Performance overview"
            description="Analytics panels are prepared for live aggregation data."
          />

          <div className="grid gap-5 xl:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2 dark:border-gray-800 dark:bg-black">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Revenue & Orders
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Performance trend
                  </p>
                </div>

                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>

              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-8 w-8 text-gray-300" />

                  <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                    Analytics data will appear here
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Connect the Owner Dashboard analytics API.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-black">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Marketplace Health
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Current platform indicators
                  </p>
                </div>

                <Activity className="h-5 w-5 text-gray-400" />
              </div>

              <div className="space-y-5">
                {[
                  ["Active Sellers", "—"],
                  ["Active Riders", "—"],
                  ["Active Products", "—"],
                  ["Pending Verification", "—"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {label}
                    </span>

                    <span className="font-semibold text-gray-900 dark:text-white">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------
                    Live Operations
        ------------------------------------------------------- */}

        <section className="mb-10">
          <SectionHeader
            eyebrow="Live Operations"
            title="What needs attention"
            description="Operational queues requiring administrative action."
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {OPERATIONS.map(
              ({
                title,
                value,
                description,
                href,
                icon: Icon,
              }) => (
                <Link
                  key={title}
                  href={href}
                  className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:bg-black dark:hover:border-gray-700"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {title}
                      </h3>

                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {value}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-gray-500">
                      {description}
                    </p>
                  </div>

                  <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-1 group-hover:text-gray-700" />
                </Link>
              ),
            )}
          </div>
        </section>

        {/* -------------------------------------------------------
                    Financial Snapshot
        ------------------------------------------------------- */}

        <section className="mb-10">
          <SectionHeader
            eyebrow="Finance"
            title="Financial snapshot"
            description="Revenue, expenses, profit, refunds, and payout visibility."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FINANCIAL_ITEMS.map(
              ({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-black"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        {label}
                      </p>

                      <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                        {value}
                      </p>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>

        {/* -------------------------------------------------------
                    Recruitment
        ------------------------------------------------------- */}

        <section className="mb-10">
          <SectionHeader
            eyebrow="Human Resources"
            title="Recruitment overview"
            description="Monitor the hiring pipeline from vacancy to selection."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Open Vacancies", "/admin/job-vacancies"],
              ["Applications", "/admin/job-applications"],
              ["Shortlisted", "/admin/job-applications"],
              ["Interviews", "/admin/job-applications"],
            ].map(([title, href]) => (
              <Link
                key={title}
                href={href}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:bg-black dark:hover:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                    <ClipboardList className="h-5 w-5" />
                  </div>

                  <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-1 group-hover:text-gray-700" />
                </div>

                <p className="mt-5 text-sm font-medium text-gray-500">
                  {title}
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  —
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* -------------------------------------------------------
                    Quick Actions
        ------------------------------------------------------- */}

        <section className="pb-8">
          <SectionHeader
            eyebrow="Quick Actions"
            title="Frequently used management"
            description="Jump directly into frequently used management areas."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_ACTIONS.map(
              ({
                title,
                description,
                href,
                icon: Icon,
              }) => (
                <Link
                  key={title}
                  href={href}
                  className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:bg-black dark:hover:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                      <Icon className="h-5 w-5" />
                    </div>

                    <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-1 group-hover:text-gray-700" />
                  </div>

                  <h3 className="mt-5 text-sm font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    {description}
                  </p>
                </Link>
              ),
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
