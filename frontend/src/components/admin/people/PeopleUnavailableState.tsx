"use client";

import Link from "next/link";

interface PeopleUnavailableStateProps {
    title: string;
    description: string;
    endpoint: string;
}

export default function PeopleUnavailableState({
    title,
    description,
    endpoint,
}: PeopleUnavailableStateProps) {
    return (
        <section className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                    {title}
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-400">
                    {description}
                </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/60 dark:bg-amber-950/20">
                <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        !
                    </span>

                    <div className="min-w-0">
                        <h2 className="font-semibold text-amber-900 dark:text-amber-200">
                            Backend integration unavailable
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-amber-800 dark:text-amber-300">
                            এই page-এর জন্য প্রয়োজনীয় admin listing API
                            বর্তমানে backend-এ নেই। তাই এখানে কোনো
                            placeholder customer/user data দেখানো হচ্ছে না।
                        </p>

                        <div className="mt-3 rounded-lg border border-amber-200/80 bg-white/70 px-3 py-2 font-mono text-xs text-gray-700 dark:border-amber-900/50 dark:bg-black/20 dark:text-gray-300">
                            {endpoint}
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                    Available People sections
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    এই section-এর অন্যান্য frontend pages-এ যেতে পারো।
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Link
                        href="/admin/users"
                        className="rounded-lg border border-gray-200 p-3 text-sm font-medium text-gray-700 transition hover:border-blue-400 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                        Users
                    </Link>

                    <Link
                        href="/admin/customers"
                        className="rounded-lg border border-gray-200 p-3 text-sm font-medium text-gray-700 transition hover:border-blue-400 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                        Customers
                    </Link>

                    <Link
                        href="/admin/customers/addresses"
                        className="rounded-lg border border-gray-200 p-3 text-sm font-medium text-gray-700 transition hover:border-blue-400 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                        Customer Addresses
                    </Link>

                    <Link
                        href="/admin/customers/activity"
                        className="rounded-lg border border-gray-200 p-3 text-sm font-medium text-gray-700 transition hover:border-blue-400 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                        Customer Activity
                    </Link>

                    <Link
                        href="/admin/customers/sessions"
                        className="rounded-lg border border-gray-200 p-3 text-sm font-medium text-gray-700 transition hover:border-blue-400 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                        Customer Sessions
                    </Link>

                    <Link
                        href="/admin/customers/notification-preferences"
                        className="rounded-lg border border-gray-200 p-3 text-sm font-medium text-gray-700 transition hover:border-blue-400 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                        Notification Preferences
                    </Link>
                </div>
            </div>
        </section>
    );
}
