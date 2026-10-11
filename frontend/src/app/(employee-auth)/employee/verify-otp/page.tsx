import AdminLoginVerificationForm from "@/features/auth/admin/admin-login-verification-form";

export default function EmployeeLoginVerificationPage() {
    return (
        <main className="flex min-h-screen items-center justify-center px-4">
            <AdminLoginVerificationForm accountType="EMPLOYEE" />
        </main>
    );
}
