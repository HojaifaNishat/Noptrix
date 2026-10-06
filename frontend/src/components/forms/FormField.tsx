import type {
    ReactNode,
} from "react";

import {
    Label,
} from "@/components/ui";

interface FormFieldProps {
    label?: string;
    htmlFor?: string;
    required?: boolean;
    description?: string;
    error?: string;
    children: ReactNode;
    className?: string;
}

export function FormField({
    label,
    htmlFor,
    required = false,
    description,
    error,
    children,
    className = "",
}: FormFieldProps) {
    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <div>
                    <Label htmlFor={htmlFor}>
                        {label}

                        {required && (
                            <span
                                className="ml-1 text-destructive"
                                aria-hidden="true"
                            >
                                *
                            </span>
                        )}
                    </Label>
                </div>
            )}

            {children}

            {description && !error && (
                <p className="text-xs text-muted-foreground">
                    {description}
                </p>
            )}

            {error && (
                <p
                    className="text-xs font-medium text-destructive"
                    role="alert"
                >
                    {error}
                </p>
            )}
        </div>
    );
}
