import type {
    HTMLAttributes,
} from "react";

interface LoadingSpinnerProps
    extends HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "md" | "lg";
    label?: string;
}

const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-9 w-9 border-3",
};

export function LoadingSpinner({
    size = "md",
    label = "Loading",
    className = "",
    ...props
}: LoadingSpinnerProps) {
    return (
        <div
            className={`inline-flex items-center justify-center ${className}`}
            role="status"
            aria-label={label}
            {...props}
        >
            <span
                className={`
                    animate-spin
                    rounded-full
                    border-current
                    border-t-transparent
                    text-primary
                    ${sizeClasses[size]}
                `}
            />
        </div>
    );
}
