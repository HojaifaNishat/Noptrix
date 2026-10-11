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

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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

            router.push("/owner/verify-secret");
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
        <main className="relative min-h-screen overflow-hidden bg-white text-slate-900">
            {/* Background decoration */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-50/80 blur-3xl"
            />

            <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-50/70 blur-3xl"
            />

            {/* Header */}
            <header className="relative z-10 flex h-20 items-center justify-between border-b border-slate-100 px-6 sm:px-10 lg:px-16">
                <Link
                    href="/"
                    aria-label="NOPTRIX home"
                    className="inline-flex items-center gap-3"
                >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-lg font-bold text-white shadow-sm">
                        N
                    </span>

                    <span className="text-xl font-bold tracking-[0.16em] text-slate-950">
                        NOPTRIX
                    </span>
                </Link>

                <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4 text-emerald-600"
                    >
                        <path
                            d="M7 10V7a5 5 0 0 1 10 0v3M6 10h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>

                    Secure Owner Portal
                </div>
            </header>

            {/* Split screen */}
            <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1600px] lg:grid-cols-2">
                {/* Left branding panel */}
                <section className="relative hidden flex-col justify-center px-12 py-16 lg:flex xl:px-24">
                    <div className="max-w-xl">
                        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                            <span className="h-2 w-2 rounded-full bg-blue-600" />
                            Centralized Management
                        </div>

                        <h1 className="text-5xl font-semibold leading-[1.15] tracking-tight text-slate-950 xl:text-6xl">
                            One secure place
                            <br />
                            to manage your
                            <span className="mt-2 block text-blue-700">
                                entire business.
                            </span>
                        </h1>

                        <p className="mt-7 max-w-lg text-base leading-8 text-slate-500 xl:text-lg">
                            Access your NOPTRIX owner dashboard
                            with a secure sign-in experience
                            designed for control, clarity, and
                            confidence.
                        </p>

                        {/* Feature cards */}
                        <div className="mt-12 grid max-w-lg gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm shadow-slate-200/40">
                                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                    <svg
                                        aria-hidden="true"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        className="h-5 w-5"
                                    >
                                        <path
                                            d="M12 3 4.5 6v5.5c0 4.7 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.8 7.5-9.5V6L12 3Z"
                                            stroke="currentColor"
                                            strokeWidth="1.7"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="m9 12 2 2 4-4"
                                            stroke="currentColor"
                                            strokeWidth="1.7"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>

                                <h2 className="font-semibold text-slate-900">
                                    Secure access
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Protected authentication for
                                    your owner account.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm shadow-slate-200/40">
                                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                                    <svg
                                        aria-hidden="true"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        className="h-5 w-5"
                                    >
                                        <rect
                                            x="3"
                                            y="3"
                                            width="7"
                                            height="7"
                                            rx="1.5"
                                            stroke="currentColor"
                                            strokeWidth="1.7"
                                        />
                                        <rect
                                            x="14"
                                            y="3"
                                            width="7"
                                            height="7"
                                            rx="1.5"
                                            stroke="currentColor"
                                            strokeWidth="1.7"
                                        />
                                        <rect
                                            x="3"
                                            y="14"
                                            width="7"
                                            height="7"
                                            rx="1.5"
                                            stroke="currentColor"
                                            strokeWidth="1.7"
                                        />
                                        <rect
                                            x="14"
                                            y="14"
                                            width="7"
                                            height="7"
                                            rx="1.5"
                                            stroke="currentColor"
                                            strokeWidth="1.7"
                                        />
                                    </svg>
                                </div>

                                <h2 className="font-semibold text-slate-900">
                                    Full control
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    A dedicated entry point for
                                    owner-level operations.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-8 left-12 text-xs text-slate-400 xl:left-24">
                        NOPTRIX · Owner Administration
                    </div>
                </section>

                {/* Right login panel */}
                <section className="flex items-center justify-center px-5 py-12 sm:px-10 lg:justify-end lg:px-12 xl:px-24">
                    <div className="w-full max-w-md lg:mr-0">
                        {/* Mobile heading */}
                        <div className="mb-9 lg:hidden">
                            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                                <svg
                                    aria-hidden="true"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    className="h-6 w-6"
                                >
                                    <path
                                        d="M12 3 4.5 6v5.5c0 4.7 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.8 7.5-9.5V6L12 3Z"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="m9 12 2 2 4-4"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>

                            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
                                Owner Portal
                            </p>

                            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                                Welcome back
                            </h1>

                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                Sign in to securely access your
                                NOPTRIX owner account.
                            </p>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-9">
                            <div className="mb-8 hidden lg:block">
                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                                    <svg
                                        aria-hidden="true"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        className="h-6 w-6"
                                    >
                                        <path
                                            d="M12 3 4.5 6v5.5c0 4.7 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.8 7.5-9.5V6L12 3Z"
                                            stroke="currentColor"
                                            strokeWidth="1.7"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="m9 12 2 2 4-4"
                                            stroke="currentColor"
                                            strokeWidth="1.7"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>

                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                                    Owner Portal
                                </p>

                                <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                                    Welcome back
                                </h2>

                                <p className="mt-3 text-sm leading-6 text-slate-500">
                                    Enter your credentials to
                                    continue to your secure account.
                                </p>
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="space-y-5"
                            >
                                {/* Email */}
                                <div>
                                    <label
                                        htmlFor="owner-email"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Email address
                                    </label>

                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                            <svg
                                                aria-hidden="true"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                className="h-5 w-5"
                                            >
                                                <rect
                                                    x="3"
                                                    y="5"
                                                    width="18"
                                                    height="14"
                                                    rx="2"
                                                    stroke="currentColor"
                                                    strokeWidth="1.7"
                                                />
                                                <path
                                                    d="m4 7 8 6 8-6"
                                                    stroke="currentColor"
                                                    strokeWidth="1.7"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </div>

                                        <input
                                            id="owner-email"
                                            name="email"
                                            type="email"
                                            autoComplete="username"
                                            autoCapitalize="none"
                                            spellCheck={false}
                                            value={email}
                                            onChange={(event) =>
                                                setEmail(event.target.value)
                                            }
                                            required
                                            disabled={loading}
                                            placeholder="you@company.com"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <label
                                            htmlFor="owner-password"
                                            className="block text-sm font-semibold text-slate-700"
                                        >
                                            Password
                                        </label>

                                        <Link
                                            href="/owner/forgot-password"
                                            className="text-xs font-semibold text-blue-700 transition hover:text-blue-800 hover:underline"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>

                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                            <svg
                                                aria-hidden="true"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                className="h-5 w-5"
                                            >
                                                <rect
                                                    x="4"
                                                    y="10"
                                                    width="16"
                                                    height="11"
                                                    rx="2"
                                                    stroke="currentColor"
                                                    strokeWidth="1.7"
                                                />
                                                <path
                                                    d="M8 10V7a4 4 0 1 1 8 0v3"
                                                    stroke="currentColor"
                                                    strokeWidth="1.7"
                                                    strokeLinecap="round"
                                                />
                                                <path
                                                    d="M12 14v3"
                                                    stroke="currentColor"
                                                    strokeWidth="1.7"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        </div>

                                        <input
                                            id="owner-password"
                                            name="password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            autoComplete="current-password"
                                            value={password}
                                            onChange={(event) =>
                                                setPassword(event.target.value)
                                            }
                                            required
                                            disabled={loading}
                                            placeholder="Enter your password"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword((current) => !current)
                                            }
                                            disabled={loading}
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                            aria-pressed={showPassword}
                                            className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition hover:text-slate-700 focus:outline-none focus-visible:text-blue-700 disabled:cursor-not-allowed"
                                        >
                                            {showPassword ? (
                                                <svg
                                                    aria-hidden="true"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    className="h-5 w-5"
                                                >
                                                    <path
                                                        d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8"
                                                        stroke="currentColor"
                                                        strokeWidth="1.7"
                                                        strokeLinecap="round"
                                                    />
                                                    <path
                                                        d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.5 5.1 9 7-.2.8-1 2-2.2 3.2M6.2 6.2C3.9 7.8 2.3 10.3 3 12c.5 1.9 3.8 7 9 7 1 0 2-.2 2.9-.5"
                                                        stroke="currentColor"
                                                        strokeWidth="1.7"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            ) : (
                                                <svg
                                                    aria-hidden="true"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    className="h-5 w-5"
                                                >
                                                    <path
                                                        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
                                                        stroke="currentColor"
                                                        strokeWidth="1.7"
                                                        strokeLinejoin="round"
                                                    />
                                                    <circle
                                                        cx="12"
                                                        cy="12"
                                                        r="3"
                                                        stroke="currentColor"
                                                        strokeWidth="1.7"
                                                    />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Error message */}
                                {error && (
                                    <div
                                        role="alert"
                                        aria-live="polite"
                                        className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                                    >
                                        <svg
                                            aria-hidden="true"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            className="mt-0.5 h-5 w-5 shrink-0"
                                        >
                                            <circle
                                                cx="12"
                                                cy="12"
                                                r="9"
                                                stroke="currentColor"
                                                strokeWidth="1.7"
                                            />
                                            <path
                                                d="M12 8v5m0 3h.01"
                                                stroke="currentColor"
                                                strokeWidth="1.7"
                                                strokeLinecap="round"
                                            />
                                        </svg>

                                        <p>{error}</p>
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group flex w-full items-center justify-center gap-3 rounded-xl bg-blue-700 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition duration-200 hover:bg-blue-800 hover:shadow-xl hover:shadow-blue-700/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none"
                                >
                                    {loading ? (
                                        <>
                                            <svg
                                                aria-hidden="true"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                className="h-5 w-5 animate-spin"
                                            >
                                                <circle
                                                    cx="12"
                                                    cy="12"
                                                    r="9"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                    className="opacity-25"
                                                />
                                                <path
                                                    d="M21 12a9 9 0 0 0-9-9"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    className="opacity-90"
                                                />
                                            </svg>

                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            Sign in securely

                                            <svg
                                                aria-hidden="true"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
                                            >
                                                <path
                                                    d="M5 12h14m-6-6 6 6-6 6"
                                                    stroke="currentColor"
                                                    strokeWidth="1.8"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Security note */}
                            <div className="mt-7 flex items-start justify-center gap-2 border-t border-slate-100 pt-5 text-center text-xs leading-5 text-slate-500">
                                <svg
                                    aria-hidden="true"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                                >
                                    <path
                                        d="M12 3 4.5 6v5.5c0 4.7 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.8 7.5-9.5V6L12 3Z"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="m9 12 2 2 4-4"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>

                                <span>
                                    Your owner account is protected by
                                    NOPTRIX security controls.
                                </span>
                            </div>
                        </div>

                        <p className="mt-7 text-center text-xs text-slate-400">
                            © {new Date().getFullYear()} NOPTRIX.
                            All rights reserved.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}