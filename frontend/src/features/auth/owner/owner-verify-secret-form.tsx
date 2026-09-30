"use client";

import {
    FormEvent,
    useState,
} from "react";

import {
    useRouter,
} from "next/navigation";

import {
    ownerVerifySecret,
} from "@/features/auth/auth-actions";

export default function OwnerVerifySecretForm() {

    const router = useRouter();

    const [secretCode, setSecretCode] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {

        event.preventDefault();

        setError("");
        setLoading(true);

        try {

            await ownerVerifySecret(
                secretCode,
            );

            router.push("/admin");

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : "Secret verification failed. Please try again.",
            );

        } finally {

            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">

            <div className="mb-8 text-center">

                <h1 className="text-3xl font-bold">
                    Verify Owner Secret
                </h1>

                <p className="mt-2 text-sm text-gray-600">
                    Enter your owner secret code to continue.
                </p>

            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-5"
            >

                <div>

                    <label
                        htmlFor="owner-secret-code"
                        className="mb-2 block text-sm font-medium"
                    >
                        Secret Code
                    </label>

                    <input
                        id="owner-secret-code"
                        type="password"
                        autoComplete="off"
                        value={secretCode}
                        onChange={(event) =>
                            setSecretCode(
                                event.target.value,
                            )
                        }
                        required
                        minLength={4}
                        maxLength={32}
                        className="w-full rounded-lg border px-4 py-3 outline-none"
                        placeholder="Enter secret code"
                    />

                </div>

                {error && (
                    <p
                        role="alert"
                        className="text-sm text-red-600"
                    >
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={
                        loading ||
                        !secretCode
                    }
                    className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
                >
                    {loading
                        ? "Verifying..."
                        : "Verify Secret"}
                </button>

            </form>

        </div>
    );
}
