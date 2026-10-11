"use client";

import { useState } from "react";
import {
    Check,
    Monitor,
    Moon,
    Palette,
    Sun,
} from "lucide-react";
import { useTheme, type ThemeAccent, type ThemeMode } from "@/providers/ThemeProvider";

interface AdminSidebarThemeSettingsProps {
    readonly collapsed: boolean;
}

const modes: readonly {
    readonly id: ThemeMode;
    readonly label: string;
    readonly Icon: typeof Sun;
}[] = [
    { id: "light", label: "Light", Icon: Sun },
    { id: "dark", label: "Dark", Icon: Moon },
    { id: "system", label: "System", Icon: Monitor },
];

const accents: readonly {
    readonly id: ThemeAccent;
    readonly label: string;
    readonly color: string;
}[] = [
    { id: "blue", label: "Blue", color: "#2563eb" },
    { id: "purple", label: "Purple", color: "#7c3aed" },
];

export default function AdminSidebarThemeSettings({
    collapsed,
}: AdminSidebarThemeSettingsProps) {
    const [open, setOpen] = useState(false);
    const { mode, accent, setMode, setAccent } = useTheme();

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-label="Appearance settings"
                title={collapsed ? "Appearance settings" : undefined}
                className={[
                    "flex w-full items-center rounded-lg",
                    "text-sm font-medium text-gray-700 transition",
                    "hover:bg-gray-100 hover:text-gray-950",
                    "dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-white",
                    collapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5",
                ].join(" ")}
            >
                <Palette size={19} strokeWidth={1.8} />
                {!collapsed && <span>Appearance</span>}
            </button>

            {open && (
                <>
                    <button
                        type="button"
                        aria-label="Close appearance settings"
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setOpen(false)}
                    />
                    <div
                        className={[
                            "absolute bottom-full z-50 mb-2 rounded-xl",
                            "border border-gray-200 bg-white p-3 shadow-xl",
                            "dark:border-gray-700 dark:bg-gray-900",
                            collapsed ? "left-0 w-64" : "inset-x-0",
                        ].join(" ")}
                    >
                        <p className="px-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Theme
                        </p>
                        <div className="mt-2 grid grid-cols-3 gap-1">
                            {modes.map(({ id, label, Icon }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setMode(id)}
                                    aria-pressed={mode === id}
                                    className={[
                                        "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs",
                                        mode === id
                                            ? "bg-gray-100 font-semibold text-gray-950 dark:bg-gray-800 dark:text-white"
                                            : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800",
                                    ].join(" ")}
                                >
                                    <Icon size={17} />
                                    {label}
                                </button>
                            ))}
                        </div>

                        <p className="mt-3 px-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Accent
                        </p>
                        <div className="mt-2 flex gap-2">
                            {accents.map(({ id, label, color }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setAccent(id)}
                                    aria-pressed={accent === id}
                                    className={[
                                        "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium",
                                        accent === id
                                            ? "border-gray-400 bg-gray-50 text-gray-950 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                                            : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800",
                                    ].join(" ")}
                                >
                                    <span
                                        style={{ backgroundColor: color }}
                                        className="flex h-4 w-4 items-center justify-center rounded-full"
                                    >
                                        {accent === id && (
                                            <Check
                                                size={11}
                                                className="text-white"
                                            />
                                        )}
                                    </span>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
