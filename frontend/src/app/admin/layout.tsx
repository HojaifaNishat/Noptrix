"use client";

import {
    AdminAuthGuard,
} from "@/components/common/AdminAuthGuard";

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({
    children,
}: AdminLayoutProps) {
    return (
        <AdminAuthGuard>
            {children}
        </AdminAuthGuard>
    );
}