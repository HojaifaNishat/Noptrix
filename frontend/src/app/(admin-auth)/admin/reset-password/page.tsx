"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { adminAuthApi } from "@/services/api/admin-auth.api";
import {
    clearPasswordResetEmail,
    getPasswordResetEmail,
    subscribeToPasswordResetEmail,
} from "@/lib/auth/password-recovery";

export default function AdminResetPasswordPage() {
    const [email, setEmail] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const recoveryEmail = useSyncExternalStore(
        subscribeToPasswordResetEmail,
        getPasswordResetEmail,
        () => null,
    );
    const emailValue = email ?? recoveryEmail ?? "";

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        if (!/^\d{6}$/.test(code.trim())) {
            setError("Enter the 6-digit verification code from your email.");
            return;
        }

        if (newPassword.length < 8) {
            setError("Your new password must be at least 8 characters long.");
            return;
        }

        if (newPassword.length > 128) {
            setError("Your new password must not exceed 128 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("The passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            await adminAuthApi.resetPassword({
                email: emailValue.trim(),
                code: code.trim(),
                newPassword,
            });
            clearPasswordResetEmail();
            setSuccess(true);
            setNewPassword("");
            setConfirmPassword("");
            setCode("");
        } catch (err: unknown) {
            const message =
                err && typeof err === "object" && "response" in err
                    ? (err as { response?: { data?: { message?: string } } })
                          .response?.data?.message
                    : undefined;

            setError(
                typeof message === "string"
                    ? message
                    : "Password reset failed. Check your details and try again.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
            <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
                <div className="mb-8 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                        <ShieldCheck size={28} />
                    </div>
                    <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                        NOPTRIX Administration
                    </p>
                    <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
                        Reset your password
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                        Enter your admin email, the 6-digit code you received,
                        and choose a new password.
                    </p>
                </div>

                {success ? (
                    <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                        <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
                        <h2 className="mt-3 font-semibold text-emerald-950">Password reset successful</h2>
                        <p className="mt-2 text-sm leading-6 text-emerald-800">
                            Your password has been changed. Sign in with your new password.
                        </p>
                        <Link href="/admin/login" className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800">
                            Go to Admin Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="reset-email" className="mb-2 block text-sm font-semibold text-slate-700">
                                Admin email
                            </label>
                            <input
                                id="reset-email"
                                type="email"
                                autoComplete="email"
                                value={emailValue}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                                maxLength={254}
                                disabled={loading}
                                className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60"
                                placeholder="admin@yourcompany.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="reset-code" className="mb-2 block text-sm font-semibold text-slate-700">
                                6-digit email code
                            </label>
                            <input
                                id="reset-code"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                value={code}
                                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                                required
                                pattern="\d{6}"
                                maxLength={6}
                                disabled={loading}
                                className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm tracking-[0.3em] text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60"
                                placeholder="000000"
                            />
                        </div>

                        <div>
                            <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-slate-700">
                                New password
                            </label>
                            <input
                                id="new-password"
                                type="password"
                                autoComplete="new-password"
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                                required
                                minLength={8}
                                maxLength={128}
                                disabled={loading}
                                className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60"
                                placeholder="At least 8 characters"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-slate-700">
                                Confirm new password
                            </label>
                            <input
                                id="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                required
                                minLength={8}
                                maxLength={128}
                                disabled={loading}
                                className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60"
                                placeholder="Enter the password again"
                            />
                        </div>

                        {error && (
                            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? <><Loader2 size={18} className="animate-spin" /> Resetting password...</> : "Reset password"}
                        </button>
                    </form>
                )}

                <div className="mt-7 border-t border-slate-100 pt-5">
                    <Link href="/admin/forgot-password" className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
                        <ArrowLeft size={16} /> Back to Forgot Password
                    </Link>
                </div>
            </section>
        </main>
    );
}
