"use client";

import {
    useEffect,
    useState,
} from "react";

import Link from "next/link";

import {
    customerAuthApi,
} from "@/services/api/customer-auth.api";

import type {
    AuthUser,
} from "@/types/auth";

export default function AccountPage() {
    const [user, setUser] =
        useState<AuthUser | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        const loadCustomer =
            async () => {
                try {
                    const customer =
                        await customerAuthApi.getMe();

                    setUser(customer);
                } catch (error) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Unable to load your account.",
                    );
                } finally {
                    setLoading(false);
                }
            };

        void loadCustomer();
    }, []);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center px-4">
                <p className="text-gray-600">
                    Loading your account...
                </p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">
                        Unable to load account
                    </h1>

                    <p className="mt-3 text-sm text-red-600">
                        {error}
                    </p>

                    <Link
                        href="/customer/login"
                        className="mt-6 inline-block font-medium underline"
                    >
                        Back to login
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen px-4 py-12">
            <div className="mx-auto max-w-3xl">
                <h1 className="text-3xl font-bold">
                    My Account
                </h1>

                <div className="mt-8 rounded-xl border p-6">
                    <h2 className="text-xl font-semibold">
                        {user?.name ?? "Customer"}
                    </h2>

                    <div className="mt-4 space-y-2 text-sm">
                        <p>
                            <span className="font-medium">
                                Email:
                            </span>{" "}
                            {user?.email}
                        </p>

                        {user?.phone && (
                            <p>
                                <span className="font-medium">
                                    Phone:
                                </span>{" "}
                                {user.phone}
                            </p>
                        )}

                        <p>
                            <span className="font-medium">
                                Account:
                            </span>{" "}
                            {user?.accountType}
                        </p>
                    </div>
                </div>

                <div className="mt-6">
                    <Link
                        href="/"
                        className="font-medium underline"
                    >
                        Continue shopping
                    </Link>
                </div>
            </div>
        </main>
    );
}
