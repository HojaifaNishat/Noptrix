"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { employeeAuthApi } from "@/services/api/employee-auth.api";
import { savePasswordResetEmail } from "@/lib/auth/password-recovery";

export default function EmployeeForgotPasswordPage() {
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
      await employeeAuthApi.forgotPassword(normalizedEmail);
      savePasswordResetEmail(normalizedEmail.toLowerCase());
      setMessage("If an eligible account exists, password recovery instructions will be sent.");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Unable to process your request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Employee account</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Forgot password?</h1>
        <p className="mt-2 text-sm text-slate-600">Enter your registered email to request password recovery.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Email address
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              maxLength={254}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="you@example.com"
            />
          </label>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {message && <p role="status" className="text-sm text-green-700">{message}</p>}

          {message && (
            <Link
              href="/employee/reset-password"
              className="block w-full rounded-lg bg-indigo-600 px-4 py-3 text-center font-semibold text-white hover:bg-indigo-700"
            >
              Enter email code and set a new password
            </Link>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send recovery instructions"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have access? <Link href="/employee/login" className="font-semibold text-indigo-600 hover:underline">Back to login</Link>
        </p>
        <p className="mt-3 text-center text-sm">
          <Link href="/employee/reset-password" className="text-indigo-600 hover:underline">Already have a recovery code?</Link>
        </p>
      </section>
    </main>
  );
}
