"use client";

import { AdminAuthGuard } from "@/components/common/AdminAuthGuard";

import AdminSidebar from "@/components/navigation/AdminSidebar";

import { ADMIN_ROUTE_PERMISSION_RULES } from "@/lib/permissions/route-permission";

/*
|--------------------------------------------------------------------------
| Props
|--------------------------------------------------------------------------
*/

interface AdminLayoutProps {
  children: React.ReactNode;
}

/*
|--------------------------------------------------------------------------
| Admin Layout
|--------------------------------------------------------------------------
*/

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminAuthGuard permissionRules={ADMIN_ROUTE_PERMISSION_RULES}>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </AdminAuthGuard>
  );
}
