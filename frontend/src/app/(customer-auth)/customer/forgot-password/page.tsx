
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { customerAuthApi } from "@/services/api/customer-auth.api";
import { savePasswordResetEmail } from "@/lib/auth/password-recovery";

function MailIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function ShieldIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m12 19-7-7 7-7M5 12h14" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M5 12h14m-7-7 7 7-7 7" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5 animate-spin"
      aria-hidden="true"
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
      />
    </svg>
  );
}

export default function CustomerForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Please enter a valid email address.");
      setMessage("");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      await customerAuthApi.forgotPassword(normalizedEmail);
      savePasswordResetEmail(normalizedEmail.toLowerCase());

      setMessage(
        "If an eligible account exists, password recovery instructions will be sent."
      );
    } catch {
      setError("Unable to send recovery instructions. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8fc] text-slate-900">
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-200/30 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 sm:px-8">
        {/* Header */}
        <header className="flex h-20 items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="NOPTRIX home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black tracking-tight text-white shadow-lg shadow-indigo-600/20">
              N
            </span>
            <span className="text-xl font-extrabold tracking-[0.12em] text-slate-900">
              NOPTRIX
            </span>
          </Link>

          <Link
            href="/customer/login"
            className="text-sm font-semibold text-slate-600 transition hover:text-indigo-600"
          >
            Back to login
          </Link>
        </header>

        {/* Main content */}
        <div className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_80px_-30px_rgba(30,41,100,0.22)] lg:grid-cols-2">
            {/* Left visual panel */}
            <section className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#171747] via-[#28266b] to-[#5146bd] p-10 text-white lg:flex xl:p-12">
              <div
                aria-hidden="true"
                className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10"
              />
              <div
                aria-hidden="true"
                className="absolute -right-12 -top-12 h-56 w-56 rounded-full border border-white/10"
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-violet-400/20 blur-2xl"
              />

              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold tracking-wide text-indigo-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  YOUR ACCOUNT, YOUR CONTROL
                </span>

                <h2 className="mt-8 max-w-sm text-4xl font-bold leading-[1.15] tracking-tight xl:text-5xl">
                  A fresh start is just one step away.
                </h2>

                <p className="mt-5 max-w-sm text-sm leading-7 text-indigo-100/80">
                  Forgot your password? It happens. Recover access securely
                  and get back to everything you love about NOPTRIX.
                </p>
              </div>

              {/* Decorative security illustration */}
              <div className="relative mx-auto flex h-64 w-full max-w-sm items-center justify-center">
                <div className="absolute h-56 w-56 rounded-full border border-white/10" />
                <div className="absolute h-40 w-40 rounded-full border border-white/15" />
                <div className="absolute h-28 w-28 rounded-full bg-white/[0.07] blur-sm" />

                <div className="absolute left-7 top-10 flex h-14 w-14 -rotate-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-xl backdrop-blur-xl">
                  <MailIcon className="h-7 w-7 text-indigo-100" />
                </div>

                <div className="absolute bottom-8 right-8 flex h-12 w-12 rotate-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-xl backdrop-blur-xl">
                  <ShieldIcon className="h-6 w-6 text-emerald-300" />
                </div>

                <div className="relative flex h-36 w-36 items-center justify-center rounded-[2rem] border border-white/20 bg-gradient-to-br from-white/20 to-white/[0.04] shadow-2xl shadow-indigo-950/30 backdrop-blur-xl">
                  <div className="absolute inset-2 rounded-[1.5rem] border border-white/10" />
                  <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    className="relative h-24 w-24"
                    aria-hidden="true"
                  >
                    <path
                      d="M50 8 82 21v24c0 22-14 36-32 47C32 81 18 67 18 45V21L50 8Z"
                      fill="white"
                      fillOpacity=".12"
                      stroke="white"
                      strokeOpacity=".8"
                      strokeWidth="2"
                    />
                    <rect
                      x="35"
                      y="44"
                      width="30"
                      height="24"
                      rx="5"
                      fill="#C7D2FE"
                    />
                    <path
                      d="M41 44V35a9 9 0 0 1 18 0v9"
                      stroke="white"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <circle cx="50" cy="55" r="3" fill="#3730A3" />
                    <path
                      d="M50 58v4"
                      stroke="#3730A3"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <span className="absolute right-12 top-7 h-2 w-2 rounded-full bg-violet-200" />
                <span className="absolute bottom-12 left-16 h-3 w-3 rounded-full bg-indigo-200/80" />
                <span className="absolute left-1/2 top-0 h-1.5 w-1.5 rounded-full bg-white/80" />
              </div>

              <div className="relative flex items-center gap-3 border-t border-white/15 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <ShieldIcon className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Security comes first</p>
                  <p className="mt-1 text-xs text-indigo-100/70">
                    A safer way to get back into your account.
                  </p>
                </div>
              </div>
            </section>

            {/* Right form panel */}
            <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
              <div className="w-full max-w-md">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                  <MailIcon className="h-7 w-7" />
                </div>

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                  Customer account
                </p>

                <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Forgot password?
                </h1>

                <p className="mt-4 text-sm leading-7 text-slate-500">
                  No worries. Enter the email address associated with your
                  account and we’ll help you get back in.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  <div>
                    <label
                      htmlFor="recovery-email"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Email address
                    </label>

                    <div className="group relative">
                      <MailIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-indigo-600" />

                      <input
                        id="recovery-email"
                        name="email"
                        type="email"
                        required
                        maxLength={254}
                        autoComplete="email"
                        inputMode="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setError("");
                          setMessage("");
                        }}
                        disabled={loading}
                        placeholder="you@example.com"
                        aria-invalid={Boolean(error)}
                        aria-describedby={
                          error
                            ? "recovery-error"
                            : message
                              ? "recovery-status"
                              : "recovery-hint"
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>

                    {error ? (
                      <p
                        id="recovery-error"
                        role="alert"
                        className="mt-2 text-sm text-red-600"
                      >
                        {error}
                      </p>
                    ) : message ? (
                      <p
                        id="recovery-status"
                        role="status"
                        aria-live="polite"
                        className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800"
                      >
                        {message}
                      </p>
                    ) : (
                      <p
                        id="recovery-hint"
                        className="mt-2 text-xs leading-5 text-slate-400"
                      >
                        We’ll never ask you to share your password.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                  >
                    {loading ? (
                      <>
                        <Spinner />
                        Sending request...
                      </>
                    ) : (
                      <>
                        Send recovery instructions
                        <ArrowRightIcon />
                      </>
                    )}
                  </button>
                </form>

                {message && (
                  <Link
                    href="/customer/reset-password"
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30"
                  >
                    Enter email code and set a new password
                    <ArrowRightIcon />
                  </Link>
                )}

                <div className="my-7 flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-100" />
                  <span className="text-xs text-slate-400">
                    Remembered your password?
                  </span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>

                <Link
                  href="/customer/login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20"
                >
                  <ArrowLeftIcon />
                  Back to customer login
                </Link>

                <div className="mt-8 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                  <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                  <p className="text-xs leading-5 text-slate-500">
                    For your security, we don’t disclose whether an email
                    address is registered. If an eligible account exists,
                    recovery instructions will be sent.
                  </p>
                </div>

                <p className="mt-7 text-center text-xs leading-6 text-slate-400">
                  Need help?{" "}
                  <Link
                    href="/contact"
                    className="font-semibold text-indigo-600 transition hover:text-indigo-800 hover:underline"
                  >
                    Contact support
                  </Link>
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex flex-col items-center justify-between gap-3 border-t border-slate-200/70 py-6 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} NOPTRIX. All rights reserved.</p>

          <div className="flex items-center gap-5">
            <Link href="/privacy" className="transition hover:text-slate-700">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-slate-700">
              Terms
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
