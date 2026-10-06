"use client";

import {
    useEffect,
    useState,
} from "react";

import Link from "next/link";

import {
    AlertCircle,
    ArrowRight,
    BarChart3,
    BriefcaseBusiness,
    CheckCircle2,
    ClipboardList,
    Clock3,
    LayoutDashboard,
    Loader2,
    Package,
    RefreshCw,
    ShoppingCart,
    Store,
    Truck,
    Users,
    UserRound,
} from "lucide-react";

import {
    useAuthStore,
} from "@/stores/auth.store";

import {
    getDashboardOverview,
} from "@/services/api/dashboard.api";

import type {
    DashboardOverview,
} from "@/types/dashboard";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function formatNumber(
    value: number,
): string {
    return new Intl.NumberFormat(
        "en-US",
    ).format(value);
}


/*
|--------------------------------------------------------------------------
| KPI Card
|--------------------------------------------------------------------------
*/

interface KpiCardProps {
    label: string;
    value: number;
    description: string;
    icon: typeof Users;
}

function KpiCard({
    label,
    value,
    description,
    icon: Icon,
}: KpiCardProps) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-gray-500">
                        {label}
                    </p>

                    <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                        {formatNumber(value)}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                        {description}
                    </p>
                </div>

                <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
                    <Icon
                        size={20}
                        strokeWidth={1.8}
                    />
                </div>
            </div>
        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Pipeline Row
|--------------------------------------------------------------------------
*/

interface PipelineRowProps {
    label: string;
    value: number;
    icon: typeof Clock3;
    href?: string;
}

