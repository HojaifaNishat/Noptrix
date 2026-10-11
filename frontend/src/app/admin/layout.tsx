"use client";

import { AdminAuthGuard } from "@/components/common/AdminAuthGuard";

import AdminShell from "@/components/navigation/AdminShell";

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
      <AdminShell>{children}</AdminShell>
    </AdminAuthGuard>
  );
}
