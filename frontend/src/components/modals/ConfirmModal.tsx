"use client";

import {
    AlertTriangle,
} from "lucide-react";

import {
    Button,
} from "@/components/ui";

import {
    Modal,
} from "./Modal";

interface ConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "primary";
    loading?: boolean;
}

export function ConfirmModal({
    open,
    onClose,
    onConfirm,
    title = "Are you sure?",
    description = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
    loading = false,
}: ConfirmModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            size="sm"
            closeOnOverlayClick={!loading}
            closeOnEscape={!loading}
            showCloseButton={!loading}
            footer={
                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>

                    <Button
                        variant={variant}
                        loading={loading}
                        onClick={() => {
                            void onConfirm();
                        }}
                    >
                        {confirmText}
                    </Button>
                </div>
            }
        >
            <div className="flex gap-3">
                <div
                    className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-amber-500/10
                        text-amber-600
                        dark:text-amber-400
                    "
                >
                    <AlertTriangle className="h-5 w-5" />
                </div>

                <p className="text-sm leading-6 text-muted-foreground">
                    {description}
                </p>
            </div>
        </Modal>
    );
}
