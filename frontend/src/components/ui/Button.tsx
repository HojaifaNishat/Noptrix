"use client";

import type {
    ButtonHTMLAttributes,
    ReactNode,
} from "react";

interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?:
        | "primary"
        | "secondary"
        | "outline"
        | "ghost"
        | "danger";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
}

const variantClasses = {
    primary:
        "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline:
        "border border-border bg-background text-foreground hover:bg-muted",
    ghost:
        "bg-transparent text-foreground hover:bg-muted",
    danger:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const sizeClasses = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm",
    lg: "h-10 px-5 text-sm",
};

export function Button({
    children,
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    className = "",
    ...props
}: ButtonProps) {
    return (
        <button
            type="button"
            disabled={disabled || loading}
            className={`
                inline-flex items-center justify-center gap-2
                rounded-lg
                font-medium
                transition-colors
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-primary/30
                disabled:pointer-events-none
                disabled:opacity-50
                ${variantClasses[variant]}
                ${sizeClasses[size]}
                ${className}
            `}
            {...props}
        >
            {loading && (
                <span
                    className="
                        h-4 w-4
                        animate-spin
                        rounded-full
                        border-2
                        border-current
                        border-t-transparent
                    "
                    aria-hidden="true"
                />
            )}

            {children}
        </button>
    );
}
