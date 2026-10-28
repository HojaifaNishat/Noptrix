
"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Globe,
  Laptop,
  LoaderCircle,
  LogOut,
  MapPin,
  Monitor,
  RefreshCw,
  Shield,
  ShieldAlert,
  Smartphone,
  Tablet,
  Trash2,
} from "lucide-react";

import sessionsApi, {
  type UserSession,
} from "@/services/api/sessions.api";

type Notice = {
  type: "success" | "error";
  message: string;
};

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function formatDate(value?: string): string {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getDeviceName(userAgent?: string): string {
  if (!userAgent) return "Unknown device";

  if (/ipad|tablet/i.test(userAgent)) return "Tablet";
  if (/iphone|android.*mobile|mobile/i.test(userAgent)) {
    return "Mobile device";
  }

  if (/windows/i.test(userAgent)) return "Windows computer";
  if (/macintosh|mac os/i.test(userAgent)) return "Mac computer";
  if (/linux/i.test(userAgent)) return "Linux computer";

  return "Computer or other device";
}

function getBrowserName(userAgent?: string): string {
  if (!userAgent) return "Browser not identified";

  if (/edg\//i.test(userAgent)) return "Microsoft Edge";
  if (/opr\/|opera/i.test(userAgent)) return "Opera";
  if (/firefox\//i.test(userAgent)) return "Mozilla Firefox";
  if (/chrome\//i.test(userAgent) && !/edg\//i.test(userAgent)) {
    return "Google Chrome";
  }
  if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) {
    return "Apple Safari";
  }

  return "Browser not identified";
}

function getDeviceIcon(userAgent?: string) {
  if (/ipad|tablet/i.test(userAgent ?? "")) return Tablet;

  if (/iphone|android.*mobile|mobile/i.test(userAgent ?? "")) {
    return Smartphone;
  }

  return Monitor;
}

function isExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;

  const timestamp = new Date(expiresAt).getTime();

  return Number.isFinite(timestamp) && timestamp <= Date.now();
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm text-slate-800">
        {value}
      </p>
    </div>
  );
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showRevokeAllConfirmation, setShowRevokeAllConfirmation] =
    useState(false);

  const loadSessions = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await sessionsApi.getMySessions();

      setSessions(result);
      setNotice(null);
    } catch (error: unknown) {
      setNotice({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  async function handleRevoke(session: UserSession) {
    if (!session.sessionId) {
      setNotice({
        type: "error",
        message: "This session has no usable identifier.",
      });
      return;
    }

    const device = getDeviceName(session.userAgent);

    const confirmed = window.confirm(
      `Sign out ${device}?\n\nThat session will no longer be able to refresh its login.`,
    );

    if (!confirmed) return;

    setRevokingId(session.sessionId);
    setNotice(null);

    try {
      await sessionsApi.revokeSession(session.sessionId);

      setSessions((current) =>
        current.filter((item) => item.sessionId !== session.sessionId),
      );

      setNotice({
        type: "success",
        message: session.isCurrent
          ? "Your current session was revoked. You may need to sign in again."
          : "The selected session was revoked successfully.",
      });

      if (session.isCurrent) {
        await loadSessions(true);
      }
    } catch (error: unknown) {
      setNotice({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setRevokingId(null);
    }
  }

  async function handleRevokeAll() {
    setShowRevokeAllConfirmation(false);
    setRevokingAll(true);
    setNotice(null);

    try {
      const revokedCount = await sessionsApi.revokeAllSessions();

      setSessions([]);

      setNotice({
        type: "success",
        message:
          revokedCount === undefined
            ? "The session revocation request completed. You may need to sign in again."
            : `${revokedCount} session(s) revoked. You may need to sign in again.`,
      });
    } catch (error: unknown) {
      setNotice({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setRevokingAll(false);
    }
  }

  const activeSessions = sessions.filter(
    (session) => !isExpired(session.expiresAt),
  );

  const currentSessionCount = sessions.filter(
    (session) => session.isCurrent,
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <Shield className="h-4 w-4" />
              Account security
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Your sessions
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review where your account is signed in. Revoke sessions
              you do not recognize or no longer use.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadSessions(true)}
            disabled={loading || refreshing || revokingAll}
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </header>

        {notice && (
          <div
            role={notice.type === "error" ? "alert" : "status"}
            aria-live="polite"
            className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
              notice.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {notice.type === "error" ? (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            )}

            <p className="break-words">{notice.message}</p>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Active sessions
              </p>
              <Monitor className="h-5 w-5 text-blue-600" />
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums">
              {loading ? "—" : activeSessions.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Current device
              </p>
              <Shield className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums">
              {loading ? "—" : currentSessionCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Sessions identified as current
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Security status
              </p>
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            </div>
            <p className="mt-3 text-lg font-bold">
              Review regularly
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Sign out devices you do not recognize.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold">Signed-in devices</h2>
              <p className="mt-1 text-sm text-slate-500">
                Device details depend on information provided by the browser.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowRevokeAllConfirmation(true)}
              disabled={
                loading ||
                sessions.length === 0 ||
                revokingAll ||
                revokingId !== null
              }
              className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"
            >
              {revokingAll ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Sign out all sessions
            </button>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Loading your sessions…
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <div className="rounded-2xl bg-slate-100 p-4">
                <Shield className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mt-4 font-semibold">
                No active sessions found
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                There are no sessions to display. Refresh to check again.
              </p>
              <button
                type="button"
                onClick={() => void loadSessions(true)}
                disabled={refreshing}
                className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sessions.map((session, index) => {
                const DeviceIcon = getDeviceIcon(session.userAgent);
                const current = Boolean(session.isCurrent);
                const expired = isExpired(session.expiresAt);
                const busy =
                  revokingId === session.sessionId || revokingAll;

                return (
                  <article
                    key={
                      session.sessionId ||
                      session.deviceId ||
                      `session-${index}`
                    }
                    className="p-5 transition-colors hover:bg-slate-50/70 sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <DeviceIcon className="h-6 w-6" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">
                            {getDeviceName(session.userAgent)}
                          </h3>

                          {current && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              This session
                            </span>
                          )}

                          {expired && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              Expired
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {getBrowserName(session.userAgent)}
                        </p>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-500">
                                IP address
                              </p>
                              <p className="mt-1 break-all text-sm text-slate-800">
                                {session.ipAddress || "Not available"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-500">
                                Last activity
                              </p>
                              <p className="mt-1 text-sm text-slate-800">
                                {formatDate(session.lastUsedAt)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Globe className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-500">
                                Session ID
                              </p>
                              <p className="mt-1 break-all font-mono text-xs text-slate-600">
                                {session.sessionId}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-500">
                                Expires at
                              </p>
                              <p className="mt-1 text-sm text-slate-800">
                                {formatDate(session.expiresAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="sm:pl-3">
                        <button
                          type="button"
                          onClick={() => void handleRevoke(session)}
                          disabled={
                            busy ||
                            !session.sessionId ||
                            expired
                          }
                          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                        >
                          {revokingId === session.sessionId ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Revoke
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Keep your account secure
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                If you see a device or IP address you do not recognize,
                revoke that session and change your password. IP addresses
                and browser details may be incomplete or inaccurate.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showRevokeAllConfirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !revokingAll) {
              setShowRevokeAllConfirmation(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="revoke-all-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-700">
              <LogOut className="h-6 w-6" />
            </div>

            <h2
              id="revoke-all-title"
              className="mt-4 text-lg font-bold"
            >
              Sign out all sessions?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              This asks the server to revoke all sessions for your account,
              including potentially this device. You may need to sign in again.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowRevokeAllConfirmation(false)}
                disabled={revokingAll}
                className="min-h-10 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleRevokeAll()}
                disabled={revokingAll}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {revokingAll && (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                )}
                Revoke all sessions
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
