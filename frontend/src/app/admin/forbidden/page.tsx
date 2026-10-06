"use client";

import Link from "next/link";

import { ArrowLeft, Home, LockKeyhole } from "lucide-react";

/*
|--------------------------------------------------------------------------
| Admin Forbidden Page
|--------------------------------------------------------------------------
*/

export default function AdminForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-black">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
          <LockKeyhole size={38} strokeWidth={1.7} />
        </div>

        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-red-600 dark:text-red-400">
          403
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 dark:text-white">
          Access Denied
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-gray-600 dark:text-gray-400">
          You do not have permission to access this administration page. Please
          contact the Owner if you need access.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Home size={17} strokeWidth={1.8} />
            Back to Dashboard
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-800 dark:bg-black dark:text-gray-300 dark:hover:bg-gray-900"
          >
            <ArrowLeft size={17} strokeWidth={1.8} />
            Go Back
          </button>
        </div>
      </div>
    </main>
  );
}
