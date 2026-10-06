"use client";

import {
    FormEvent,
    useState,
} from "react";
import Link from "next/link";
import {
    BriefcaseBusiness,
    CheckCircle2,
} from "lucide-react";

import { jobApplicationsApi } from "@/services/api/job-applications.api";
import { useAuthStore } from "@/stores/auth.store";

interface JobApplicationFormProps {
    vacancyId: string;
    vacancyTitle: string;
    returnUrl: string;
}

export default function JobApplicationForm({
    vacancyId,
    vacancyTitle,
    returnUrl,
}: JobApplicationFormProps) {
    const user = useAuthStore((state) => state.user);
    const isLoading = useAuthStore((state) => state.isLoading);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [resumeUrl, setResumeUrl] = useState("");
    const [coverLetter, setCoverLetter] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const next = `${returnUrl}#apply`;
    const loginHref = `/customer/login?next=${encodeURIComponent(next)}`;
    const registerHref = `/customer/register?next=${encodeURIComponent(next)}`;

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            await jobApplicationsApi.create({
                vacancyId,
                name,
                email,
                phone: phone || undefined,
                resumeUrl: resumeUrl || undefined,
                coverLetter: coverLetter || undefined,
            });

            setSubmitted(true);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Unable to submit your application.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <section
            id="apply"
            className="scroll-mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"
        >
            <div className="flex items-center gap-3">
                <BriefcaseBusiness
                    size={21}
                    className="text-gray-700"
                />
                <h2 className="text-xl font-semibold text-gray-900">
                    Apply for this position
                </h2>
            </div>

            <p className="mt-2 text-sm text-gray-600">
                {vacancyTitle}
            </p>

            {isLoading ? (
                <p className="mt-5 text-sm text-gray-500">
                    Checking your account...
                </p>
            ) : user?.accountType !== "USER" ? (
                <div className="mt-5 rounded-xl bg-gray-50 p-5">
                    <p className="text-sm text-gray-700">
                        Sign in or create a NOPTRIX account to submit your application.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                            href={loginHref}
                            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                        >
                            Sign in to apply
                        </Link>
                        <Link
                            href={registerHref}
                            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-white"
                        >
                            Create account
                        </Link>
                    </div>
                </div>
            ) : submitted ? (
                <div
                    role="status"
                    className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
                >
                    <CheckCircle2
                        size={20}
                        className="mt-0.5 shrink-0"
                    />
                    <p>
                        Your application has been submitted successfully.
                    </p>
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="mt-5 space-y-4"
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="application-name"
                                className="mb-1.5 block text-sm font-medium text-gray-700"
                            >
                                Full name
                            </label>
                            <input
                                id="application-name"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                required
                                minLength={2}
                                maxLength={150}
                                autoComplete="name"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="application-email"
                                className="mb-1.5 block text-sm font-medium text-gray-700"
                            >
                                Email
                            </label>
                            <input
                                id="application-email"
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                required
                                maxLength={254}
                                autoComplete="email"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="application-phone"
                                className="mb-1.5 block text-sm font-medium text-gray-700"
                            >
                                Phone <span className="text-gray-400">(optional)</span>
                            </label>
                            <input
                                id="application-phone"
                                type="tel"
                                value={phone}
                                onChange={(event) =>
                                    setPhone(event.target.value)
                                }
                                maxLength={30}
                                autoComplete="tel"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="application-resume"
                                className="mb-1.5 block text-sm font-medium text-gray-700"
                            >
                                Resume link <span className="text-gray-400">(optional)</span>
                            </label>
                            <input
                                id="application-resume"
                                type="url"
                                value={resumeUrl}
                                onChange={(event) =>
                                    setResumeUrl(event.target.value)
                                }
                                maxLength={2000}
                                placeholder="https://..."
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="application-cover-letter"
                            className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                            Cover letter{" "}
                            <span className="text-gray-400">(optional)</span>
                        </label>
                        <textarea
                            id="application-cover-letter"
                            value={coverLetter}
                            onChange={(event) =>
                                setCoverLetter(event.target.value)
                            }
                            maxLength={10000}
                            rows={5}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                        />
                    </div>

                    {error && (
                        <p
                            role="alert"
                            className="text-sm text-red-700"
                        >
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading
                            ? "Submitting..."
                            : "Submit application"}
                    </button>
                </form>
            )}
        </section>
    );
}
