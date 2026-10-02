"use client";

import {
    ArrowRight,
    BarChart3,
    BriefcaseBusiness,
    ClipboardList,
    Package,
    ShoppingCart,
    Users,
} from "lucide-react";

import {
    useAuthStore,
} from "@/stores/auth.store";

interface OverviewCardProps {
    label: string;
    description: string;
    icon: typeof Users;
}

function OverviewCard({
    label,
    description,
    icon: Icon,
}: OverviewCardProps) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">
                        {label}
                    </p>

                    <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                        —
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
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

interface QuickActionProps {
    title: string;
    description: string;
    href: string;
    icon: typeof Package;
}

function QuickAction({
    title,
    description,
    href,
    icon: Icon,
}: QuickActionProps) {
    return (
        <a
            href={href}
            className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:bg-gray-50"
        >
            <div className="flex min-w-0 items-center gap-3">
                <div className="shrink-0 rounded-lg bg-gray-100 p-2.5 text-gray-700">
                    <Icon
                        size={18}
                        strokeWidth={1.8}
                    />
                </div>

                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                        {title}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-gray-500">
                        {description}
                    </p>
                </div>
            </div>

            <ArrowRight
                size={17}
                strokeWidth={1.8}
                className="ml-3 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-gray-700"
            />
        </a>
    );
}

export default function AdminPage() {
    const user = useAuthStore(
        (state) => state.user,
    );

    const isOwner =
        user?.accountType === "OWNER";

    const dashboardTitle = isOwner
        ? "Owner Dashboard"
        : "Admin Dashboard";

    const accountLabel = isOwner
        ? "Owner"
        : "Administrator";

    return (
        <main className="min-h-full bg-gray-50 p-5 md:p-8">
            {/* Header */}

            <div className="mb-8">
                <p className="text-sm font-medium text-gray-500">
                    {accountLabel}
                </p>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            {dashboardTitle}
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                            Manage your NOPTRIX platform from one place.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <BarChart3
                            size={17}
                            strokeWidth={1.8}
                        />
                        <span>
                            Platform overview
                        </span>
                    </div>
                </div>
            </div>

            {/* Overview */}

            <section>
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Overview
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Key platform metrics will appear here.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <OverviewCard
                        label="Users"
                        description="Total users"
                        icon={Users}
                    />

                    <OverviewCard
                        label="Orders"
                        description="Total orders"
                        icon={ShoppingCart}
                    />

                    <OverviewCard
                        label="Products"
                        description="Total products"
                        icon={Package}
                    />

                    <OverviewCard
                        label="Revenue"
                        description="Total revenue"
                        icon={BarChart3}
                    />
                </div>
            </section>

            {/* Main Grid */}

            <div className="mt-8 grid gap-6 xl:grid-cols-3">
                {/* Quick Actions */}

                <section className="xl:col-span-2">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Quick Actions
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Common administration tasks.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <QuickAction
                            title="Manage Products"
                            description="Add and manage catalog products"
                            href="/admin/products"
                            icon={Package}
                        />

                        <QuickAction
                            title="Manage Orders"
                            description="Review and manage customer orders"
                            href="/admin/orders"
                            icon={ShoppingCart}
                        />

                        <QuickAction
                            title="Manage Users"
                            description="View and manage platform users"
                            href="/admin/users"
                            icon={Users}
                        />

                        <QuickAction
                            title="Job Vacancies"
                            description="Manage open positions"
                            href="/admin/job-vacancies"
                            icon={BriefcaseBusiness}
                        />
                    </div>
                </section>

                {/* Pending Applications */}

                <section>
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Pending Applications
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Applications requiring attention.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
                                <ClipboardList
                                    size={20}
                                    strokeWidth={1.8}
                                />
                            </div>

                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    —
                                </p>

                                <p className="text-sm text-gray-500">
                                    Pending applications
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 space-y-2">
                            <a
                                href="/admin/seller-applications"
                                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                            >
                                <span>
                                    Seller Applications
                                </span>

                                <ArrowRight
                                    size={15}
                                    strokeWidth={1.8}
                                />
                            </a>

                            <a
                                href="/admin/job-applications"
                                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                            >
                                <span>
                                    Job Applications
                                </span>

                                <ArrowRight
                                    size={15}
                                    strokeWidth={1.8}
                                />
                            </a>
                        </div>
                    </div>
                </section>
            </div>

            {/* Operational Panels */}

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Recent Orders
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Latest customer orders will appear here.
                            </p>
                        </div>

                        <ShoppingCart
                            size={20}
                            strokeWidth={1.8}
                            className="text-gray-400"
                        />
                    </div>

                    <div className="mt-6 rounded-xl border border-dashed border-gray-200 p-8 text-center">
                        <p className="text-sm font-medium text-gray-500">
                            No order data connected yet
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                            Dashboard API integration will populate this section.
                        </p>
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Low Stock
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Products requiring inventory attention.
                            </p>
                        </div>

                        <Package
                            size={20}
                            strokeWidth={1.8}
                            className="text-gray-400"
                        />
                    </div>

                    <div className="mt-6 rounded-xl border border-dashed border-gray-200 p-8 text-center">
                        <p className="text-sm font-medium text-gray-500">
                            No inventory data connected yet
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                            Inventory API integration will populate this section.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
