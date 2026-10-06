import {
    Inbox,
} from "lucide-react";

import type {
    ReactNode,
} from "react";

interface EmptyStateProps {
    title?: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({
    title = "No records found",
    description = "There is nothing to display here yet.",
    icon,
    action,
    className = "",
}: EmptyStateProps) {
    return (
        <div
            className={`
                flex
                flex-col
                items-center
                justify-center
                rounded-xl
                border
                border-dashed
                border-border
                bg-muted/20
                px-6
                py-12
                text-center
                ${className}
            `}
        >
            <div
                className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-full
                    bg-muted
                    text-muted-foreground
                "
            >
                {icon || <Inbox className="h-5 w-5" />}
            </div>

            <h3 className="mt-4 text-sm font-semibold text-foreground">
                {title}
            </h3>

            {description && (
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    {description}
                </p>
            )}

            {action && (
                <div className="mt-5">
                    {action}
                </div>
            )}
        </div>
    );
}
