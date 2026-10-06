"use client";

import {
    useEffect,
} from "react";

import {
    X,
} from "lucide-react";

import type {
    ReactNode,
} from "react";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
    showCloseButton?: boolean;
}

const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
};

export function Modal({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    size = "md",
    closeOnOverlayClick = true,
    closeOnEscape = true,
    showCloseButton = true,
}: ModalProps) {
    useEffect(() => {
        if (!open || !closeOnEscape) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener(
            "keydown",
            handleKeyDown,
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown,
            );
        };
    }, [open, closeOnEscape, onClose]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow =
                previousOverflow;
        };
    }, [open]);

    if (!open) {
        return null;
    }

    return (
        <div
            className="
                fixed
                inset-0
                z-50
                flex
                items-center
                justify-center
                p-4
            "
            role="dialog"
            aria-modal="true"
            aria-labelledby={
                title ? "modal-title" : undefined
            }
        >
            <button
                type="button"
                aria-label="Close modal"
                className="
                    absolute
                    inset-0
                    cursor-default
                    bg-black/50
                    backdrop-blur-sm
                "
                onClick={() => {
                    if (closeOnOverlayClick) {
                        onClose();
                    }
                }}
            />

            <div
                className={`
                    relative
                    z-10
                    flex
                    max-h-[90vh]
                    w-full
                    flex-col
                    overflow-hidden
                    rounded-2xl
                    border
                    border-border
                    bg-card
                    text-card-foreground
                    shadow-2xl
                    ${sizeClasses[size]}
                `}
            >
                {(title || showCloseButton) && (
                    <div
                        className="
                            flex
                            items-start
                            justify-between
                            gap-4
                            border-b
                            border-border
                            px-5
                            py-4
                        "
                    >
                        <div className="min-w-0">
                            {title && (
                                <h2
                                    id="modal-title"
                                    className="
                                        text-base
                                        font-semibold
                                        text-foreground
                                    "
                                >
                                    {title}
                                </h2>
                            )}

                            {description && (
                                <p
                                    className="
                                        mt-1
                                        text-sm
                                        text-muted-foreground
                                    "
                                >
                                    {description}
                                </p>
                            )}
                        </div>

                        {showCloseButton && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="
                                    shrink-0
                                    rounded-lg
                                    p-1.5
                                    text-muted-foreground
                                    transition-colors
                                    hover:bg-muted
                                    hover:text-foreground
                                    focus-visible:outline-none
                                    focus-visible:ring-2
                                    focus-visible:ring-primary/30
                                "
                                aria-label="Close modal"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                    {children}
                </div>

                {footer && (
                    <div
                        className="
                            border-t
                            border-border
                            px-5
                            py-4
                        "
                    >
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
