"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Archive,
    BellRing,
    CalendarClock,
    CheckCircle2,
    RefreshCw,
    Send,
} from "lucide-react";

import { AdminAuthGuard } from "@/components/common/AdminAuthGuard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/stores/auth.store";
import { hasPermission } from "@/lib/permissions/permission";
import { announcementsApi } from "@/services/api/announcements.api";

import type {
    Announcement,
    AnnouncementStatus,
} from "@/features/announcements/announcement.types";

function formatDate(value?: string): string {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function statusVariant(
    status: AnnouncementStatus,
): "default" | "success" | "warning" | "danger" | "info" {
    switch (status) {
        case "PUBLISHED":
            return "success";
        case "SCHEDULED":
            return "info";
        case "DRAFT":
            return "warning";
        case "EXPIRED":
            return "danger";
        default:
            return "default";
    }
}

export default function AnnouncementDetailsPage() {
    const params = useParams<{ announcementId: string }>();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);

    const announcementId = params.announcementId;

    const canRead = hasPermission(user, "announcements.read");
    const canUpdate = hasPermission(user, "announcements.update");

    const [announcement, setAnnouncement] =
        useState<Announcement | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const loadAnnouncement = useCallback(async () => {
        if (!canRead || !announcementId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result =
                await announcementsApi.getById(announcementId);

            setAnnouncement(result);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load announcement.",
            );
        } finally {
            setLoading(false);
        }
    }, [announcementId, canRead]);

    useEffect(() => {
        void loadAnnouncement();
    }, [loadAnnouncement]);

    const performAction = async (
        action: "publish" | "archive",
    ) => {
        if (!announcement || !canUpdate) return;

        const confirmed = window.confirm(
            action === "publish"
                ? `Publish "${announcement.title}" now?`
                : `Archive "${announcement.title}"?`,
        );

        if (!confirmed) return;

        setActionLoading(true);
        setError("");
        setNotice("");

        try {
            const updated =
                action === "publish"
                    ? await announcementsApi.publish(announcement._id)
                    : await announcementsApi.archive(announcement._id);

            setAnnouncement(updated);
            setNotice(
                action === "publish"
                    ? "Announcement published successfully."
                    : "Announcement archived successfully.",
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : `Failed to ${action} announcement.`,
            );
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <AdminAuthGuard>
            <div className="space-y-6 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Announcement Details
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            View announcement content, audience and publication status.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            onClick={() =>
                                router.push("/admin/communication/announcements")
                            }
                        >
                            <ArrowLeft size={16} />
                            Back
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => void loadAnnouncement()}
                            disabled={loading}
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-600"
                    >
                        {error}
                    </div>
                )}

                {notice && (
                    <div
                        role="status"
                        className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-600"
                    >
                        {notice}
                    </div>
                )}

                {!canRead && (
                    <Card className="p-8 text-center">
                        You do not have permission to view announcements.
                    </Card>
                )}

                {canRead && loading && (
                    <Card className="p-12 text-center text-sm text-muted-foreground">
                        Loading announcement...
                    </Card>
                )}

                {canRead && !loading && announcement && (
                    <>
                        <Card className="p-5 sm:p-7">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                        <Badge variant={statusVariant(announcement.status)}>
                                            {announcement.status}
                                        </Badge>

                                        <Badge
                                            variant={
                                                announcement.priority === "URGENT"
                                                    ? "danger"
                                                    : announcement.priority === "HIGH"
                                                        ? "warning"
                                                        : "default"
                                            }
                                        >
                                            {announcement.priority}
                                        </Badge>
                                    </div>

                                    <h2 className="break-words text-xl font-semibold sm:text-2xl">
                                        {announcement.title}
                                    </h2>

                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Audience: {announcement.targetType}
                                    </p>
                                </div>

                                {canUpdate && (
                                    <div className="flex shrink-0 flex-wrap gap-2">
                                        {(announcement.status === "DRAFT" ||
                                            announcement.status === "SCHEDULED") && (
                                            <Button
                                                loading={actionLoading}
                                                disabled={actionLoading}
                                                onClick={() => void performAction("publish")}
                                            >
                                                <Send size={16} />
                                                Publish
                                            </Button>
                                        )}

                                        {announcement.status !== "ARCHIVED" &&
                                            announcement.status !== "EXPIRED" && (
                                            <Button
                                                variant="outline"
                                                loading={actionLoading}
                                                disabled={actionLoading}
                                                onClick={() => void performAction("archive")}
                                            >
                                                <Archive size={16} />
                                                Archive
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="my-6 border-t border-border" />

                            <div className="flex items-center gap-2 text-sm font-medium">
                                <BellRing size={17} />
                                Announcement message
                            </div>

                            <div className="mt-4 whitespace-pre-wrap break-words text-sm leading-7">
                                {announcement.body}
                            </div>
                        </Card>

                        <Card className="p-5 sm:p-7">
                            <h3 className="mb-5 text-base font-semibold">
                                Publication information
                            </h3>

                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Created
                                    </p>
                                    <p className="mt-1 text-sm font-medium">
                                        {formatDate(announcement.createdAt)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Last updated
                                    </p>
                                    <p className="mt-1 text-sm font-medium">
                                        {formatDate(announcement.updatedAt)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Scheduled for
                                    </p>
                                    <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                                        <CalendarClock size={15} />
                                        {formatDate(announcement.scheduledAt)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Published at
                                    </p>
                                    <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                                        <CheckCircle2 size={15} />
                                        {formatDate(announcement.publishedAt)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Expires at
                                    </p>
                                    <p className="mt-1 text-sm font-medium">
                                        {formatDate(announcement.expiresAt)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Attachments
                                    </p>
                                    <p className="mt-1 text-sm font-medium">
                                        {announcement.attachments?.length ?? 0}
                                    </p>
                                </div>
                            </div>

                            {announcement.targetRoleIds?.length ? (
                                <div className="mt-6">
                                    <p className="text-sm font-medium">
                                        Target role IDs
                                    </p>
                                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                                        {announcement.targetRoleIds.map((id) => (
                                            <li key={id} className="break-all">
                                                {id}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}

                            {announcement.targetUserIds?.length ? (
                                <div className="mt-6">
                                    <p className="text-sm font-medium">
                                        Target user IDs
                                    </p>
                                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                                        {announcement.targetUserIds.map((id) => (
                                            <li key={id} className="break-all">
                                                {id}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}

                            {announcement.attachments?.length ? (
                                <div className="mt-6">
                                    <p className="mb-2 text-sm font-medium">
                                        Attachments
                                    </p>
                                    <ul className="space-y-2">
                                        {announcement.attachments.map((attachment) => (
                                            <li key={`${attachment.url}-${attachment.name}`}>
                                                <a
                                                    href={attachment.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm text-primary underline underline-offset-4"
                                                >
                                                    {attachment.name}
                                                </a>
                                                <span className="ml-2 text-xs text-muted-foreground">
                                                    {attachment.mimeType}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </Card>
                    </>
                )}

                {canRead && !loading && !announcement && !error && (
                    <Card className="p-10 text-center text-sm text-muted-foreground">
                        Announcement not found.
                    </Card>
                )}
            </div>
        </AdminAuthGuard>
    );
}
