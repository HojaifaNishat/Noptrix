"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { customerAuthApi } from "@/services/api/customer-auth.api";

export default function CustomerResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 12) {
      setError("Password must contain at least 12 characters.");
      return;
    }

    setLoading(true);
    try {
      await customerAuthApi.resetPassword({ email, code, newPassword });
      setMessage("Password reset successfully. You can now sign in with your new password.");
      setEmail("");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Unable to reset password. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Customer account</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Reset password</h1>
        <p className="mt-2 text-sm text-slate-600">Enter your email, recovery code, and a new password.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Email address
            <input type="email" required autoComplete="email" value={email}
              onChange={(event) => setEmail(event.target.value)} className={inputClass} />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Recovery code
            <input required inputMode="numeric" autoComplete="one-time-code" value={code}
              onChange={(event) => setCode(event.target.value)} className={inputClass}
              placeholder="Enter the code from your email" />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            New password
            <input type="password" required minLength={12} maxLength={128}
              autoComplete="new-password" value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)} className={inputClass} />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Confirm new password
            <input type="password" required minLength={12} maxLength={128}
              autoComplete="new-password" value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} />
          </label>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {message && <p role="status" className="text-sm text-green-700">{message}</p>}

          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          <Link href="/customer/login" className="font-semibold text-indigo-600 hover:underline">Back to login</Link>
        </p>
      </section>
    </main>
  );
}
