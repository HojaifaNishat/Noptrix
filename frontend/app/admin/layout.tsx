"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const pathname = usePathname();
    const router = useRouter();
    const [ready, setReady] = useState(pathname === "/admin/login");

    useEffect(() => {
        if (pathname === "/admin/login") { setReady(true); return; }
        if (!localStorage.getItem("adminAccessToken") && !localStorage.getItem("noptrix_owner_access_token")) { router.replace("/admin/login"); return; }
        setReady(true);
    }, [pathname, router]);

    if (pathname === "/admin/login") return children;
    if (!ready) return <div className="admin-loading">Loading control room...</div>;
    return <AdminShell>{children}</AdminShell>;
}