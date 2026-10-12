
"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { customerAuthApi } from "@/services/api/customer-auth.api";
import {
  clearPasswordResetEmail,
  getPasswordResetEmail,
  subscribeToPasswordResetEmail,
} from "@/lib/auth/password-recovery";

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: "mail" | "lock" | "shield" | "eye" | "eye-off" | "arrow-right" | "arrow-left" | "check";
  className?: string;
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...common}>
      {name === "mail" && (
        <>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="m4 7 8 6 8-6" />
        </>
      )}
      {name === "lock" && (
        <>
          <rect x="4" y="10" width="16" height="11" rx="2.5" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          <path d="M12 14v3" />
        </>
      )}
      {name === "shield" && (
        <>
          <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
          <path d="m9 12 2 2 4-4" />
        </>
      )}
      {name === "eye" && (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
      {name === "eye-off" && (
        <>
          <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a15.6 15.6 0 0 1-3.1 3.9M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7c1.4 0 2.7-.4 3.8-1" />
        </>
      )}
      {name === "arrow-right" && <path d="M5 12h14m-7-7 7 7-7 7" />}
      {name === "arrow-left" && <path d="m12 19-7-7 7-7M5 12h14" />}
      {name === "check" && <path d="m5 12 4 4L19 6" />}
    </svg>
  );
}

