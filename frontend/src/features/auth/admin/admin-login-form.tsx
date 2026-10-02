"use client";

import {
    FormEvent,
    useState,
} from "react";

import {
    useRouter,
} from "next/navigation";

import Link from "next/link";

import {
    adminLogin,
} from "@/features/auth/auth-actions";

export default function AdminLoginForm() {
    const router =
        useRouter();

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            await adminLogin({
                email,
                password,
            });

            router.push("/admin");
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Login failed. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold">
                    Admin Login
                </h1>

                <p className="mt-2 text-sm text-gray-600">
                    Sign in to the NOPTRIX administration system.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-5"
            >
                <div>
                    <label
                        htmlFor="admin-email"
                        className="mb-2 block text-sm font-medium"
                    >
                        Email
                    </label>

                    <input
                        id="admin-email"
                        type="email"
                        value={email}
                        onChange={(event) =>
                            setEmail(
                                event.target.value,
                            )
                        }
                        autoComplete="email"
                        required
                        className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
                    />
                </div>

                <div>
                    <label
                        htmlFor="admin-password"
                        className="mb-2 block text-sm font-medium"
                    >
                        Password
                    </label>

                    <input
                        id="admin-password"
                        type="password"
                        value={password}
                        onChange={(event) =>
                            setPassword(
                                event.target.value,
                            )
                        }
                        autoComplete="current-password"
                        required
                        className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
                    />
                </div>

                {error && (
                    <p
                        role="alert"
                        className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600"
                    >
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={
                        loading ||
                        !email ||
                        !password
                    }
                    className="w-full rounded-md bg-black px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading
                        ? "Signing in..."
                        : "Sign in"}
                </button>
            </form>

            <div className="mt-6 text-center text-sm">
                <Link
                    href="/owner"
                    className="font-medium underline"
                >
                    Owner Login
                </Link>
            </div>
        </div>
    );
}
