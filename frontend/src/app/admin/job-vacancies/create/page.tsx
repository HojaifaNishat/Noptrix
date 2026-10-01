import JobVacancyForm from "@/features/job-vacancies/job-vacancy-form";

export default function CreateJobVacancyPage() {
    return (
        <main className="p-6 md:p-8">
            <div className="mb-8">
                <p className="text-sm font-medium text-gray-500">
                    Jobs
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                    Create Job Vacancy
                </h1>

                <p className="mt-2 text-gray-600">
                    Create a new position for NOPTRIX.
                </p>
            </div>

            <JobVacancyForm />
        </main>
    );
}
