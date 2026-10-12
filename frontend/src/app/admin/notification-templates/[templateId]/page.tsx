"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    ArrowLeft,
    RefreshCw,
} from "lucide-react";

import {
    useParams,
    useRouter,
} from "next/navigation";

import {
    AdminAuthGuard,
} from "@/components/common/AdminAuthGuard";

import {
    Button,
} from "@/components/ui/Button";

import {
    Card,
} from "@/components/ui/Card";

import {
    notificationTemplatesApi,
} from "@/services/api/notification-templates.api";

import {
    NotificationTemplateForm,
} from "@/features/notification-templates/notification-template-form";

import type {
    NotificationTemplate,
    NotificationTemplateFormValues,
} from "@/features/notification-templates/notification-template.types";

export default function EditNotificationTemplatePage() {
    const router = useRouter();

    const params =
        useParams<{
            templateId: string;
        }>();

    const templateId =
        params.templateId;

    const [
        template,
        setTemplate,
    ] =
        useState<NotificationTemplate | null>(
            null,
        );

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const loadTemplate =
        useCallback(
            async () => {
                if (!templateId) {
                    return;
                }

                try {
                    const result =
                        await notificationTemplatesApi.getById(
                            templateId,
                        );

                    setTemplate(
                        result,
                    );
                    setError("");
                } catch (
                    requestError
                ) {
                    setError(
                        requestError instanceof Error
                            ? requestError.message
                            : "Failed to load notification template.",
                    );
                } finally {
                    setLoading(false);
                }
            },
            [templateId],
        );

    useEffect(() => {
        void loadTemplate();
    }, [loadTemplate]);

    const handleSubmit = async (
        values: NotificationTemplateFormValues,
    ) => {
        setSubmitting(true);
        setError("");

        try {
            await notificationTemplatesApi.update(
                templateId,
                {
                    name: values.name,
                    description:
                        values.description.trim()
                            ? values.description
                            : null,
                    event: values.event,
                    channel:
                        values.channel,
                    locale:
                        values.locale,
                    title:
                        values.title,
                    body:
                        values.body,
                    status:
                        values.status,
                    variables:
                        values.variables,
                },
            );

            router.replace(
                "/admin/notification-templates",
            );
        } catch (
            requestError
        ) {
            throw requestError;
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminAuthGuard>
            <div className="space-y-6 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                router.push(
                                    "/admin/notification-templates",
                                )
                            }
                        >
                            <ArrowLeft
                                size={16}
                            />
                        </Button>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                Edit Notification Template
                            </h1>

                            <p className="mt-1 text-sm text-gray-500">
                                Update this notification template.
                            </p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            void loadTemplate()
                        }
                        disabled={loading}
                    >
                        <RefreshCw
                            size={16}
                            className={
                                loading
                                    ? "animate-spin"
                                    : ""
                            }
                        />
                        Refresh
                    </Button>
                </div>

                {error ? (
                    <Card className="p-6">
                        <div className="text-sm text-red-600">
                            {error}
                        </div>
                    </Card>
                ) : null}

                {loading ? (
                    <Card className="p-10 text-center text-sm text-gray-500">
                        Loading notification template...
                    </Card>
                ) : template ? (
                    <NotificationTemplateForm
                        key={templateId}
                        mode="edit"
                        initialData={
                            template
                        }
                        submitting={
                            submitting
                        }
                        onSubmit={
                            handleSubmit
                        }
                        onCancel={() =>
                            router.push(
                                "/admin/notification-templates",
                            )
                        }
                    />
                ) : (
                    <Card className="p-10 text-center text-sm text-gray-500">
                        Notification template not found.
                    </Card>
                )}
            </div>
        </AdminAuthGuard>
    );
}
