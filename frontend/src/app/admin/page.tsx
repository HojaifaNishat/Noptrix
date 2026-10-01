"use client";

import {
    useAuthStore,
} from "@/stores/auth.store";

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
        <main className="p-6 md:p-8">
            {/* Header */}

            <div className="mb-8">
                <p className="text-sm font-medium text-gray-500">
                    {accountLabel}
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                    {dashboardTitle}
                </h1>

                <p className="mt-2 text-gray-600">
                    Manage your NOPTRIX platform from one place.
                </p>
            </div>

            {/* Overview */}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">
                        Users
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        —
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                        Total users
                    </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">
                        Orders
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        —
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                        Total orders
                    </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">
                        Products
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        —
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                        Total products
                    </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">
                        Revenue
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        —
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                        Total revenue
                    </p>
                </div>
            </div>

            {/* Welcome */}

            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                    Welcome to NOPTRIX
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                    Your dashboard is ready. Platform statistics,
                    management tools, and reports will appear here
                    as the backend dashboard APIs are connected.
                </p>
            </div>
        </main>
    );
}