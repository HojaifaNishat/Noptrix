"use client";

import {
    AlertCircle,
    RefreshCw,
} from "lucide-react";

import type {
    ReactNode,
} from "react";

import {
    Button,
} from "@/components/ui";

interface ErrorStateProps {
    title?: string;
    description?: string;
    action?: ReactNode;
    onRetry?: () => void;
    retryText?: string;
    className?: string;
}

export function ErrorState({
    title = "Something went wrong",
    description = "We could not complete this request.",
    action,
    onRetry,
    retryText = "Try again",
    className = "",
}: ErrorStateProps) {
    return (
        <div
            className={`
                flex
                flex-col
                items-center
                justify-center
                rounded-xl
                border
                border-red-500/20
                bg-red-500/5
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
                    bg-red-500/10
                    text-red-600
                    dark:text-red-400
                "
            >
                <AlertCircle className="h-5 w-5" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-foreground">
                {title}
            </h3>

            {description && (
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    {description}
                </p>
            )}

            {(onRetry || action) && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    {onRetry && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRetry}
                        >
                            <RefreshCw className="h-4 w-4" />
                            {retryText}
                        </Button>
                    )}

                    {action}
                </div>
            )}
        </div>
    );
}
