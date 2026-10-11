"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ShieldCheck,
    LockKeyhole,
    Eye,
    EyeOff,
    ArrowRight,
    Shield,
    Fingerprint,
    AlertCircle,
    LoaderCircle,
    CheckCircle2,
} from "lucide-react";

import { ownerVerifySecret } from "@/features/auth/auth-actions";

export default function OwnerVerifySecretForm() {
    const router = useRouter();

    const [secretCode, setSecretCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showSecret, setShowSecret] = useState(false);

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        setError("");

        if (!secretCode.trim()) {
            setError("Please enter your owner secret.");
            return;
        }

        try {
            setLoading(true);

            await ownerVerifySecret(secretCode.trim());

            router.replace("/owner");
        } catch (verificationError: unknown) {
            setError(
                verificationError instanceof Error
                    ? verificationError.message
                    : "Secret verification failed. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative min-h-screen overflow-hidden bg-white text-slate-900">
            {/* Ambient background */}
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
                <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:px-12">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-lg font-black text-white shadow-lg shadow-blue-700/20">
                            N
                        </div>

                        <div>
                            <p className="text-lg font-extrabold tracking-[0.12em] text-slate-900">
                                NOPTRIX
                            </p>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                Business platform
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:px-4">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="hidden sm:inline">
                            Owner security
                        </span>
                        <span className="sm:hidden">Secure</span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1600px] lg:grid-cols-2">
                {/* Left branding panel */}
                <section className="hidden flex-col justify-center px-12 py-16 lg:flex xl:px-24">
                    <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                        <ShieldCheck className="h-4 w-4" />
                        Privileged account protection
                    </div>

                    <h1 className="max-w-xl text-5xl font-extrabold leading-[1.12] tracking-tight text-slate-950 xl:text-6xl">
                        Your business.
                        <span className="mt-2 block text-blue-700">
                            Your control.
                        </span>
                    </h1>

                    <p className="mt-7 max-w-lg text-lg leading-8 text-slate-500">
                        Complete your identity verification to securely
                        enter the NOPTRIX Owner Console and manage your
                        business operations.
                    </p>

                    <div className="mt-12 space-y-4">
                        <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm shadow-slate-200/30">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                <LockKeyhole className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="font-bold text-slate-900">
                                    Privileged access
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    An additional verification step protects
                                    sensitive owner-level operations.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm shadow-slate-200/30">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                                <Fingerprint className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="font-bold text-slate-900">
                                    Private credentials
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Keep your owner secret private and never
                                    share it with anyone.
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="mt-12 text-xs text-slate-400">
                        NOPTRIX · Owner administration
                    </p>
                </section>

                {/* Verification card */}
                <section className="flex items-center justify-center px-5 py-12 sm:px-8 lg:justify-end lg:px-12 xl:px-24">
                    <div className="w-full max-w-[480px]">
                        <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 lg:hidden">
                            <span className="h-px flex-1 bg-slate-200" />
                            Secure Owner Portal
                            <span className="h-px flex-1 bg-slate-200" />
                        </div>

                        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl shadow-slate-200/60 sm:p-9">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                                <ShieldCheck className="h-7 w-7" />
                            </div>

                            <div className="mt-7">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                                    Identity verification
                                </p>

                                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                                    Verify owner secret
                                </h2>

                                <p className="mt-3 text-sm leading-6 text-slate-500">
                                    Enter your private owner secret to
                                    continue to the control center.
                                </p>
                            </div>

                            <div className="mt-7 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
                                    <Shield className="h-5 w-5" />
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-slate-800">
                                        Owner-only access
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        Authorized credentials are required
                                        to proceed.
                                    </p>
                                </div>
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="mt-7 space-y-5"
                            >
                                <div>
                                    <label
                                        htmlFor="owner-secret"
                                        className="mb-3 block text-sm font-bold text-slate-800"
                                    >
                                        Owner secret
                                    </label>

                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                            <LockKeyhole className="h-5 w-5" />
                                        </div>

                                        <input
                                            id="owner-secret"
                                            name="secretCode"
                                            type={showSecret ? "text" : "password"}
                                            value={secretCode}
                                            onChange={(event) => {
                                                setSecretCode(event.target.value);
                                                if (error) setError("");
                                            }}
                                            autoComplete="current-password"
                                            placeholder="Enter your owner secret"
                                            disabled={loading}
                                            required
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-4 pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowSecret((visible) => !visible)
                                            }
                                            disabled={loading}
                                            aria-label={
                                                showSecret
                                                    ? "Hide owner secret"
                                                    : "Show owner secret"
                                            }
                                            className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition hover:text-slate-700 disabled:opacity-50"
                                        >
                                            {showSecret ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>

                                    <p className="mt-3 text-xs leading-5 text-slate-400">
                                        Enter the secret configured for your
                                        owner account.
                                    </p>
                                </div>

                                {error && (
                                    <div
                                        role="alert"
                                        className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700"
                                    >
                                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !secretCode.trim()}
                                    className="group flex w-full items-center justify-center gap-3 rounded-xl bg-blue-700 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-xl hover:shadow-blue-700/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                                >
                                    {loading ? (
                                        <>
                                            <LoaderCircle className="h-5 w-5 animate-spin" />
                                            Verifying securely...
                                        </>
                                    ) : (
                                        <>
                                            Verify and continue
                                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                                <p className="text-xs leading-5 text-slate-500">
                                    <span className="font-bold text-slate-700">
                                        Keep it confidential.
                                    </span>{" "}
                                    Never disclose your owner secret. If you
                                    suspect it has been compromised, secure
                                    your account immediately.
                                </p>
                            </div>
                        </div>

                        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
                            Protected by NOPTRIX security systems.
                            <br />
                            Authorized owner access only.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}