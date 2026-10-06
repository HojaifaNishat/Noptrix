"use client";

import Link from "next/link";

import {
    Star,
} from "lucide-react";

import type {
    AdminNavigationItem,
} from "./admin-navigation";

interface AdminSidebarFavoritesProps {
    items: readonly AdminNavigationItem[];
    collapsed: boolean;
    isItemActive: (href: string) => boolean;
    onToggleFavorite: (href: string) => void;
}

export default function AdminSidebarFavorites({
    items,
    collapsed,
    isItemActive,
    onToggleFavorite,
}: AdminSidebarFavoritesProps) {
    if (items.length === 0) {
        return null;
    }

    return (
        <div className="mb-4">
            {!collapsed && (
                <div className="mb-2 flex items-center gap-2 px-2">
                    <Star
                        size={14}
                        strokeWidth={1.8}
                        className="text-gray-400"
                    />

                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                        Favorites
                    </span>
                </div>
            )}

            <div className="space-y-1">
                {items.map((item) => {
                    const Icon = item.icon;

                    return (
                        <div
                            key={item.href}
                            className={[
                                "group flex items-center",
                                collapsed
                                    ? "justify-center"
                                    : "",
                            ].join(" ")}
                        >
                            <Link
                                href={item.href}
                                title={
                                    collapsed
                                        ? item.label
                                        : undefined
                                }
                                className={[
                                    "flex items-center rounded-lg",
                                    "text-gray-700 transition",
                                    "hover:bg-gray-100 hover:text-gray-900",
                                    "dark:text-gray-300 dark:hover:bg-gray-900",
                                    collapsed
                                        ? "justify-center p-3"
                                        : "min-w-0 flex-1 gap-3 px-3 py-2.5",
                                    isItemActive(
                                        item.href,
                                    )
                                        ? "bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white"
                                        : "",
                                ].join(" ")}
                            >
                                <Icon
                                    size={18}
                                    strokeWidth={1.8}
                                />

                                {!collapsed && (
                                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                        {item.label}
                                    </span>
                                )}
                            </Link>

                            {!collapsed && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        onToggleFavorite(
                                            item.href,
                                        )
                                    }
                                    aria-label={`Remove ${item.label} from favorites`}
                                    className="ml-1 rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
                                >
                                    <Star
                                        size={15}
                                        fill="currentColor"
                                        strokeWidth={1.7}
                                    />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
