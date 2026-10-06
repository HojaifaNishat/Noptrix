"use client";

import {
    FormEvent,
    useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
    customerLogin,
} from "@/features/auth/auth-actions";

import {
    getPostAuthRedirect,
} from "@/lib/auth/auth-redirect";


export default function CustomerLoginForm() {

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
        event: FormEvent<HTMLFormElement>
    ) => {

        event.preventDefault();

        setError("");
        setLoading(true);

        try {

            await customerLogin({
                email,
                password,
            });

            router.push(
                getPostAuthRedirect("/account"),
            );

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : "Login failed. Please try again."
            );

        } finally {

            setLoading(false);
        }
    };


    return (
        <div className="w-full max-w-md">

            <div className="mb-8 text-center">

                <h1 className="text-3xl font-bold">
                    Welcome back
                </h1>

                <p className="mt-2 text-sm text-gray-600">
                    Sign in to your NOPTRIX account.
                </p>

            </div>


            <form
                onSubmit={handleSubmit}
                className="space-y-5"
            >

                <div>

                    <label
                        htmlFor="customer-email"
                        className="mb-2 block text-sm font-medium"
                    >
                        Email
                    </label>

                    <input
                        id="customer-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) =>
                            setEmail(event.target.value)
                        }
                        required
                        className="w-full rounded-lg border px-4 py-3 outline-none"
                        placeholder="you@example.com"
                    />

                </div>


                <div>

                    <label
                        htmlFor="customer-password"
                        className="mb-2 block text-sm font-medium"
                    >
                        Password
                    </label>

                    <input
                        id="customer-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        required
                        className="w-full rounded-lg border px-4 py-3 outline-none"
                        placeholder="Enter your password"
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

                <span className="text-gray-600">
                    Don&apos;t have an account?{" "}
                </span>

                <Link
                    href="/customer/register"
                    className="font-medium underline"
                >
                    Create account
                </Link>

            </div>

        </div>
    );
}
