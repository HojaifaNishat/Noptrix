"use client";

import Link from "next/link";

import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import {
    ADMIN_DASHBOARD_PATH,
} from "./admin-navigation";

interface AdminSidebarHeaderProps {
    collapsed: boolean;
    onToggleCollapsed: () => void;
}

export default function AdminSidebarHeader({
    collapsed,
    onToggleCollapsed,
}: AdminSidebarHeaderProps) {
    return (
        <div
            className={[
                "relative flex h-16 shrink-0 items-center",
                "border-b border-gray-200",
                "dark:border-gray-800",
                collapsed
                    ? "justify-center"
                    : "justify-between px-4",
            ].join(" ")}
        >
            <Link
                href={ADMIN_DASHBOARD_PATH}
                className={[
                    "flex items-center",
                    collapsed
                        ? "justify-center"
                        : "gap-3",
                ].join(" ")}
                aria-label="NOPTRIX Administration"
            >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-sm font-bold text-white dark:bg-white dark:text-black">
                    N
                </div>

                {!collapsed && (
                    <div className="leading-none">
                        <p className="text-lg font-bold tracking-tight text-gray-950 dark:text-white">
                            NOPTRIX
                        </p>

                        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-gray-400">
                            Administration
                        </p>
                    </div>
                )}
            </Link>

            <button
                type="button"
                onClick={onToggleCollapsed}
                className={[
                    "rounded-lg border border-gray-200",
                    "p-2 text-gray-500",
                    "transition",
                    "hover:bg-gray-50",
                    "hover:text-gray-900",
                    "dark:border-gray-700",
                    "dark:hover:bg-gray-900",
                    collapsed
                        ? "absolute left-1/2 mt-20 -translate-x-1/2"
                        : "",
                ].join(" ")}
                aria-label={
                    collapsed
                        ? "Expand sidebar"
                        : "Collapse sidebar"
                }
            >
                {collapsed ? (
                    <ChevronRight size={18} />
                ) : (
                    <ChevronLeft size={18} />
                )}
            </button>
        </div>
    );
}
