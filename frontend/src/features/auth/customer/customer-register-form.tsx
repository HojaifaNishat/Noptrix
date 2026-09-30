"use client";

import {
    FormEvent,
    useState,
} from "react";

import Link from "next/link";

import {
    customerRegister,
} from "@/features/auth/auth-actions";


export default function CustomerRegisterForm() {

    const [name, setName] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [phone, setPhone] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);


    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {

        event.preventDefault();

        setError("");

        if (password !== confirmPassword) {
            setError(
                "Passwords do not match."
            );
            return;
        }

        setLoading(true);

        try {

            await customerRegister({
                name,
                email,
                phone: phone || undefined,
                password,
            });

            window.location.href =
                "/account";

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : "Registration failed. Please try again."
            );

        } finally {

            setLoading(false);
        }
    };


    return (
        <div className="w-full max-w-md">

            <div className="mb-8 text-center">

                <h1 className="text-3xl font-bold">
                    Create your account
                </h1>

                <p className="mt-2 text-sm text-gray-600">
                    Join NOPTRIX and start shopping.
                </p>

            </div>


            <form
                onSubmit={handleSubmit}
                className="space-y-5"
            >

                <div>

                    <label
                        htmlFor="customer-name"
                        className="mb-2 block text-sm font-medium"
                    >
                        Full name
                    </label>

                    <input
                        id="customer-name"
                        type="text"
                        autoComplete="name"
                        value={name}
                        onChange={(event) =>
                            setName(event.target.value)
                        }
                        required
                        minLength={2}
                        maxLength={100}
                        className="w-full rounded-lg border px-4 py-3 outline-none"
                        placeholder="Your full name"
                    />

                </div>


                <div>

                    <label
                        htmlFor="customer-email"
                        className="mb-2 block text-sm font-medium"
                    >
                        Email
                    </label>

                    <input
                        id="customer-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) =>
                            setEmail(event.target.value)
                        }
                        required
                        className="w-full rounded-lg border px-4 py-3 outline-none"
                        placeholder="you@example.com"
                    />

                </div>


                <div>

                    <label
                        htmlFor="customer-phone"
                        className="mb-2 block text-sm font-medium"
                    >
                        Phone
                    </label>

                    <input
                        id="customer-phone"
                        type="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(event) =>
                            setPhone(event.target.value)
                        }
                        maxLength={11}
                        className="w-full rounded-lg border px-4 py-3 outline-none"
                        placeholder="01XXXXXXXXX"
                    />

                </div>


                <div>

                    <label
                        htmlFor="customer-password"
                        className="mb-2 block text-sm font-medium"
                    >
                        Password
                    </label>

                    <input
                        id="customer-password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        required
                        minLength={8}
                        maxLength={128}
                        className="w-full rounded-lg border px-4 py-3 outline-none"
                        placeholder="Create a password"
                    />

                </div>


                <div>

                    <label
                        htmlFor="customer-confirm-password"
                        className="mb-2 block text-sm font-medium"
                    >
                        Confirm password
                    </label>

                    <input
                        id="customer-confirm-password"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) =>
                            setConfirmPassword(
                                event.target.value
                            )
                        }
                        required
                        minLength={8}
                        maxLength={128}
                        className="w-full rounded-lg border px-4 py-3 outline-none"
                        placeholder="Confirm your password"
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
                    disabled={loading}
                    className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
                >
                    {loading
                        ? "Creating account..."
                        : "Create account"}
                </button>

            </form>


            <div className="mt-6 text-center text-sm">

                <span className="text-gray-600">
                    Already have an account?{" "}
                </span>

                <Link
                    href="/customer/login"
                    className="font-medium underline"
                >
                    Sign in
                </Link>

            </div>

        </div>
    );
}
