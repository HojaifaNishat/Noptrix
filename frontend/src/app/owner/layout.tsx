"use client";

import type { ReactNode } from "react";

import { OwnerAuthGuard } from "@/components/common/OwnerAuthGuard";
import AdminSidebar from "@/components/navigation/AdminSidebar";

export default function OwnerLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <OwnerAuthGuard>
      <div className="flex min-h-screen bg-gray-50 dark:bg-black">
        <AdminSidebar />

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </OwnerAuthGuard>
  );
}
