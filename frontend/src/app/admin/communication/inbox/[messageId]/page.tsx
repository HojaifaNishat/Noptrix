"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Archive,
  MailOpen,
  Paperclip,
  RefreshCw,
  Reply,
  Trash2,
} from "lucide-react";

import { AdminAuthGuard } from "@/components/common/AdminAuthGuard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { useAuthStore } from "@/stores/auth.store";
import type { InternalMessage } from "@/features/communication/message.types";
import { communicationApi } from "@/services/api/communication.api";

function readError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unable to load this message.";
}

export default function MessageDetailsPage() {
  const { messageId } = useParams<{ messageId: string }>();
  const router = useRouter();
  const returnHref = "/admin/communication/inbox";
  const userId = useAuthStore((state) => state.user?.id);
  const userName = useAuthStore((state) => state.user?.name);
  const [message, setMessage] = useState<InternalMessage | null>(null);
  const [thread, setThread] = useState<InternalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [sendingReply, setSendingReply] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const latestUserMessage =
    [...thread].reverse().find((entry) => entry.recipientId === userId) ??
    [...thread]
      .reverse()
      .find(
        (entry) => entry.senderId === userId || entry.recipientId === userId,
      ) ??
    message;
  const replyRecipientName = message
    ? message.senderId === userId
      ? message.recipientName
      : message.senderName
    : "recipient";
  const replyRecipientRole = message
    ? message.senderId === userId
      ? message.recipientRole
      : message.senderRole
    : undefined;
  const replySubject = message
    ? /^re\s*:/i.test(message.subject)
      ? message.subject
      : `Re: ${message.subject}`
    : "";

  const loadMessage = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const messages = await communicationApi.getThread(messageId);
      setThread(messages);
      setMessage(messages[0] ?? null);
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setLoading(false);
    }
  }, [messageId]);

  useEffect(() => {
    if (messageId) void Promise.resolve().then(loadMessage);
  }, [loadMessage, messageId]);

  const archiveMessage = async () => {
    if (!latestUserMessage) return;
    setActionLoading(true);
    setError("");
    try {
      await communicationApi.archive(latestUserMessage._id);
      router.push(returnHref);
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setActionLoading(false);
    }
  };

  const deleteMessage = async () => {
    if (!latestUserMessage || !window.confirm("Delete this conversation?"))
      return;
    setActionLoading(true);
    setError("");
    try {
      await communicationApi.remove(latestUserMessage._id);
      router.push(returnHref);
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setActionLoading(false);
    }
  };

  const sendReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message || !latestUserMessage) return;

    setSendingReply(true);
    setError("");
    setNotice("");
    try {
      const attachments = replyFiles.length
        ? await communicationApi.uploadAttachments(replyFiles)
        : [];
      await communicationApi.reply(message._id, {
        body: replyBody.trim(),
        ...(attachments.length ? { attachments } : {}),
      });
      setReplying(false);
      setReplyBody("");
      setReplyFiles([]);
      setNotice("Reply sent successfully.");
      await loadMessage();
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setSendingReply(false);
    }
  };

  const markUnread = async () => {
    if (!latestUserMessage) return;
    setActionLoading(true);
    setError("");
    setNotice("");
    try {
      await communicationApi.markAsUnread(latestUserMessage._id);
      setNotice("Conversation marked as unread.");
      router.push(returnHref);
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminAuthGuard>
      <main className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Message details</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Internal communication
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadMessage()}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />{" "}
              Refresh
            </Button>
            <Link
              href={returnHref}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" /> All Mail
            </Link>
          </div>
        </header>
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}
        {notice && (
          <div
            role="status"
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700"
          >
            {notice}
          </div>
        )}
        {loading ? (
          <Card>
            <CardContent>
              <p className="py-10 text-center text-sm text-muted-foreground">
                Loading message...
              </p>
            </CardContent>
          </Card>
        ) : message ? (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <CardTitle className="text-xl">{message.subject}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{message.priority}</Badge>
                    <Badge
                      variant={message.status === "READ" ? "success" : "info"}
                    >
                      {message.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {latestUserMessage?.recipientId === userId && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={actionLoading}
                      onClick={() => void markUnread()}
                    >
                      <MailOpen className="h-4 w-4" /> Mark unread
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={actionLoading}
                    onClick={() => void archiveMessage()}
                  >
                    <Archive className="h-4 w-4" /> Archive
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    disabled={actionLoading}
                    onClick={() => void deleteMessage()}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 border-b border-border pb-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">From</dt>
                  <dd className="mt-1 font-medium">
                    {message.senderName}
                    {message.senderRole ? ` · ${message.senderRole}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">To</dt>
                  <dd className="mt-1 font-medium">
                    {message.recipientName}
                    {message.recipientRole ? ` · ${message.recipientRole}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Sent</dt>
                  <dd className="mt-1 font-medium">
                    {new Date(message.createdAt).toLocaleString()}
                  </dd>
                </div>
              </dl>
              <section className="space-y-4 py-5" aria-label="Conversation">
                {thread.map((entry) => (
                  <article
                    key={entry._id}
                    className={`rounded-xl border p-4 ${
                      entry.senderId === userId
                        ? "ml-0 border-primary/30 bg-primary/[0.03] sm:ml-10"
                        : "mr-0 border-border sm:mr-10"
                    }`}
                  >
                    <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {entry.senderName}
                        {entry.senderRole ? ` · ${entry.senderRole}` : ""}
                      </span>
                      <span>{new Date(entry.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      To {entry.recipientName}
                      {entry.recipientRole ? ` · ${entry.recipientRole}` : ""}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">
                      {entry.body}
                    </p>
                    {entry.attachments && entry.attachments.length > 0 && (
                      <ul className="mt-3 space-y-2 border-t border-border pt-3">
                        {entry.attachments.map((file) => (
                          <li
                            key={`${file.publicId}-${file.name}`}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            {file.url ? (
                              <a
                                className="text-primary underline"
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {file.name}
                              </a>
                            ) : (
                              <span>{file.name}</span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              ({Math.ceil(file.size / 1024)} KB)
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {entry.senderId === userId && entry.readAt && (
                      <p className="mt-2 text-right text-xs text-muted-foreground">
                        Read {new Date(entry.readAt).toLocaleString()}
                      </p>
                    )}
                  </article>
                ))}
              </section>
              {message &&
                (message.recipientId === userId ||
                  message.senderId === userId) && (
                  <section
                    className="border-t border-border pt-5"
                    aria-label="Reply to conversation"
                  >
                    {replying ? (
                      <form
                        onSubmit={sendReply}
                        className="overflow-hidden rounded-xl border border-border bg-background shadow-sm"
                      >
                        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
                          <div>
                            <h2 className="text-sm font-semibold">Reply</h2>
                            <p className="text-xs text-muted-foreground">
                              Continue this email conversation
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setReplying(false);
                              setReplyFiles([]);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                        <div className="divide-y divide-border px-4">
                          <div className="flex gap-3 py-3 text-sm">
                            <span className="w-14 shrink-0 text-muted-foreground">
                              From
                            </span>
                            <span className="font-medium">
                              {userName || "You"}
                            </span>
                          </div>
                          <div className="flex gap-3 py-3 text-sm">
                            <span className="w-14 shrink-0 text-muted-foreground">
                              To
                            </span>
                            <span className="font-medium">
                              {replyRecipientName}
                            </span>
                          </div>
                          <div className="flex gap-3 py-3 text-sm">
                            <span className="w-14 shrink-0 text-muted-foreground">
                              Subject
                            </span>
                            <span className="font-medium">{replySubject}</span>
                          </div>
                        </div>
                        <div className="px-4 pb-3">
                          <Textarea
                            value={replyBody}
                            onChange={(event) =>
                              setReplyBody(event.target.value)
                            }
                            required
                            maxLength={10000}
                            rows={6}
                            aria-label="Reply message"
                            placeholder="Write your reply..."
                            className="min-h-36 resize-y border-0 px-0 shadow-none focus:border-0 focus:ring-0"
                          />
                          {thread.at(-1) && (
                            <details className="mt-2 rounded-lg bg-muted/40 px-3 py-2">
                              <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                                Show quoted message from{" "}
                                {thread.at(-1)?.senderName}
                              </summary>
                              <blockquote className="mt-2 whitespace-pre-wrap border-l-2 border-border pl-3 text-xs leading-5 text-muted-foreground">
                                {thread.at(-1)?.body}
                              </blockquote>
                            </details>
                          )}
                          {replyFiles.length > 0 && (
                            <ul className="mt-3 flex flex-wrap gap-2">
                              {replyFiles.map((file, index) => (
                                <li
                                  key={`${file.name}-${file.lastModified}`}
                                  className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs"
                                >
                                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="max-w-48 truncate">
                                    {file.name}
                                  </span>
                                  <button
                                    type="button"
                                    aria-label={`Remove ${file.name}`}
                                    className="font-semibold text-muted-foreground hover:text-foreground"
                                    onClick={() =>
                                      setReplyFiles((files) =>
                                        files.filter(
                                          (_, fileIndex) => fileIndex !== index,
                                        ),
                                      )
                                    }
                                  >
                                    ×
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <label
                              htmlFor="replyAttachments"
                              className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <Paperclip className="h-4 w-4" />
                              Attach files
                            </label>
                            <input
                              id="replyAttachments"
                              type="file"
                              multiple
                              className="sr-only"
                              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,application/pdf"
                              onChange={(event) => {
                                const files = Array.from(
                                  event.target.files ?? [],
                                );
                                const nextFiles = [...replyFiles, ...files];
                                if (
                                  nextFiles.length > 10 ||
                                  nextFiles.some(
                                    (file) => file.size > 10 * 1024 * 1024,
                                  )
                                ) {
                                  setError(
                                    "Choose up to 10 files, each no larger than 10 MB.",
                                  );
                                  event.target.value = "";
                                  return;
                                }
                                setError("");
                                setReplyFiles(nextFiles);
                                event.target.value = "";
                              }}
                            />
                            <span className="text-xs text-muted-foreground">
                              Up to 10 files · 10 MB each
                            </span>
                          </div>
                          <Button type="submit" loading={sendingReply}>
                            <Reply className="h-4 w-4" /> Send reply
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReplying(true)}
                        className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/20 p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Reply className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">
                            Reply to {replyRecipientName}
                            {replyRecipientRole
                              ? ` · ${replyRecipientRole}`
                              : ""}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            Click to write a reply in this conversation
                          </span>
                        </span>
                      </button>
                    )}
                  </section>
                )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <p className="py-10 text-center text-sm text-muted-foreground">
                Message not found.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </AdminAuthGuard>
  );
}
