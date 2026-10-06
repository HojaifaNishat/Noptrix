import type {
    ReactNode,
} from "react";

interface BadgeProps {
    children: ReactNode;
    variant?:
        | "default"
        | "success"
        | "warning"
        | "danger"
        | "info"
        | "outline";
    className?: string;
}

const variantClasses = {
    default:
        "bg-secondary text-secondary-foreground",
    success:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    danger:
        "bg-red-500/10 text-red-600 dark:text-red-400",
    info:
        "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    outline:
        "border border-border bg-background text-foreground",
};

export function Badge({
    children,
    variant = "default",
    className = "",
}: BadgeProps) {
    return (
        <span
            className={`
                inline-flex
                items-center
                rounded-full
                px-2.5
                py-1
                text-xs
                font-medium
                ${variantClasses[variant]}
                ${className}
            `}
        >
            {children}
        </span>
    );
}
