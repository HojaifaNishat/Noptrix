"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    Eye,
    EyeOff,
    ShoppingBag,
    ShieldCheck,
    Truck,
    Heart,
    Mail,
    LockKeyhole,
    AlertCircle,
    LoaderCircle,
    Sparkles,
} from "lucide-react";

import { customerLogin } from "@/features/auth/auth-actions";
import { getPostAuthRedirect } from "@/lib/auth/auth-redirect";

export default function CustomerLoginForm() {
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
            await customerLogin({
                email: email.trim(),
                password,
            });

            router.push(getPostAuthRedirect("/account"));
        } catch (loginError: unknown) {
            setError(
                loginError instanceof Error
                    ? loginError.message
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
                className="pointer-events-none absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-blue-100/60 blur-3xl"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-40 -right-32 h-[480px] w-[480px] rounded-full bg-indigo-100/50 blur-3xl"
            />

            {/* Header */}
            <header className="relative z-10 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
                <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
                    <Link
                        href="/"
                        className="flex items-center gap-3"
                        aria-label="NOPTRIX home"
                    >
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-lg font-black text-white shadow-lg shadow-blue-700/20">
                            N
                        </span>

                        <span>
                            <span className="block text-lg font-extrabold tracking-[0.12em] text-slate-900">
                                NOPTRIX
                            </span>
                            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                Your everyday marketplace
                            </span>
                        </span>
                    </Link>

                    <Link
                        href="/customer/register"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                        Create account
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </header>

            {/* Main */}
            <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1440px] lg:grid-cols-2">
                {/* Customer welcome panel */}
                <section className="hidden flex-col justify-center px-12 py-16 lg:flex xl:px-24">
                    <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                        <Sparkles className="h-4 w-4" />
                        A better way to shop
                    </div>

                    <h1 className="max-w-xl text-5xl font-extrabold leading-[1.12] tracking-tight text-slate-950 xl:text-6xl">
                        Your next
                        <span className="mt-2 block text-blue-700">
                            favorite find.
                        </span>
                    </h1>

                    <p className="mt-7 max-w-lg text-lg leading-8 text-slate-500">
                        Welcome back to NOPTRIX. Sign in to explore
                        products, manage your orders, and keep everything
                        you love in one place.
                    </p>

                    {/* Benefits */}
                    <div className="mt-12 space-y-4">
                        <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm shadow-slate-200/30">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                <ShoppingBag className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="font-bold text-slate-900">
                                    Your shopping, all in one place
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Keep track of your account and orders
                                    from one convenient destination.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm shadow-slate-200/30">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                                <Heart className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="font-bold text-slate-900">
                                    Keep your favorites close
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Return to the products and experiences
                                    that matter to you.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm shadow-slate-200/30">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                <Truck className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="font-bold text-slate-900">
                                    Stay connected to your orders
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Sign in to access your customer account
                                    and available order information.
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="mt-12 text-xs text-slate-400">
                        NOPTRIX · Shopping made simpler
                    </p>
                </section>

                {/* Login panel */}
                <section className="flex items-center justify-center px-5 py-12 sm:px-8 lg:justify-end lg:px-12 xl:px-24">
                    <div className="w-full max-w-[460px]">
                        <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 lg:hidden">
                            <span className="h-px flex-1 bg-slate-200" />
                            Customer account
                            <span className="h-px flex-1 bg-slate-200" />
                        </div>

                        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl shadow-slate-200/60 sm:p-9">
                            {/* Welcome icon */}
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                                <ShoppingBag className="h-7 w-7" />
                            </div>

                            <div className="mt-7">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                                    Welcome to NOPTRIX
                                </p>

                                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                                    Welcome back
                                </h2>

                                <p className="mt-3 text-sm leading-6 text-slate-500">
                                    Sign in to your account and pick up
                                    right where you left off.
                                </p>
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="mt-8 space-y-5"
                            >
                                {/* Email */}
                                <div>
                                    <label
                                        htmlFor="customer-email"
                                        className="mb-2.5 block text-sm font-bold text-slate-800"
                                    >
                                        Email address
                                    </label>

                                    <div className="relative">
                                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                                        <input
                                            id="customer-email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            autoCapitalize="none"
                                            spellCheck={false}
                                            value={email}
                                            onChange={(event) => {
                                                setEmail(event.target.value);
                                                if (error) setError("");
                                            }}
                                            required
                                            disabled={loading}
                                            placeholder="you@example.com"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <div className="mb-2.5 flex items-center justify-between gap-3">
                                        <label
                                            htmlFor="customer-password"
                                            className="text-sm font-bold text-slate-800"
                                        >
                                            Password
                                        </label>

                                        <Link
                                            href="/customer/forgot-password"
                                            className="text-xs font-semibold text-blue-700 transition hover:text-blue-900"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>

                                    <div className="relative">
                                        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                                        <input
                                            id="customer-password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            value={password}
                                            onChange={(event) => {
                                                setPassword(event.target.value);
                                                if (error) setError("");
                                            }}
                                            required
                                            disabled={loading}
                                            placeholder="Enter your password"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword((visible) => !visible)
                                            }
                                            disabled={loading}
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                            className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition hover:text-slate-700 disabled:opacity-50"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div
                                        role="alert"
                                        className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700"
                                    >
                                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={
                                        loading ||
                                        !email.trim() ||
                                        !password
                                    }
                                    className="group flex w-full items-center justify-center gap-3 rounded-xl bg-blue-700 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-xl hover:shadow-blue-700/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                                >
                                    {loading ? (
                                        <>
                                            <LoaderCircle className="h-5 w-5 animate-spin" />
                                            Signing you in...
                                        </>
                                    ) : (
                                        <>
                                            Sign in to your account
                                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Register */}
                            <div className="mt-7 border-t border-slate-100 pt-6 text-center">
                                <p className="text-sm text-slate-500">
                                    New to NOPTRIX?
                                </p>

                                <Link
                                    href="/customer/register"
                                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                >
                                    Create your customer account
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>

                            {/* Security note */}
                            <div className="mt-6 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                                <p className="text-xs leading-5 text-slate-500">
                                    <span className="font-bold text-slate-700">
                                        Your account matters.
                                    </span>{" "}
                                    Keep your password private and only sign
                                    in through the official NOPTRIX website.
                                </p>
                            </div>
                        </div>

                        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
                            © {new Date().getFullYear()} NOPTRIX.
                            <br />
                            Your account. Your shopping experience.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}