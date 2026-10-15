"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { customerAuthApi } from "@/services/api/customer-auth.api";

function VerificationForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const registrationId =
        searchParams.get("registrationId") ?? "";
    const legacyUserId =
        searchParams.get("userId") ?? "";
    const email = searchParams.get("email") ?? "";

    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        if ((!registrationId && !legacyUserId) || !email) {
            setError("Registration details are missing. Please register again.");
            return;
        }

        if (!/^\d{6}$/.test(code)) {
            setError("Enter the six-digit code sent to your email.");
            return;
        }

        setLoading(true);
        try {
            await customerAuthApi.verifyEmail(
                registrationId
                    ? { registrationId, email, code }
                    : { userId: legacyUserId, email, code },
            );
            setSuccess(true);
            router.replace("/customer/login?verified=1");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Verification failed. Please check the code and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold">Verify your email</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Enter the six-digit verification code sent to
                    {" "}<span className="font-medium">{email || "your email"}</span>.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="email-verification-code"
                        className="mb-2 block text-sm font-medium">
                        Verification code
                    </label>
                    <input
                        id="email-verification-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={code}
                        onChange={(event) =>
                            setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        required
                        minLength={6}
                        maxLength={6}
                        pattern="[0-9]{6}"
                        className="w-full rounded-lg border px-4 py-3 tracking-[0.4em] outline-none"
                        placeholder="000000"
                    />
                </div>

                {error && (
                    <p role="alert" className="text-sm text-red-600">{error}</p>
                )}

                {success && (
                    <p role="status" className="text-sm text-green-700">
                        Email verified. Redirecting to login...
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
                >
                    {loading ? "Verifying..." : "Verify email"}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
                Already verified?{" "}
                <Link href="/customer/login" className="font-medium underline">
                    Sign in
                </Link>
            </p>
        </div>
    );
}

export default function CustomerEmailVerificationForm() {
    return (
        <Suspense fallback={<p className="text-center">Loading verification...</p>}>
            <VerificationForm />
        </Suspense>
    );
}
