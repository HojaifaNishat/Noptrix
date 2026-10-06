import type {
    InputHTMLAttributes,
} from "react";

export type InputProps =
    InputHTMLAttributes<HTMLInputElement>;

export function Input({
    className = "",
    ...props
}: InputProps) {
    return (
        <input
            className={`
                h-10 w-full
                rounded-lg
                border border-border
                bg-background
                px-3
                text-sm text-foreground
                outline-none
                placeholder:text-muted-foreground
                transition-colors
                focus:border-primary
                focus:ring-2
                focus:ring-primary/20
                disabled:cursor-not-allowed
                disabled:opacity-50
                ${className}
            `}
            {...props}
        />
    );
}
