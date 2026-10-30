"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, History, RefreshCw } from "lucide-react";

import { AdminAuthGuard } from "@/components/common/AdminAuthGuard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuthStore } from "@/stores/auth.store";
import { hasPermission } from "@/lib/permissions/permission";
import { getBroadcastHistory } from "@/services/api/broadcast.api";
import type {
  BroadcastCampaign,
  BroadcastPagination,
} from "@/features/announcements/broadcast.types";

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleString();
}

function ErrorMessage({ children }: { children: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
    >
      {children}
    </div>
  );
}

export default function BroadcastHistoryPage() {
  const user = useAuthStore((state) => state.user);
  const allowed = hasPermission(user, "broadcast.read");

  const [items, setItems] = useState<BroadcastCampaign[]>([]);
  const [pagination, setPagination] = useState<BroadcastPagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getBroadcastHistory(page, 20);
      setItems(result.items);
      setPagination(result.pagination);
    } catch (err: unknown) {
      const apiError = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };

      setError(
        apiError.response?.data?.message ??
          apiError.message ??
          "Unable to load broadcast history.",
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (allowed) {
      void loadHistory();
    }
  }, [allowed, loadHistory]);

  return (
    <AdminAuthGuard>
      <main className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <History className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Broadcast History</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Review previous customer broadcast campaigns and their current status.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void loadHistory()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link
              href="/admin/communication/broadcast"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Compose broadcast
            </Link>
          </div>
        </header>

        {!allowed ? (
          <Card>
            <CardContent>
              <p className="pt-5 text-sm text-muted-foreground">
                You do not have permission to view broadcast history.
                Ask the OWNER to grant broadcast.read.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {error && <ErrorMessage>{error}</ErrorMessage>}

            <Card>
              <CardHeader>
                <CardTitle>
                  Campaigns{pagination ? ` (${pagination.total})` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading && items.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Loading broadcast history...
                  </p>
                ) : items.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {error ? "History could not be loaded." : "No broadcast campaigns found."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {items.map((campaign) => (
                      <article
                        key={campaign.broadcastId}
                        className="rounded-xl border border-border p-4"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 flex-1">
                            <h2 className="break-words font-semibold">
                              {campaign.title}
                            </h2>
                            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                              {campaign.message}
                            </p>
                            <p className="mt-3 text-xs text-muted-foreground">
                              {formatDate(campaign.createdAt)}
                            </p>
                            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                              ID: {campaign.broadcastId}
                            </p>
                          </div>

                          <Link
                            href={`/admin/communication/broadcast/history/${encodeURIComponent(campaign.broadcastId)}`}
                            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                          >
                            View details
                          </Link>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="rounded-lg bg-muted/50 p-3">
                            <p className="text-xs text-muted-foreground">Recipients</p>
                            <p className="mt-1 text-xl font-semibold">
                              {campaign.recipientCount}
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-3">
                            <p className="text-xs text-muted-foreground">Queued</p>
                            <p className="mt-1 text-xl font-semibold">
                              {campaign.queuedCount}
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-3">
                            <p className="text-xs text-muted-foreground">Queue failures</p>
                            <p className="mt-1 text-xl font-semibold">
                              {campaign.failedCount}
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-3">
                            <p className="text-xs text-muted-foreground">Priority</p>
                            <p className="mt-1 font-semibold capitalize">
                              {campaign.priority}
                            </p>
                          </div>
                        </div>

                        <p className="mt-3 text-xs text-muted-foreground">
                          Audience:{" "}
                          {campaign.audience === "ALL_ACTIVE_CUSTOMERS"
                            ? "All active customers"
                            : "Selected customers"}
                        </p>
                      </article>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination?.page ?? page} of {pagination?.totalPages ?? 0}
                    {" · "}
                    {pagination?.total ?? 0} campaigns
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={loading || page <= 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        loading ||
                        !pagination ||
                        page >= pagination.totalPages
                      }
                      onClick={() => setPage((current) => current + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </AdminAuthGuard>
  );
}
