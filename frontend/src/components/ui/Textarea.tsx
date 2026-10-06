import type {
    TextareaHTMLAttributes,
} from "react";

export type TextareaProps =
    TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({
    className = "",
    ...props
}: TextareaProps) {
    return (
        <textarea
            className={`
                min-h-24
                w-full
                resize-y
                rounded-lg
                border border-border
                bg-background
                px-3
                py-2.5
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
