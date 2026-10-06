import type {
    ReactNode,
} from "react";

import {
    ArrowDown,
    ArrowUp,
} from "lucide-react";

interface StatCardProps {
    title: string;
    value: ReactNode;
    description?: string;
    icon?: ReactNode;
    trend?: {
        value: number;
        label?: string;
    };
    footer?: ReactNode;
    loading?: boolean;
    className?: string;
}

export function StatCard({
    title,
    value,
    description,
    icon,
    trend,
    footer,
    loading = false,
    className = "",
}: StatCardProps) {
    if (loading) {
        return (
            <div
                className={`
                    rounded-xl
                    border
                    border-border
                    bg-background
                    p-5
                    shadow-sm
                    ${className}
                `}
            >
                <div className="animate-pulse space-y-4">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="h-8 w-32 rounded bg-muted" />
                    <div className="h-3 w-40 rounded bg-muted" />
                </div>
            </div>
        );
    }

    const isPositive = trend
        ? trend.value >= 0
        : false;

    return (
        <div
            className={`
                rounded-xl
                border
                border-border
                bg-background
                p-5
                shadow-sm
                transition-shadow
                hover:shadow-md
                ${className}
            `}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">
                        {title}
                    </p>

                    <div className="mt-2 text-2xl font-bold tracking-tight">
                        {value}
                    </div>

                    {description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>

                {icon && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                        {icon}
                    </div>
                )}
            </div>

            {trend && (
                <div className="mt-4 flex items-center gap-1.5 text-sm">
                    {isPositive ? (
                        <ArrowUp className="h-4 w-4" />
                    ) : (
                        <ArrowDown className="h-4 w-4" />
                    )}

                    <span className="font-medium">
                        {Math.abs(trend.value)}%
                    </span>

                    {trend.label && (
                        <span className="text-muted-foreground">
                            {trend.label}
                        </span>
                    )}
                </div>
            )}

            {footer && (
                <div className="mt-4 border-t border-border pt-4">
                    {footer}
                </div>
            )}
        </div>
    );
}
