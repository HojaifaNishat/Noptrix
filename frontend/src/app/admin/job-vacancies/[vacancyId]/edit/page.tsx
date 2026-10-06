"use client";

import {
    useEffect,
    useState,
} from "react";
import { useParams, useRouter } from "next/navigation";

import JobVacancyForm from "@/features/job-vacancies/job-vacancy-form";

import { jobVacanciesApi } from "@/services/api/job-vacancies.api";

import type {
    JobVacancy,
} from "@/features/job-vacancies/job-vacancy.types";

export default function AdminJobVacancyEditPage() {
    const params = useParams();
    const router = useRouter();

    const vacancyId =
        typeof params.vacancyId === "string"
            ? params.vacancyId
            : "";

    const [vacancy, setVacancy] =
        useState<JobVacancy | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        if (!vacancyId) {
            setError("Invalid vacancy ID.");
            setLoading(false);
            return;
        }

        let cancelled = false;

        const loadVacancy = async () => {
            try {
                setLoading(true);
                setError("");

                const result =
                    await jobVacanciesApi.getById(
                        vacancyId,
                    );

                if (cancelled) {
                    return;
                }

                setVacancy(result);
            } catch (loadError) {
                if (cancelled) {
                    return;
                }

                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : "Unable to load job vacancy.",
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadVacancy();

        return () => {
            cancelled = true;
        };
    }, [vacancyId]);

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50 p-6 md:p-8">
                <div className="mx-auto max-w-7xl">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 w-72 rounded-lg bg-gray-200" />

                        <div className="h-4 w-96 max-w-full rounded bg-gray-200" />

                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <div className="space-y-4">
                                <div className="h-12 rounded-lg bg-gray-100" />
                                <div className="h-12 rounded-lg bg-gray-100" />
                                <div className="h-32 rounded-lg bg-gray-100" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (error || !vacancy) {
        return (
            <main className="min-h-screen bg-gray-50 p-6 md:p-8">
                <div className="mx-auto max-w-3xl">
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                        <h1 className="text-xl font-bold text-red-900">
                            Unable to load vacancy
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-red-700">
                            {error ||
                                "The requested job vacancy could not be found."}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                router.push(
                                    "/admin/job-vacancies",
                                )
                            }
                            className="mt-5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                        >
                            Back to vacancies
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 p-6 md:p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8">
                    <p className="text-sm font-medium text-gray-500">
                        Jobs
                    </p>

                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                        Edit Job Vacancy
                    </h1>

                    <p className="mt-2 text-gray-600">
                        Update the position details and
                        recruitment configuration.
                    </p>
                </div>

                <JobVacancyForm
                    vacancyId={vacancyId}
                    initialVacancy={vacancy}
                />
            </div>
        </main>
    );
}
