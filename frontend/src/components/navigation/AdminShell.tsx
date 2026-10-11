"use client";

import { useState, type ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";
import { useTheme } from "@/providers/ThemeProvider";

interface AdminShellProps {
    readonly children: ReactNode;
    readonly owner?: boolean;
}

export default function AdminShell({
    children,
    owner = false,
}: AdminShellProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { accent, isDark } = useTheme();
    const sidebarWidth = sidebarCollapsed ? 76 : 280;

    return (
        <div
            className={["admin-shell admin-theme", isDark && "dark"].filter(Boolean).join(" ")}
            data-accent={accent}
            data-theme={isDark ? "dark" : "light"}
        >
            <AdminSidebar onCollapsedChange={setSidebarCollapsed} />
            <main
                className={[
                    "admin-shell__main",
                    owner ? "bg-gray-50 dark:bg-black" : "bg-gray-50",
                ].join(" ")}
                style={{
                    marginLeft: sidebarWidth,
                    width: `calc(100% - ${sidebarWidth}px)`,
                }}
            >
                {children}
            </main>
        </div>
    );
}
