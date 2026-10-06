"use client";

import {
    Search,
} from "lucide-react";

interface AdminSidebarSearchProps {
    value: string;
    onChange: (value: string) => void;
}

export default function AdminSidebarSearch({
    value,
    onChange,
}: AdminSidebarSearchProps) {
    return (
        <div className="mb-4">
            <div className="relative">
                <Search
                    size={17}
                    strokeWidth={1.8}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                    type="search"
                    value={value}
                    onChange={(event) =>
                        onChange(
                            event.target.value,
                        )
                    }
                    placeholder="Search menu..."
                    aria-label="Search admin menu"
                    className={[
                        "h-10 w-full rounded-xl",
                        "border border-gray-200",
                        "bg-gray-50",
                        "pl-9 pr-3",
                        "text-sm text-gray-900",
                        "outline-none",
                        "placeholder:text-gray-400",
                        "transition",
                        "focus:border-gray-400",
                        "focus:bg-white",
                        "focus:ring-2",
                        "focus:ring-gray-100",
                        "dark:border-gray-700",
                        "dark:bg-gray-900",
                        "dark:text-white",
                    ].join(" ")}
                />
            </div>
        </div>
    );
}
