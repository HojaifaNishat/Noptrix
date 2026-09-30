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
    ownerLogin,
} from "@/features/auth/auth-actions";

export default function OwnerLoginForm() {

    const router = useRouter();

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

            await ownerLogin({
                email,
                password,
            });

            router.push(
                "/owner/verify-secret",
            );

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
                    Owner Login
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
                        htmlFor="owner-email"
                        className="mb-2 block text-sm font-medium"
                    >
                        Email
                    </label>

                    <input
                        id="owner-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) =>
                            setEmail(event.target.value)
                        }
                        required
                        className="w-full rounded-lg border px-4 py-3 outline-none"
                        placeholder="Owner email"
                    />

                </div>

                <div>

                    <label
                        htmlFor="owner-password"
                        className="mb-2 block text-sm font-medium"
                    >
                        Password
                    </label>

                    <input
                        id="owner-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        required
                        className="w-full rounded-lg border px-4 py-3 outline-none"
                        placeholder="Owner password"
                    />

                </div>

                {error && (
                    <p
                        role="alert"
                        className="text-sm text-red-600"
                    >
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
                >
                    {loading
                        ? "Signing in..."
                        : "Sign in"}
                </button>

            </form>

            <div className="mt-6 text-center text-sm">

                <Link
                    href="/owner/forgot-password"
                    className="font-medium underline"
                >
                    Forgot password?
                </Link>

            </div>

        </div>
    );
}