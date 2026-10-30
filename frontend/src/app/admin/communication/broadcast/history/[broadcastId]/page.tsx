"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";

import { AdminAuthGuard } from "@/components/common/AdminAuthGuard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuthStore } from "@/stores/auth.store";
import { hasPermission } from "@/lib/permissions/permission";
import { getBroadcastDetails } from "@/services/api/broadcast.api";
import type { BroadcastCampaignDetails } from "@/features/announcements/broadcast.types";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
}

export default function BroadcastDetailsPage() {
  const params = useParams<{ broadcastId: string }>();
  const broadcastId = params.broadcastId;
  const user = useAuthStore((state) => state.user);
  const allowed = hasPermission(user, "broadcast.read");

  const [details, setDetails] = useState<BroadcastCampaignDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDetails = useCallback(async () => {
    if (!broadcastId) return;

    setLoading(true);
    setError("");

    try {
      setDetails(await getBroadcastDetails(broadcastId));
    } catch (err: unknown) {
      const apiError = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };

      setError(
        apiError.response?.data?.message ??
          apiError.message ??
          "Unable to load campaign details.",
      );
    } finally {
      setLoading(false);
    }
  }, [broadcastId]);

  useEffect(() => {
    if (allowed) {
      void loadDetails();
    }
  }, [allowed, loadDetails]);

  const campaign = details?.campaign;
  const report = details?.report;

  const metrics = report
    ? [
        { label: "Notification records", value: report.notificationsCreated },
        { label: "Pending", value: report.pending },
        { label: "Sent", value: report.sent },
        { label: "Partial", value: report.partial },
        { label: "Failed", value: report.failed },
        { label: "Read", value: report.read },
      ]
    : [];

  const deliveryMetrics = report
    ? [
        { label: "Pending", value: report.delivery.pending },
        { label: "Sent", value: report.delivery.sent },
        { label: "Delivered", value: report.delivery.delivered },
        { label: "Failed", value: report.delivery.failed },
        { label: "Skipped", value: report.delivery.skipped },
      ]
    : [];

  return (
    <AdminAuthGuard>
      <main className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Broadcast Details</h1>
            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
              {broadcastId}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void loadDetails()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link
              href="/admin/communication/broadcast/history"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              History
            </Link>
          </div>
        </header>

        {!allowed ? (
          <Card>
            <CardContent>
              <p className="pt-5 text-sm text-muted-foreground">
                You do not have permission to view broadcast details.
                Ask the OWNER to grant broadcast.read.
              </p>
            </CardContent>
          </Card>
        ) : loading && !details ? (
          <Card>
            <CardContent>
              <p className="py-8 text-center text-sm text-muted-foreground">
                Loading campaign details...
              </p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent>
              <div role="alert" className="py-5 text-sm text-destructive">
                {error}
              </div>
            </CardContent>
          </Card>
        ) : campaign && report ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{campaign.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap break-words text-sm">
                  {campaign.message}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="mt-1 text-sm font-medium">
                      {formatDate(campaign.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Last updated</p>
                    <p className="mt-1 text-sm font-medium">
                      {formatDate(campaign.updatedAt)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Audience</p>
                    <p className="mt-1 text-sm font-medium">
                      {campaign.audience === "ALL_ACTIVE_CUSTOMERS"
                        ? "All active customers"
                        : "Selected customers"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Priority</p>
                    <p className="mt-1 text-sm font-medium capitalize">
                      {campaign.priority}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { label: "Recipients", value: campaign.recipientCount },
                    { label: "Queued", value: campaign.queuedCount },
                    { label: "Failed to queue", value: campaign.failedCount },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-lg bg-muted/50 p-4">
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-4 break-all font-mono text-xs text-muted-foreground">
                  Campaign ID: {campaign.broadcastId}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="rounded-lg border border-border p-4">
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Read counts are based on notification records with a read timestamp.
                  Notification status and delivery status are reported separately.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Channel delivery status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {deliveryMetrics.map((metric) => (
                    <div key={metric.label} className="rounded-lg border border-border p-4">
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  These figures count delivery records across notifications, not unique
                  customers. A queued notification is not proof of delivery.
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent>
              <p className="py-8 text-center text-sm text-muted-foreground">
                No campaign details available.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </AdminAuthGuard>
  );
}
