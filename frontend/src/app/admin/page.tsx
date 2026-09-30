import {
    AdminAuthGuard,
} from "@/components/common/AdminAuthGuard";

export default function AdminPage() {
    return (
        <AdminAuthGuard>
            <main className="min-h-screen p-8">
                <h1 className="text-3xl font-bold">
                    NOPTRIX Administration
                </h1>

                <p className="mt-2 text-gray-600">
                    Administration dashboard.
                </p>
            </main>
        </AdminAuthGuard>
    );
}
