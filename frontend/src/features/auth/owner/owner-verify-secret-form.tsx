"use client";

import { type FormEvent, useState } from "react";

import { useRouter } from "next/navigation";

import { ShieldCheck } from "lucide-react";

import { ownerVerifySecret } from "@/features/auth/auth-actions";

export default function OwnerVerifySecretForm() {
  const router = useRouter();

  const [secretCode, setSecretCode] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Secret verification failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white">
            <ShieldCheck className="h-7 w-7" />
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Verify Owner Secret
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Enter your owner secret to continue to the Owner Console.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="owner-secret"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Owner Secret
            </label>

            <input
              id="owner-secret"
              type="password"
              value={secretCode}
              onChange={(event) => setSecretCode(event.target.value)}
              autoComplete="current-password"
              placeholder="Enter owner secret"
              disabled={loading}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !secretCode.trim()}
            className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
