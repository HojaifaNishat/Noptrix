"use client";

import Link from "next/link";
import {
    BriefcaseBusiness,
    Plus,
    Search,
} from "lucide-react";
import { useEffect, useState } from "react";

import { jobVacanciesApi } from "@/services/api/job-vacancies.api";

import {
    JOB_VACANCY_STATUSES,
    type JobVacancy,
    type JobVacancyStatus,
} from "@/features/job-vacancies/job-vacancy.types";

export default function JobVacanciesPage() {
    const [vacancies, setVacancies] = useState<JobVacancy[]>([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<
        JobVacancyStatus | ""
    >("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;

        const loadVacancies = async () => {
            try {
                setLoading(true);
                setError("");

                const response =
                    await jobVacanciesApi.getAll({
                        search: search || undefined,
                        status: status || undefined,
                    });

                if (mounted) {
                    setVacancies(response.items);
                }
            } catch {
                if (mounted) {
                    setError(
                        "Unable to load job vacancies.",
                    );
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        void loadVacancies();

        return () => {
            mounted = false;
        };
    }, [search, status]);

    return (
        <main className="p-6 md:p-8">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <BriefcaseBusiness
                            size={28}
                            className="text-gray-700"
                        />

                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            Job Vacancies
                        </h1>
                    </div>

                    <p className="mt-2 text-gray-600">
                        Create and manage NOPTRIX job vacancies.
                    </p>
                </div>

                <Link
                    href="/admin/job-vacancies/create"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                    <Plus size={18} />
                    Create Vacancy
                </Link>
            </div>

            <div className="mb-6 grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
                <div className="relative">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                        type="search"
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder="Search job vacancies..."
                        className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gray-500"
                    />
                </div>

                <select
                    value={status}
                    onChange={(event) =>
                        setStatus(
                            event.target.value as
                                | JobVacancyStatus
                                | "",
                        )
                    }
                    className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500"
                >
                    <option value="">
                        All statuses
                    </option>

                    <option
                        value={JOB_VACANCY_STATUSES.DRAFT}
                    >
                        Draft
                    </option>

                    <option
                        value={JOB_VACANCY_STATUSES.OPEN}
                    >
                        Published
                    </option>

                    <option
                        value={JOB_VACANCY_STATUSES.CLOSED}
                    >
                        Closed
                    </option>
                </select>
            </div>

            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Position
                                </th>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Department
                                </th>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Employment
                                </th>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Openings
                                </th>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Status
                                </th>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Deadline
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-5 py-12 text-center text-sm text-gray-500"
                                    >
                                        Loading job vacancies...
                                    </td>
                                </tr>
                            ) : vacancies.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-5 py-12 text-center text-sm text-gray-500"
                                    >
                                        No job vacancies found.
                                    </td>
                                </tr>
                            ) : (
                                vacancies.map(
                                    (vacancy) => (
                                        <tr
                                            key={vacancy.id}
                                            className="transition hover:bg-gray-50"
                                        >
                                            <td className="px-5 py-4">
                                                <Link
                                                    href={`/admin/job-vacancies/${vacancy.id}`}
                                                    className="font-semibold text-gray-900 hover:underline"
                                                >
                                                    {
                                                        vacancy.title
                                                    }
                                                </Link>

                                                {vacancy.location && (
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {
                                                            vacancy.location
                                                        }
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-gray-600">
                                                {vacancy.department ||
                                                    "—"}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-gray-600">
                                                {vacancy.employmentType.replace(
                                                    /_/g,
                                                    " ",
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-gray-600">
                                                {
                                                    vacancy.openings
                                                }
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                                    {vacancy.status}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-sm text-gray-600">
                                                {vacancy.applicationDeadline
                                                    ? new Date(
                                                          vacancy.applicationDeadline,
                                                      ).toLocaleDateString()
                                                    : "—"}
                                            </td>
                                        </tr>
                                    ),
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
