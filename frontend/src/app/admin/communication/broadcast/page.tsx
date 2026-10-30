"use client";

import Link from "next/link";
import { useState } from "react";
import { BellRing, Send, Users, AlertTriangle } from "lucide-react";

import { AdminAuthGuard } from "@/components/common/AdminAuthGuard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuthStore } from "@/stores/auth.store";
import { hasPermission } from "@/lib/permissions/permission";
import { sendBroadcast } from "@/services/api/broadcast.api";
import type {
  BroadcastAudience,
  BroadcastPriority,
  SendBroadcastResult,
} from "@/features/announcements/broadcast.types";

export default function BroadcastPage() {
  const user = useAuthStore((state) => state.user);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] =
    useState<BroadcastAudience>("ALL_ACTIVE_CUSTOMERS");
  const [customerIdsText, setCustomerIdsText] = useState("");
  const [priority, setPriority] =
    useState<BroadcastPriority>("normal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SendBroadcastResult | null>(null);

  const allowed = hasPermission(user, "broadcast.send");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!title.trim() || !message.trim()) {
      setError("Title and message are required.");
      return;
    }

    const customerIds = customerIdsText
      .split(/[\n,;]+/)
      .map((id) => id.trim())
      .filter(Boolean);

    if (audience === "SELECTED_CUSTOMERS" && customerIds.length === 0) {
      setError("Enter at least one customer ID.");
      return;
    }

    const audienceDescription =
      audience === "ALL_ACTIVE_CUSTOMERS"
        ? "all active customers"
        : `${new Set(customerIds).size} selected customer(s)`;

    if (
      !window.confirm(
        `Send this in-app broadcast to ${audienceDescription}?`,
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const response = await sendBroadcast({
        title: title.trim(),
        message: message.trim(),
        audience,
        customerIds:
          audience === "SELECTED_CUSTOMERS" ? customerIds : undefined,
        priority,
      });

      setResult(response);
      if (response.queuedCount > 0) {
        setTitle("");
        setMessage("");
        setCustomerIdsText("");
      }
    } catch (err: unknown) {
      const apiError = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };

      setError(
        apiError.response?.data?.message ??
          apiError.message ??
          "Unable to submit the broadcast.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminAuthGuard>
      <main className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
        <header className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <BellRing className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Customer Broadcast</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Send an in-app notification to active customers.
            </p>
          </div>
        </header>

        <div className="flex justify-end">
          <Link
            href="/admin/communication/broadcast/history"
            className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            View Broadcast History
          </Link>
        </div>

        {!allowed ? (
          <Card>
            <CardContent>
              <p className="pt-5 text-sm text-muted-foreground">
                You do not have permission to send broadcasts. Ask the OWNER
                to grant the broadcast.send permission.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Compose broadcast</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="broadcast-title" className="text-sm font-medium">
                      Notification title
                    </label>
                    <input
                      id="broadcast-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      maxLength={200}
                      required
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="A message customers will see"
                    />
                    <p className="text-xs text-muted-foreground">
                      {title.length}/200 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="broadcast-message" className="text-sm font-medium">
                      Message
                    </label>
                    <textarea
                      id="broadcast-message"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      maxLength={5000}
                      required
                      rows={6}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Write the message for your customers..."
                    />
                    <p className="text-xs text-muted-foreground">
                      {message.length}/5000 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="broadcast-audience" className="text-sm font-medium">
                      Audience
                    </label>
                    <select
                      id="broadcast-audience"
                      value={audience}
                      onChange={(event) =>
                        setAudience(event.target.value as BroadcastAudience)
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="ALL_ACTIVE_CUSTOMERS">
                        All active customers (maximum 5,000)
                      </option>
                      <option value="SELECTED_CUSTOMERS">
                        Selected customers by ID
                      </option>
                    </select>
                  </div>

                  {audience === "SELECTED_CUSTOMERS" && (
                    <div className="space-y-2">
                      <label htmlFor="customer-ids" className="text-sm font-medium">
                        Customer IDs
                      </label>
                      <textarea
                        id="customer-ids"
                        value={customerIdsText}
                        onChange={(event) =>
                          setCustomerIdsText(event.target.value)
                        }
                        rows={4}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
                        placeholder="Paste customer IDs separated by commas or new lines"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="broadcast-priority" className="text-sm font-medium">
                      Priority
                    </label>
                    <select
                      id="broadcast-priority"
                      value={priority}
                      onChange={(event) =>
                        setPriority(event.target.value as BroadcastPriority)
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  {error && (
                    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>
                        Submitting queues in-app notifications. It does not
                        guarantee that every notification has already been
                        delivered. Email, SMS, and push are not enabled here.
                      </p>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} loading={loading}>
                    <Send className="h-4 w-4" />
                    {loading ? "Submitting..." : "Send broadcast"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {result && (
              <Card>
                <CardHeader>
                  <CardTitle>Submission result</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-sm text-muted-foreground">Recipients</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {result.recipientCount}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-sm text-muted-foreground">Queued</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {result.queuedCount}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-sm text-muted-foreground">Failed to queue</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {result.failedCount}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>Campaign ID:</span>
                    <code className="break-all">{result.broadcastId}</code>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Status: {result.status}. Queue submission is not a delivery
                    receipt.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </AdminAuthGuard>
  );
}
