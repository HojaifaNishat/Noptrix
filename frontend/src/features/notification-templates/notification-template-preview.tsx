"use client";

import {
    Eye,
    Mail,
    MessageSquare,
    Smartphone,
} from "lucide-react";

import {
    Card,
} from "@/components/ui/Card";

import type {
    NotificationTemplateChannel,
} from "./notification-template.types";

interface NotificationTemplatePreviewProps {
    channel: NotificationTemplateChannel;
    title: string;
    body: string;
    variables: string[];
}

const SAMPLE_VALUES: Record<string, string> = {
    name: "Hojaifa",
    username: "Hojaifa",
    employeeName: "Hojaifa Nishat",
    customerName: "Hojaifa Nishat",
    applicantName: "Hojaifa Nishat",
    companyName: "NOPTRIX",
    roleName: "Administrator",
    vacancyTitle: "Senior Software Engineer",
    status: "SELECTED",
    actionUrl: "https://noptrix.com/action",
    loginUrl: "https://noptrix.com/login",
    dashboardUrl: "https://noptrix.com/dashboard",
    email: "user@example.com",
    phone: "+966500000000",
    expiresAt: "October 15, 2026",
};

const renderPreview = (
    value: string,
    variables: string[],
): string => {
    return value.replace(
        /{{\s*([a-zA-Z0-9._-]+)\s*}}/g,
        (
            _match,
            variableName: string,
        ) => {
            const key = variableName
                .trim()
                .toLowerCase();

            if (SAMPLE_VALUES[key]) {
                return SAMPLE_VALUES[key];
            }

            if (variables.includes(key)) {
                return `[${key}]`;
            }

            return `{{${variableName}}}`;
        },
    );
};

const ChannelIcon = ({
    channel,
}: {
    channel: NotificationTemplateChannel;
}) => {
    if (channel === "email") {
        return <Mail size={16} />;
    }

    if (channel === "push") {
        return <Smartphone size={16} />;
    }

    return <MessageSquare size={16} />;
};

export function NotificationTemplatePreview({
    channel,
    title,
    body,
    variables,
}: NotificationTemplatePreviewProps) {
    const previewTitle = renderPreview(
        title,
        variables,
    );

    const previewBody = renderPreview(
        body,
        variables,
    );

    return (
        <Card className="overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
                <div className="flex items-center gap-2">
                    <Eye
                        size={18}
                        className="text-gray-600"
                    />

                    <h2 className="text-sm font-semibold text-gray-900">
                        Live Preview
                    </h2>

                    <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                        <ChannelIcon channel={channel} />
                        {channel}
                    </span>
                </div>
            </div>

            <div className="p-5">
                {channel === "email" ? (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-5 py-4">
                            <p className="text-xs text-gray-500">
                                NOPTRIX
                            </p>

                            <h3 className="mt-2 text-lg font-semibold text-gray-900">
                                {previewTitle ||
                                    "Notification title"}
                            </h3>
                        </div>

                        <div className="whitespace-pre-wrap px-5 py-5 text-sm leading-7 text-gray-700">
                            {previewBody ||
                                "Notification body preview will appear here."}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="rounded-xl bg-white p-4 shadow-sm">
                            <p className="text-sm font-semibold text-gray-900">
                                {previewTitle ||
                                    "Notification title"}
                            </p>

                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                                {previewBody ||
                                    "Notification body preview will appear here."}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