function PipelineRow({
    label,
    value,
    icon: Icon,
    href,
}: PipelineRowProps) {
    const content = (
        <>
            <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
                    <Icon
                        size={17}
                        strokeWidth={1.8}
                    />
                </div>

                <span className="truncate text-sm font-medium text-gray-700">
                    {label}
                </span>
            </div>

            <span className="text-sm font-bold text-gray-900">
                {formatNumber(value)}
            </span>
        </>
    );

    if (href) {
        return (
            <Link
                href={href}
                className="flex items-center justify-between rounded-xl px-3 py-3 transition hover:bg-gray-50"
            >
                {content}
            </Link>
        );
    }

    return (
        <div className="flex items-center justify-between rounded-xl px-3 py-3">
            {content}
        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

export default function AdminPage() {
    const user = useAuthStore(
        (state) => state.user,
    );

    const [
        dashboard,
        setDashboard,
    ] = useState<DashboardOverview | null>(null);

    const [
        isLoading,
        setIsLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    const isOwner =
        user?.accountType === "OWNER";

    const dashboardTitle =
        isOwner
            ? "Owner Dashboard"
            : "Admin Dashboard";

    const accountLabel =
        isOwner
            ? "Owner"
            : "Administrator";


    /*
     * Load dashboard
     */
    async function loadDashboard() {
        try {
            setError(null);
            setIsLoading(true);

            const data =
                await getDashboardOverview();

            setDashboard(data);
        } catch {
            setError(
                "Unable to load dashboard data.",
            );
        } finally {
            setIsLoading(false);
        }
    }


    useEffect(() => {
        // The dashboard must load once when the page mounts.
        // The loader manages the async request lifecycle and its state.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadDashboard();
    }, []);


    /*
     |--------------------------------------------------------------------------
     | Loading
     |--------------------------------------------------------------------------
     */

    if (isLoading) {
        return (
            <main className="min-h-full bg-gray-50 p-5 md:p-8">
                <div className="flex min-h-[60vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2
                            size={30}
                            className="animate-spin text-gray-500"
                        />

                        <p className="text-sm text-gray-500">
                            Loading dashboard...
                        </p>
                    </div>
                </div>
            </main>
        );
    }


    /*
     |--------------------------------------------------------------------------
     | Error
     |--------------------------------------------------------------------------
     */

    if (error || !dashboard) {
        return (
            <main className="min-h-full bg-gray-50 p-5 md:p-8">
                <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
                    <div className="w-full rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                            <AlertCircle
                                size={24}
                                strokeWidth={1.8}
                            />
                        </div>

                        <h2 className="mt-4 text-lg font-semibold text-gray-900">
                            Dashboard unavailable
                        </h2>

                        <p className="mt-2 text-sm text-gray-500">
                            {error ??
                                "No dashboard data is available."}
                        </p>

                        <button
                            type="button"
                            onClick={() => {
                                void loadDashboard();
                            }}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
                        >
                            <RefreshCw
                                size={16}
                                strokeWidth={1.8}
                            />

                            Try again
                        </button>
                    </div>
                </div>
            </main>
        );
    }


    const sellerApplications =
        dashboard.applications
            .sellerApplications;

    const jobApplications =
        dashboard.applications
            .jobApplications;


    /*
     |--------------------------------------------------------------------------
     | Render
     |--------------------------------------------------------------------------
     */

    return (
        <main className="min-h-full bg-gray-50 p-5 md:p-8">

            {/* Header */}

            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <LayoutDashboard
                            size={17}
                            strokeWidth={1.8}
                        />

                        <span>
                            {accountLabel}
                        </span>
                    </div>

                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                        {dashboardTitle}
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                        Monitor your NOPTRIX platform,
                        applications, sellers, riders,
                        and customer activity from one place.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        void loadDashboard();
                    }}
                    className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                    <RefreshCw
                        size={16}
                        strokeWidth={1.8}
                    />

                    Refresh
                </button>
            </div>


            {/* KPI Cards */}

            <section>
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Platform Overview
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Current platform account statistics.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <KpiCard
                        label="Users"
                        value={
                            dashboard.counts.users
                        }
                        description="All platform users"
                        icon={Users}
                    />

                    <KpiCard
                        label="Customers"
                        value={
                            dashboard.counts.customers
                        }
                        description="Customer profiles"
                        icon={UserRound}
                    />

                    <KpiCard
                        label="Admins"
                        value={
                            dashboard.counts.admins
                        }
                        description="Active administrators"
                        icon={Users}
                    />

                    <KpiCard
                        label="Sellers"
                        value={
                            dashboard.counts.sellers
                        }
                        description="Seller accounts"
                        icon={Store}
                    />

                    <KpiCard
                        label="Riders"
                        value={
                            dashboard.counts.riders
                        }
                        description="Rider accounts"
                        icon={Truck}
                    />
                </div>
            </section>


            {/* Attention */}

            <section className="mt-8">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Requires Attention
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Items currently waiting for administration.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Link
                        href="/admin/seller-applications"
                        className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
                                <Store
                                    size={21}
                                    strokeWidth={1.8}
                                />
                            </div>

                            <ArrowRight
                                size={18}
                                className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-gray-700"
                            />
                        </div>

                        <p className="mt-5 text-3xl font-bold text-gray-900">
                            {formatNumber(
                                dashboard.counts
                                    .pendingSellerApplications,
                            )}
                        </p>

                        <p className="mt-1 text-sm font-medium text-gray-700">
                            Seller applications
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                            Submitted or under review
                        </p>
                    </Link>

                    <Link
                        href="/admin/job-applications"
                        className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
                                <BriefcaseBusiness
                                    size={21}
                                    strokeWidth={1.8}
                                />
                            </div>

                            <ArrowRight
                                size={18}
                                className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-gray-700"
                            />
                        </div>

                        <p className="mt-5 text-3xl font-bold text-gray-900">
                            {formatNumber(
                                dashboard.counts
                                    .pendingJobApplications,
                            )}
                        </p>

                        <p className="mt-1 text-sm font-medium text-gray-700">
                            Job applications
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                            Applications requiring review
                        </p>
                    </Link>
                </div>
            </section>


            {/* Pipelines */}

            <section className="mt-8 grid gap-6 lg:grid-cols-2">

                {/* Seller Pipeline */}

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Seller Pipeline
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Seller application lifecycle.
                            </p>
                        </div>

                        <Store
                            size={21}
                            strokeWidth={1.8}
                            className="text-gray-400"
                        />
                    </div>

                    <div className="mt-5 space-y-1">
                        <PipelineRow
                            label="Submitted"
                            value={
                                sellerApplications.submitted
                            }
                            icon={ClipboardList}
                            href="/admin/seller-applications"
                        />

                        <PipelineRow
                            label="Under review"
                            value={
                                sellerApplications.underReview
                            }
                            icon={Clock3}
                            href="/admin/seller-applications"
                        />

                        <PipelineRow
                            label="Approved"
                            value={
                                sellerApplications.approved
                            }
                            icon={CheckCircle2}
                            href="/admin/seller-applications"
                        />

                        <PipelineRow
                            label="Rejected"
                            value={
                                sellerApplications.rejected
                            }
                            icon={AlertCircle}
                            href="/admin/seller-applications"
                        />
                    </div>
                </div>


                {/* Recruitment Pipeline */}

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Recruitment Pipeline
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Job application lifecycle.
                            </p>
                        </div>

                        <BriefcaseBusiness
                            size={21}
                            strokeWidth={1.8}
                            className="text-gray-400"
                        />
                    </div>

                    <div className="mt-5 space-y-1">
                        <PipelineRow
                            label="Submitted"
                            value={
                                jobApplications.submitted
                            }
                            icon={ClipboardList}
                            href="/admin/job-applications"
                        />

                        <PipelineRow
                            label="Under review"
                            value={
                                jobApplications.underReview
                            }
                            icon={Clock3}
                            href="/admin/job-applications"
                        />

                        <PipelineRow
                            label="Shortlisted"
                            value={
                                jobApplications.shortlisted
                            }
                            icon={Users}
                            href="/admin/job-applications"
                        />

                        <PipelineRow
                            label="Interview"
                            value={
                                jobApplications.interview
                            }
                            icon={BriefcaseBusiness}
                            href="/admin/job-applications"
                        />

                        <PipelineRow
                            label="Selected"
                            value={
                                jobApplications.selected
                            }
                            icon={CheckCircle2}
                            href="/admin/job-applications"
                        />
                    </div>
                </div>
            </section>


            {/* Commerce Availability */}

            <section className="mt-8">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Commerce Metrics
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                These metrics will become available as
                                commerce modules are implemented.
                            </p>
                        </div>

                        <BarChart3
                            size={21}
                            strokeWidth={1.8}
                            className="text-gray-400"
                        />
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-dashed border-gray-200 p-4">
                            <div className="flex items-center gap-2">
                                <ShoppingCart
                                    size={17}
                                    className="text-gray-400"
                                />

                                <span className="text-sm font-medium text-gray-600">
                                    Orders
                                </span>
                            </div>

                            <p className="mt-3 text-sm font-semibold text-gray-400">
                                Coming with Orders module
                            </p>
                        </div>

                        <div className="rounded-xl border border-dashed border-gray-200 p-4">
                            <div className="flex items-center gap-2">
                                <Package
                                    size={17}
                                    className="text-gray-400"
                                />

                                <span className="text-sm font-medium text-gray-600">
                                    Products
                                </span>
                            </div>

                            <p className="mt-3 text-sm font-semibold text-gray-400">
                                Coming with Catalog module
                            </p>
                        </div>

                        <div className="rounded-xl border border-dashed border-gray-200 p-4">
                            <div className="flex items-center gap-2">
                                <BarChart3
                                    size={17}
                                    className="text-gray-400"
                                />

                                <span className="text-sm font-medium text-gray-600">
                                    Revenue
                                </span>
                            </div>

                            <p className="mt-3 text-sm font-semibold text-gray-400">
                                Coming with Orders & Payments
                            </p>
                        </div>
                    </div>
                </div>
            </section>


            {/* Footer status */}

            <div className="mt-6 flex flex-col gap-2 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
                <span>
                    NOPTRIX Command Center
                </span>

                <span>
                    Updated{" "}
                    {new Date(
                        dashboard.generatedAt,
                    ).toLocaleString()}
                </span>
            </div>
        </main>
    );
}
