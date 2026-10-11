"use client";

import type { ReactNode } from "react";

import { usePathname } from "next/navigation";

import { OwnerAuthGuard } from "@/components/common/OwnerAuthGuard";
import AdminShell from "@/components/navigation/AdminShell";

export default function OwnerLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const pathname = usePathname();
  const isOwnerAuthPage =
    pathname === "/owner/login" ||
    pathname === "/owner/verify-secret" ||
    pathname === "/owner/forgot-password" ||
    pathname === "/owner/reset-password";

  if (isOwnerAuthPage) {
    return children;
  }

  return (
    <OwnerAuthGuard>
      <AdminShell owner>{children}</AdminShell>
    </OwnerAuthGuard>
  );
}
