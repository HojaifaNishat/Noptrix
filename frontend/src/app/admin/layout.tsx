"use client";

import {
    AdminAuthGuard,
} from "@/components/common/AdminAuthGuard";

import AdminSidebar from "@/components/navigation/AdminSidebar";

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({
    children,
}: AdminLayoutProps) {
    return (
        <AdminAuthGuard>
            <div className="flex min-h-screen bg-gray-50">
                <AdminSidebar />

                <div className="min-w-0 flex-1">
                    {children}
                </div>
            </div>
        </AdminAuthGuard>
    );
}