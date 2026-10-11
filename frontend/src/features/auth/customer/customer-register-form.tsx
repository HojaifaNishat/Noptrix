"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    Eye,
    EyeOff,
    ShoppingBag,
    UserRound,
    Mail,
    Phone,
    LockKeyhole,
    ShieldCheck,
    Sparkles,
    AlertCircle,
    LoaderCircle,
    CheckCircle2,
} from "lucide-react";

import { customerRegister } from "@/features/auth/auth-actions";

export default function CustomerRegisterForm() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const passwordsMatch =
        confirmPassword.length === 0 ||
        password === confirmPassword;

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 8 || password.length > 128) {
            setError("Password must be between 8 and 128 characters.");
            return;
        }

        setLoading(true);

        try {
            const result = await customerRegister({
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim() || undefined,
                password,
            });

            router.push(
                `/customer/verify-email?registrationId=${encodeURIComponent(
                    result.registrationId,
                )}&email=${encodeURIComponent(result.email)}`,
            );
        } catch (registrationError: unknown) {
            setError(
                registrationError instanceof Error
                    ? registrationError.message
                    : "Registration failed. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative min-h-screen overflow-hidden bg-white text-slate-900">
            {/* Background */}
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
                        href="/customer/login"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                        Sign in
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </header>

            {/* Main content */}
            <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1440px] lg:grid-cols-2">
                {/* Branding panel */}
                <section className="hidden flex-col justify-center px-12 py-16 lg:flex xl:px-24">
                    <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                        <Sparkles className="h-4 w-4" />
                        Your shopping journey starts here
                    </div>

                    <h1 className="max-w-xl text-5xl font-extrabold leading-[1.12] tracking-tight text-slate-950 xl:text-6xl">
                        Discover more.
                        <span className="mt-2 block text-blue-700">
                            Enjoy every find.
                        </span>
                    </h1>

                    <p className="mt-7 max-w-lg text-lg leading-8 text-slate-500">
                        Create your NOPTRIX account and bring your
                        shopping experience together in one convenient
                        place.
                    </p>

                    <div className="mt-12 space-y-4">
                        <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm shadow-slate-200/30">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                <ShoppingBag className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="font-bold text-slate-900">
                                    Your personal shopping space
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Access your customer account and
                                    manage your shopping in one place.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm shadow-slate-200/30">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                                <Mail className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="font-bold text-slate-900">
                                    Verify your email
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Complete email verification to
                                    continue your registration.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm shadow-slate-200/30">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                <ShieldCheck className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="font-bold text-slate-900">
                                    Your account, protected
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Use a strong, private password to
                                    protect your account.
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="mt-12 text-xs text-slate-400">
                        NOPTRIX · Shopping made simpler
                    </p>
                </section>

                {/* Registration form */}
                <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:justify-end lg:px-12 xl:px-24">
                    <div className="w-full max-w-[480px]">
                        <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 lg:hidden">
                            <span className="h-px flex-1 bg-slate-200" />
                            Customer registration
                            <span className="h-px flex-1 bg-slate-200" />
                        </div>

                        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl shadow-slate-200/60 sm:p-9">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                                <UserRound className="h-7 w-7" />
                            </div>

                            <div className="mt-6">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                                    Join the community
                                </p>

                                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                                    Create account
                                </h2>

                                <p className="mt-3 text-sm leading-6 text-slate-500">
                                    Fill in your details to get started
                                    with NOPTRIX.
                                </p>
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="mt-7 space-y-4"
                            >
                                {/* Full name */}
                                <div>
                                    <label
                                        htmlFor="customer-name"
                                        className="mb-2 block text-sm font-bold text-slate-800"
                                    >
                                        Full name
                                    </label>

                                    <div className="relative">
                                        <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                                        <input
                                            id="customer-name"
                                            name="name"
                                            type="text"
                                            autoComplete="name"
                                            value={name}
                                            onChange={(event) => {
                                                setName(event.target.value);
                                                if (error) setError("");
                                            }}
                                            required
                                            minLength={2}
                                            maxLength={100}
                                            disabled={loading}
                                            placeholder="Enter your full name"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label
                                        htmlFor="customer-email"
                                        className="mb-2 block text-sm font-bold text-slate-800"
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
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label
                                        htmlFor="customer-phone"
                                        className="mb-2 block text-sm font-bold text-slate-800"
                                    >
                                        Phone number{" "}
                                        <span className="font-normal text-slate-400">
                                            (optional)
                                        </span>
                                    </label>

                                    <div className="relative">
                                        <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                                        <input
                                            id="customer-phone"
                                            name="phone"
                                            type="tel"
                                            autoComplete="tel"
                                            value={phone}
                                            onChange={(event) =>
                                                setPhone(event.target.value)
                                            }
                                            maxLength={11}
                                            disabled={loading}
                                            placeholder="01XXXXXXXXX"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label
                                        htmlFor="customer-password"
                                        className="mb-2 block text-sm font-bold text-slate-800"
                                    >
                                        Password
                                    </label>

                                    <div className="relative">
                                        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                                        <input
                                            id="customer-password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="new-password"
                                            value={password}
                                            onChange={(event) => {
                                                setPassword(event.target.value);
                                                if (error) setError("");
                                            }}
                                            required
                                            minLength={8}
                                            maxLength={128}
                                            disabled={loading}
                                            placeholder="Create a strong password"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-12 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
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
                                            className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition hover:text-slate-700"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>

                                    <p className="mt-2 text-xs text-slate-400">
                                        Use 8–128 characters.
                                    </p>
                                </div>

                                {/* Confirm password */}
                                <div>
                                    <label
                                        htmlFor="customer-confirm-password"
                                        className="mb-2 block text-sm font-bold text-slate-800"
                                    >
                                        Confirm password
                                    </label>

                                    <div className="relative">
                                        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                                        <input
                                            id="customer-confirm-password"
                                            name="confirmPassword"
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            autoComplete="new-password"
                                            value={confirmPassword}
                                            onChange={(event) => {
                                                setConfirmPassword(
                                                    event.target.value,
                                                );
                                                if (error) setError("");
                                            }}
                                            required
                                            minLength={8}
                                            maxLength={128}
                                            disabled={loading}
                                            aria-invalid={!passwordsMatch}
                                            placeholder="Enter your password again"
                                            className={`w-full rounded-xl border bg-slate-50/70 py-3.5 pl-12 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 disabled:opacity-60 ${
                                                !passwordsMatch
                                                    ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
                                                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
                                            }`}
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    (visible) => !visible,
                                                )
                                            }
                                            disabled={loading}
                                            aria-label={
                                                showConfirmPassword
                                                    ? "Hide confirmation password"
                                                    : "Show confirmation password"
                                            }
                                            className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition hover:text-slate-700"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>

                                    {confirmPassword && (
                                        <p
                                            className={`mt-2 flex items-center gap-1.5 text-xs ${
                                                passwordsMatch
                                                    ? "text-emerald-600"
                                                    : "text-red-600"
                                            }`}
                                        >
                                            {passwordsMatch ? (
                                                <>
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Passwords match
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                    Passwords do not match
                                                </>
                                            )}
                                        </p>
                                    )}
                                </div>

                                {/* Error message */}
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
                                        !name.trim() ||
                                        !email.trim() ||
                                        !password ||
                                        !confirmPassword ||
                                        !passwordsMatch
                                    }
                                    className="group flex w-full items-center justify-center gap-3 rounded-xl bg-blue-700 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-xl hover:shadow-blue-700/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                                >
                                    {loading ? (
                                        <>
                                            <LoaderCircle className="h-5 w-5 animate-spin" />
                                            Creating your account...
                                        </>
                                    ) : (
                                        <>
                                            Create customer account
                                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Existing customer */}
                            <div className="mt-6 border-t border-slate-100 pt-6 text-center">
                                <p className="text-sm text-slate-500">
                                    Already have an account?
                                </p>

                                <Link
                                    href="/customer/login"
                                    className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-blue-700 transition hover:text-blue-900"
                                >
                                    Sign in instead
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>

                            {/* Privacy note */}
                            <div className="mt-5 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                                <p className="text-xs leading-5 text-slate-500">
                                    <span className="font-bold text-slate-700">
                                        Your information matters.
                                    </span>{" "}
                                    Use your own email address and keep your
                                    password private.
                                </p>
                            </div>
                        </div>

                        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
                            © {new Date().getFullYear()} NOPTRIX.
                            <br />
                            A simpler way to shop.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}