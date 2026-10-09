import AdminLoginForm from "@/features/auth/admin/admin-login-form";

interface AdminLoginPageProps {
    searchParams: Promise<{
        [key: string]: string | string[] | undefined;
    }>;
}

export default async function AdminLoginPage({
    searchParams,
}: AdminLoginPageProps) {
    const emailParam =
        (await searchParams).email;
    const email =
        typeof emailParam === "string"
            ? emailParam
            : "";

    return (
        <main className="flex min-h-screen items-center justify-center px-4">
            <AdminLoginForm initialEmail={email} />
        </main>
    );
}
