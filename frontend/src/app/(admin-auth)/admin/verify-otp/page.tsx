import AdminLoginVerificationForm from "@/features/auth/admin/admin-login-verification-form";

export default function AdminLoginVerificationPage() {
    return (
        <main className="flex min-h-screen items-center justify-center px-4">
            <AdminLoginVerificationForm accountType="ADMIN" />
        </main>
    );
}