function Spinner() {
  return (
    <span
      className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
      aria-hidden="true"
    />
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60";

export default function CustomerResetPasswordPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const recoveryEmail = useSyncExternalStore(
    subscribeToPasswordResetEmail,
    getPasswordResetEmail,
    () => null,
  );
  const emailValue = email ?? recoveryEmail ?? "";

  const passwordLengthValid =
    newPassword.length >= 8 && newPassword.length <= 128;
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  const passwordStrength =
    newPassword.length === 0
      ? 0
      : newPassword.length < 8
        ? 1
        : newPassword.length < 16
          ? 2
          : 3;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setMessage("");
    setError("");

    const normalizedEmail = emailValue.trim();
    const normalizedCode = code.trim();

    if (!normalizedEmail || !normalizedCode) {
      setError("Enter your email address and recovery code.");
      return;
    }

    if (!passwordLengthValid) {
      setError("Your password must contain between 8 and 128 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Your passwords do not match. Please check and try again.");
      return;
    }

    setLoading(true);

    try {
      await customerAuthApi.resetPassword({
        email: normalizedEmail,
        code: normalizedCode,
        newPassword,
      });
      clearPasswordResetEmail();

      setMessage(
        "Your password has been reset successfully. You can now sign in with your new password."
      );

      setEmail("");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (err: unknown) {
      const apiError = err as {
        response?: { data?: { message?: string } };
      };

      setError(
        apiError.response?.data?.message ||
          "Unable to reset your password. Check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8fc] text-slate-900">
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
            aria-label="NOPTRIX home"
            className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white shadow-lg shadow-indigo-600/20">
              N
            </span>
            <span className="text-xl font-extrabold tracking-[0.12em]">
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

        {/* Main */}
        <div className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_80px_-30px_rgba(30,41,100,0.22)] lg:grid-cols-2">
            {/* Security panel */}
            <section className="relative hidden min-h-[700px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#171747] via-[#28266b] to-[#5146bd] p-10 text-white lg:flex xl:p-12">
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
                  ACCOUNT SECURITY
                </span>

                <h2 className="mt-8 max-w-sm text-4xl font-bold leading-[1.15] tracking-tight xl:text-5xl">
                  A stronger password. A safer you.
                </h2>

                <p className="mt-5 max-w-sm text-sm leading-7 text-indigo-100/80">
                  Choose a new password to restore access to your NOPTRIX
                  customer account. Keep it private and unique.
                </p>
              </div>

              {/* Lock illustration */}
              <div className="relative mx-auto flex h-64 w-full max-w-sm items-center justify-center">
                <div className="absolute h-56 w-56 rounded-full border border-white/10" />
                <div className="absolute h-40 w-40 rounded-full border border-white/15" />

                <div className="absolute left-7 top-10 flex h-14 w-14 -rotate-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-xl backdrop-blur-xl">
                  <Icon name="shield" className="h-7 w-7 text-indigo-100" />
                </div>

                <div className="absolute bottom-8 right-8 flex h-12 w-12 rotate-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-xl backdrop-blur-xl">
                  <Icon name="check" className="h-6 w-6 text-emerald-300" />
                </div>

                <div className="relative flex h-36 w-36 items-center justify-center rounded-[2rem] border border-white/20 bg-gradient-to-br from-white/20 to-white/[0.04] shadow-2xl backdrop-blur-xl">
                  <div className="absolute inset-2 rounded-[1.5rem] border border-white/10" />
                  <Icon name="lock" className="h-16 w-16 text-white" />
                </div>

                <span className="absolute right-12 top-7 h-2 w-2 rounded-full bg-violet-200" />
                <span className="absolute bottom-12 left-16 h-3 w-3 rounded-full bg-indigo-200/80" />
              </div>

              <div className="relative flex items-center gap-3 border-t border-white/15 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <Icon name="shield" className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Your security matters</p>
                  <p className="mt-1 text-xs text-indigo-100/70">
                    Never share your recovery code or password.
                  </p>
                </div>
              </div>
            </section>

            {/* Reset form */}
            <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
              <div className="w-full max-w-md">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                  <Icon name="lock" className="h-7 w-7" />
                </div>

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                  Customer account
                </p>

                <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Reset password
                </h1>

                <p className="mt-4 text-sm leading-7 text-slate-500">
                  Verify your recovery code and create a new password to
                  secure your account.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="reset-email"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Email address
                    </label>

                    <div className="group relative">
                      <Icon
                        name="mail"
                        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-indigo-600"
                      />
                      <input
                        id="reset-email"
                        name="email"
                        type="email"
                        required
                        maxLength={254}
                        autoComplete="email"
                        inputMode="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        value={emailValue}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setError("");
                          setMessage("");
                        }}
                        disabled={loading}
                        placeholder="you@example.com"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Recovery code */}
                  <div>
                    <label
                      htmlFor="reset-code"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Recovery code
                    </label>

                    <input
                      id="reset-code"
                      name="code"
                      type="text"
                      required
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(event) => {
                        setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                        setError("");
                        setMessage("");
                      }}
                      disabled={loading}
                      placeholder="Enter your recovery code"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 font-mono text-sm tracking-wider outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60"
                    />

                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      Use the code sent to your registered email.
                    </p>
                  </div>

                  {/* New password */}
                  <div>
                    <label
                      htmlFor="new-password"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      New password
                    </label>

                    <div className="group relative">
                      <Icon
                        name="lock"
                        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-indigo-600"
                      />

                      <input
                        id="new-password"
                        name="newPassword"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        maxLength={128}
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(event) => {
                          setNewPassword(event.target.value);
                          setError("");
                          setMessage("");
                        }}
                        disabled={loading}
                        placeholder="At least 8 characters"
                        className={inputClass}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        aria-pressed={showPassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        <Icon
                          name={showPassword ? "eye-off" : "eye"}
                          className="h-5 w-5"
                        />
                      </button>
                    </div>

                    {/* Simple length-based indicator, not a security audit */}
                    {newPassword.length > 0 && (
                      <div className="mt-3" aria-live="polite">
                        <div className="flex gap-1.5">
                          {[1, 2, 3].map((level) => (
                            <div
                              key={level}
                              className={`h-1.5 flex-1 rounded-full transition ${
                                passwordStrength >= level
                                  ? level === 1
                                    ? "bg-amber-400"
                                    : level === 2
                                      ? "bg-indigo-400"
                                      : "bg-emerald-500"
                                  : "bg-slate-100"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          {newPassword.length < 8
                            ? `${newPassword.length}/8 minimum characters`
                            : newPassword.length < 12
                              ? "Meets the minimum length requirement"
                              : "Long password — good start"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Confirm new password
                    </label>

                    <div className="group relative">
                      <Icon
                        name="lock"
                        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-indigo-600"
                      />

                      <input
                        id="confirm-password"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        minLength={8}
                        maxLength={128}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => {
                          setConfirmPassword(event.target.value);
                          setError("");
                          setMessage("");
                        }}
                        disabled={loading}
                        placeholder="Re-enter your new password"
                        aria-invalid={
                          confirmPassword.length > 0 && !passwordsMatch
                        }
                        className={`${inputClass} ${
                          confirmPassword.length > 0
                            ? passwordsMatch
                              ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/10"
                              : "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
                            : ""
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword((value) => !value)
                        }
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirmation password"
                            : "Show confirmation password"
                        }
                        aria-pressed={showConfirmPassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        <Icon
                          name={showConfirmPassword ? "eye-off" : "eye"}
                          className="h-5 w-5"
                        />
                      </button>
                    </div>

                    {confirmPassword.length > 0 && (
                      <p
                        className={`mt-2 text-xs ${
                          passwordsMatch ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {passwordsMatch
                          ? "Passwords match."
                          : "Passwords do not match yet."}
                      </p>
                    )}
                  </div>

                  {/* Feedback */}
                  {error && (
                    <div
                      id="reset-error"
                      role="alert"
                      className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm leading-6 text-rose-700"
                    >
                      {error}
                    </div>
                  )}

                  {message && (
                    <div
                      role="status"
                      aria-live="polite"
                      className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <Icon name="check" className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-emerald-800">
                            Password updated
                          </p>
                          <p className="mt-1 text-sm leading-6 text-emerald-700">
                            {message}
                          </p>
                          <Link
                            href="/customer/login"
                            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:underline"
                          >
                            Continue to login
                            <Icon name="arrow-right" className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !emailValue.trim() ||
                      !code.trim() ||
                      !passwordLengthValid ||
                      !passwordsMatch
                    }
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                  >
                    {loading ? (
                      <>
                        <Spinner />
                        Resetting password...
                      </>
                    ) : (
                      <>
                        Reset password
                        <Icon name="arrow-right" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-7 rounded-xl bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <Icon
                      name="shield"
                      className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Keep your account secure
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Use a unique password and never share your recovery
                        code. A longer password or passphrase is recommended.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-7 text-center text-sm text-slate-500">
                  Remembered your password?{" "}
                  <Link
                    href="/customer/login"
                    className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>

                <p className="mt-4 text-center text-xs text-slate-400">
                  Need help?{" "}
                  <Link
                    href="/contact"
                    className="font-semibold text-indigo-600 hover:underline"
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
