"use client";

import Link from "next/link";

import {
    ChevronDown,
    ChevronRight,
    Star,
} from "lucide-react";

import type {
    AdminNavigationSection,
} from "./admin-navigation";

interface AdminSidebarSectionProps {
    section: AdminNavigationSection;
    collapsed: boolean;
    active: boolean;
    open: boolean;
    favoriteItems: readonly string[];
    isItemActive: (href: string) => boolean;
    onToggleSection: (sectionId: string) => void;
    onToggleFavorite: (href: string) => void;
}

export default function AdminSidebarSection({
    section,
    collapsed,
    active,
    open,
    favoriteItems,
    isItemActive,
    onToggleSection,
    onToggleFavorite,
}: AdminSidebarSectionProps) {
    const SectionIcon = section.icon;

    if (collapsed) {
        return (
            <div className="space-y-1">
                {section.items.map((item) => {
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            title={item.label}
                            className={[
                                "flex items-center justify-center rounded-lg p-3",
                                "text-gray-700 transition",
                                "hover:bg-gray-100 hover:text-gray-900",
                                "dark:text-gray-300 dark:hover:bg-gray-900",
                                isItemActive(
                                    item.href,
                                )
                                    ? "bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white"
                                    : "",
                            ].join(" ")}
                        >
                            <Icon
                                size={19}
                                strokeWidth={1.8}
                            />
                        </Link>
                    );
                })}
            </div>
        );
    }

    return (
        <div>
            <button
                type="button"
                onClick={() =>
                    onToggleSection(
                        section.id,
                    )
                }
                className={[
                    "flex w-full items-center rounded-lg",
                    "px-3 py-2.5",
                    "text-sm font-medium",
                    "transition",
                    "hover:bg-gray-100 hover:text-gray-900",
                    "dark:hover:bg-gray-900",
                    active
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-700 dark:text-gray-300",
                ].join(" ")}
                aria-expanded={open}
            >
                <span
                    className={[
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        active
                            ? "bg-gray-100 text-gray-950 dark:bg-gray-900 dark:text-white"
                            : "text-gray-500",
                    ].join(" ")}
                >
                    <SectionIcon
                        size={17}
                        strokeWidth={1.8}
                    />
                </span>

                <span className="ml-3 flex-1 text-left">
                    {section.label}
                </span>

                {open ? (
                    <ChevronDown size={16} />
                ) : (
                    <ChevronRight size={16} />
                )}
            </button>

            {open && (
                <div
                    className={[
                        "ml-3 mt-1 space-y-1",
                        "border-l border-gray-200",
                        "pl-3",
                        "dark:border-gray-800",
                    ].join(" ")}
                >
                    {section.items.map((item) => {
                        const Icon = item.icon;

                        const itemActive =
                            isItemActive(
                                item.href,
                            );

                        const favorite =
                            favoriteItems.includes(
                                item.href,
                            );

                        return (
                            <div
                                key={item.id}
                                className="group flex items-center"
                            >
                                <Link
                                    href={item.href}
                                    className={[
                                        "flex min-w-0 flex-1 items-center rounded-lg",
                                        "px-3 py-2",
                                        "text-sm transition",
                                        itemActive
                                            ? "bg-gray-100 font-medium text-gray-900 dark:bg-gray-900 dark:text-white"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white",
                                    ].join(" ")}
                                >
                                    {itemActive ? (
                                        <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-900 dark:bg-white" />
                                    ) : (
                                        <span className="mr-3 h-1.5 w-1.5 shrink-0 opacity-0" />
                                    )}

                                    <Icon
                                        size={17}
                                        strokeWidth={1.8}
                                    />

                                    <span className="ml-3 min-w-0 flex-1 truncate">
                                        {item.label}
                                    </span>

                                    {item.badgeKey && (
                                        <span
                                            className="ml-2 hidden min-w-5 rounded-full bg-gray-900 px-1.5 py-0.5 text-center text-[10px] font-semibold text-white group-hover:inline-block dark:bg-white dark:text-gray-900"
                                            aria-label={`${item.badgeKey} notifications`}
                                        >
                                            •
                                        </span>
                                    )}
                                </Link>

                                <button
                                    type="button"
                                    onClick={() =>
                                        onToggleFavorite(
                                            item.href,
                                        )
                                    }
                                    aria-label={
                                        favorite
                                            ? `Remove ${item.label} from favorites`
                                            : `Add ${item.label} to favorites`
                                    }
                                    className={[
                                        "ml-1 rounded-md p-1.5",
                                        "text-gray-300 transition",
                                        "hover:bg-gray-100 hover:text-gray-900",
                                        "dark:text-gray-600 dark:hover:bg-gray-900 dark:hover:text-white",
                                        favorite
                                            ? "text-gray-900 dark:text-white"
                                            : "",
                                    ].join(" ")}
                                >
                                    <Star
                                        size={14}
                                        fill={
                                            favorite
                                                ? "currentColor"
                                                : "none"
                                        }
                                        strokeWidth={1.7}
                                    />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
