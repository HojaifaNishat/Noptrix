import type {
    SelectHTMLAttributes,
} from "react";

export type SelectProps =
    SelectHTMLAttributes<HTMLSelectElement>;

export function Select({
    className = "",
    children,
    ...props
}: SelectProps) {
    return (
        <select
            className={`
                h-10 w-full
                rounded-lg
                border border-border
                bg-background
                px-3
                text-sm text-foreground
                outline-none
                transition-colors
                focus:border-primary
                focus:ring-2
                focus:ring-primary/20
                disabled:cursor-not-allowed
                disabled:opacity-50
                ${className}
            `}
            {...props}
        >
            {children}
        </select>
    );
}
