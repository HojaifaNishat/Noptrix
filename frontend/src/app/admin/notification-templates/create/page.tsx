"use client";

import {
    useRouter,
} from "next/navigation";

import {
    ArrowLeft,
} from "lucide-react";

import {
    AdminAuthGuard,
} from "@/components/common/AdminAuthGuard";

import {
    Button,
} from "@/components/ui/Button";

import {
    notificationTemplatesApi,
} from "@/services/api/notification-templates.api";

import {
    NotificationTemplateForm,
} from "@/features/notification-templates/notification-template-form";

import type {
    NotificationTemplateFormValues,
} from "@/features/notification-templates/notification-template.types";

export default function CreateNotificationTemplatePage() {
    const router = useRouter();

    const handleSubmit = async (
        values: NotificationTemplateFormValues,
    ) => {
        await notificationTemplatesApi.create(
            values,
        );

        router.replace(
            "/admin/notification-templates",
        );
    };

    return (
        <AdminAuthGuard>
            <div className="space-y-6 p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            router.back()
                        }
                    >
                        <ArrowLeft size={16} />
                    </Button>

                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            Create Notification Template
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Create a reusable notification template for NOPTRIX.
                        </p>
                    </div>
                </div>

                <NotificationTemplateForm
                    mode="create"
                    onSubmit={
                        handleSubmit
                    }
                    onCancel={() =>
                        router.push(
                            "/admin/notification-templates",
                        )
                    }
                />
            </div>
        </AdminAuthGuard>
    );
}
