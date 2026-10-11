"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Mail, ShieldCheck } from "lucide-react";
import { adminAuthApi } from "@/services/api/admin-auth.api";

export default function AdminForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            await adminAuthApi.forgotPassword(email);
            setSuccess(true);
        } catch (err: unknown) {
            const message =
                err && typeof err === "object" && "response" in err
                    ? (err as { response?: { data?: { message?: string } } })
                          .response?.data?.message
                    : undefined;

            setError(
                typeof message === "string"
                    ? message
                    : "Unable to process your request. Please try again.",
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
                        Forgot your password?
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                        Enter the email address associated with your admin account.
                        If eligible, you will receive a password reset code.
                    </p>
                </div>

                {success ? (
                    <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                        <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
                        <h2 className="mt-3 font-semibold text-emerald-950">Check your email</h2>
                        <p className="mt-2 text-sm leading-6 text-emerald-800">
                            If an eligible admin account exists for this address,
                            password reset instructions will be sent.
                        </p>
                        <Link
                            href="/admin/reset-password"
                            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                            Enter reset code
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="admin-email" className="mb-2 block text-sm font-semibold text-slate-700">
                                Admin email address
                            </label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    id="admin-email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    placeholder="admin@yourcompany.com"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    required
                                    maxLength={254}
                                    disabled={loading}
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60"
                                />
                            </div>
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
                            {loading ? <><Loader2 size={18} className="animate-spin" /> Sending request...</> : "Request password reset"}
                        </button>
                    </form>
                )}

                <div className="mt-7 border-t border-slate-100 pt-5">
                    <Link href="/admin/login" className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
                        <ArrowLeft size={16} /> Back to Admin Login
                    </Link>
                </div>
                <p className="mt-6 text-center text-xs leading-5 text-slate-400">
                    Protected administration access · NOPTRIX Security
                </p>
            </section>
        </main>
    );
}
