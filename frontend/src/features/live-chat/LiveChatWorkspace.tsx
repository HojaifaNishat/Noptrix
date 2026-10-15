"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  CheckCheck,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Send,
  UserRound,
  Wifi,
  WifiOff,
} from "lucide-react";

import { useAuthStore } from "@/stores/auth.store";
import { getLiveChatSocket } from "@/lib/socket/live-chat-socket";
import { liveChatApi } from "@/services/api/live-chat.api";
import {
  getEntityId,
  getEntityLabel,
  type LiveChatConversation,
  type LiveChatMessage,
  type LiveChatMode,
  type LiveChatStatus,
} from "./live-chat.types";

interface Props {
  mode: LiveChatMode;
}

function formatDate(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function errorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: { message?: string };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

const statusClasses: Record<LiveChatStatus, string> = {
  OPEN: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  WAITING: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  RESOLVED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  CLOSED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

export default function LiveChatWorkspace({ mode }: Props) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const isCustomer = mode === "CUSTOMER";
  const isOwner = mode === "OWNER";

  const authReady = !isAuthLoading && isAuthenticated && !!user;

  const [conversations, setConversations] = useState<
    LiveChatConversation[]
  >([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [assignmentId, setAssignmentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);

  const messageEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = useMemo(
    () => conversations.find((item) => item._id === selectedId),
    [conversations, selectedId],
  );

  const loadInbox = useCallback(async () => {
    try {
      setError("");
      const result = isCustomer
        ? await liveChatApi.getCustomerConversations()
        : isOwner
          ? await liveChatApi.getOwnerInbox()
          : await liveChatApi.getAdminInbox();

      setConversations(result.items);

      setSelectedId((current) => {
        if (current && result.items.some((item) => item._id === current)) {
          return current;
        }
        return result.items[0]?._id ?? "";
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [isCustomer, isOwner]);

  const appendMessage = useCallback((message: LiveChatMessage) => {
    setMessages((current) => {
      if (current.some((item) => item._id === message._id)) {
        return current;
      }
      return [...current, message];
    });
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      setMessagesLoading(true);
      setError("");

      const result = await liveChatApi.getMessages(mode, conversationId);
      setMessages(result.items);

      try {
        await liveChatApi.markRead(mode, conversationId);
      } catch {
        // Reading the thread must not hide successfully loaded messages.
      }

      const socket = getLiveChatSocket();
      socket?.emit("live-chat:join", { conversationId });
      socket?.emit("live-chat:read", { conversationId });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setMessagesLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    if (!authReady) {
      setLoading(isAuthLoading);
      return;
    }

    void loadInbox();
  }, [authReady, isAuthLoading, loadInbox]);

  useEffect(() => {
    if (!authReady) {
      setMessages([]);
      return;
    }

    void loadMessages(selectedId);
  }, [authReady, selectedId, loadMessages]);

  useEffect(() => {
    if (!authReady) {
      setSocketConnected(false);
      return;
    }

    const socket = getLiveChatSocket();

    if (!socket) return;

    const onConnect = () => {
      setSocketConnected(true);
      if (selectedId) {
        socket.emit("live-chat:join", {
          conversationId: selectedId,
        });
      }
    };

    const onDisconnect = () => setSocketConnected(false);

    const onConnectError = (error: Error) => {
      setSocketConnected(false);
      console.error("[LiveChat] Socket connection error:", error.message);
    };

    const onMessage = (event: unknown) => {
      const eventRecord =
        event && typeof event === "object"
          ? event as Record<string, unknown>
          : null;

      const conversationRecord =
        eventRecord?.conversation &&
        typeof eventRecord.conversation === "object"
          ? eventRecord.conversation as Record<string, unknown>
          : null;

      const conversationId =
        typeof eventRecord?.conversationId === "string"
          ? eventRecord.conversationId
          : typeof conversationRecord?._id === "string"
            ? conversationRecord._id
            : "";

      const incomingMessage =
        eventRecord?.message &&
        typeof eventRecord.message === "object"
          ? eventRecord.message as LiveChatMessage
          : null;

      if (
        conversationId === selectedId &&
        incomingMessage &&
        typeof incomingMessage._id === "string"
      ) {
        appendMessage(incomingMessage);
      }

      void loadInbox();
    };

    const onInboxUpdated = () => {
      void loadInbox();
    };

    const onTyping = (event: unknown) => {
      if (!event || typeof event !== "object") return;
      const item = event as Record<string, unknown>;
      if (item.conversationId === selectedId) {
        setTyping(Boolean(item.typing));
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("live-chat:message", onMessage);
    socket.on("live-chat:inbox-updated", onInboxUpdated);
    socket.on("live-chat:typing", onTyping);

    setSocketConnected(socket.connected);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("live-chat:message", onMessage);
      socket.off("live-chat:inbox-updated", onInboxUpdated);
      socket.off("live-chat:typing", onTyping);
    };
  }, [authReady, selectedId, loadInbox, appendMessage, user?.id, user?.accountType]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedId]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newMessage.trim() || creating) return;

    try {
      setCreating(true);
      setError("");
      setNotice("");

      const conversation = await liveChatApi.createConversation({
        subject: newSubject.trim() || "Customer Support",
        message: newMessage.trim(),
      });

      setNewSubject("");
      setNewMessage("");
      setNotice("Support conversation created.");
      await loadInbox();
      setSelectedId(conversation._id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const body = draft.trim();
    if (!body || !selectedId || sending) return;

    if (selected?.status === "RESOLVED" || selected?.status === "CLOSED") {
      setError("This conversation is resolved or closed. Reopen it through the support workflow before replying.");
      return;
    }

    try {
      setSending(true);
      setError("");
      setNotice("");

      const sentMessage = await liveChatApi.sendMessage(
        mode,
        selectedId,
        body,
      );

      appendMessage(sentMessage);
      setDraft("");
      await loadInbox();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedId || working || isCustomer) return;

    try {
      setWorking(true);
      setError("");
      await liveChatApi.resolveConversation(
        isOwner ? "OWNER" : "ADMIN",
        selectedId,
      );
      setNotice("Conversation resolved.");
      await loadInbox();
      await loadMessages(selectedId);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setWorking(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedId || !assignmentId.trim() || working) return;

    try {
      setWorking(true);
      setError("");
      await liveChatApi.assignConversation(
        selectedId,
        assignmentId.trim(),
      );
      setAssignmentId("");
      setNotice("Conversation assigned successfully.");
      await loadInbox();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setWorking(false);
    }
  };

  const handleTyping = (value: string) => {
    setDraft(value);

    const socket = getLiveChatSocket();
    if (!socket || !selectedId) return;

    socket.emit("live-chat:typing", {
      conversationId: selectedId,
      typing: value.length > 0,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("live-chat:typing", {
        conversationId: selectedId,
        typing: false,
      });
    }, 1200);
  };

  const heading =
    isCustomer
      ? "Customer Support"
      : isOwner
        ? "Support Inbox · OWNER"
        : "Live Chat Inbox";

  return (
    <main className="min-h-[calc(100vh-2rem)] bg-gray-50 p-4 text-gray-900 dark:bg-gray-950 dark:text-gray-100 sm:p-6">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                <MessageCircle size={21} />
              </span>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {heading}
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {isCustomer
                    ? "Talk to the NOPTRIX support team."
                    : "Manage customer conversations in real time."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              {socketConnected ? (
                <Wifi size={15} className="text-emerald-600" />
              ) : (
                <WifiOff size={15} className="text-amber-600" />
              )}
              {socketConnected ? "Live connection" : "Connecting…"}
            </span>
            <button
              type="button"
              onClick={() => {
                void loadInbox();
                if (selectedId) void loadMessages(selectedId);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
            <button
              type="button"
              className="ml-auto underline"
              onClick={() => setError("")}
            >
              Dismiss
            </button>
          </div>
        )}

        {notice && (
          <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            {notice}
          </div>
        )}

        <div className="grid min-h-[650px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="flex min-h-[250px] flex-col border-b border-gray-200 dark:border-gray-800 lg:border-b-0 lg:border-r">
            <div className="border-b border-gray-100 p-4 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                  {isCustomer ? "Your conversations" : "Conversations"}
                </h2>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {conversations.length}
                </span>
              </div>
            </div>

            {isCustomer && (
              <form onSubmit={handleCreate} className="space-y-2 border-b border-gray-100 p-4 dark:border-gray-800">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
                  Start a conversation
                </label>
                <input
                  value={newSubject}
                  onChange={(event) => setNewSubject(event.target.value)}
                  maxLength={150}
                  placeholder="Subject (optional)"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-950"
                />
                <textarea
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  required
                  maxLength={2000}
                  rows={3}
                  placeholder="How can we help?"
                  className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-950"
                />
                <button
                  disabled={creating || !newMessage.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creating && <LoaderCircle size={15} className="animate-spin" />}
                  Start chat
                </button>
              </form>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center gap-2 p-8 text-sm text-gray-500">
                  <LoaderCircle size={18} className="animate-spin" />
                  Loading conversations…
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <MessageCircle size={28} className="mx-auto text-gray-300" />
                  <p className="mt-3 text-sm font-medium">No conversations yet</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {isCustomer
                      ? "Start a chat above to contact support."
                      : "New customer conversations will appear here."}
                  </p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const active = selectedId === conversation._id;
                  const customerLabel = getEntityLabel(conversation.customerId);

                  return (
                    <button
                      key={conversation._id}
                      type="button"
                      onClick={() => {
                        setSelectedId(conversation._id);
                        setNotice("");
                        setError("");
                      }}
                      className={[
                        "w-full border-b border-gray-100 p-4 text-left transition dark:border-gray-800",
                        active
                          ? "bg-indigo-50/80 dark:bg-indigo-950/30"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/60",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="line-clamp-1 text-sm font-semibold">
                          {conversation.subject || "Customer Support"}
                        </span>
                        <span className={[
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          statusClasses[conversation.status],
                        ].join(" ")}>
                          {conversation.status}
                        </span>
                      </div>

                      {!isCustomer && customerLabel && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                          <UserRound size={12} />
                          {customerLabel}
                        </p>
                      )}

                      <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                        {conversation.lastMessage || "No messages"}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-gray-400">
                          {formatDate(conversation.lastMessageAt || conversation.updatedAt)}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {isCustomer
                            ? conversation.customerUnreadCount > 0
                              ? `${conversation.customerUnreadCount} unread`
                              : ""
                            : conversation.supportUnreadCount > 0
                              ? `${conversation.supportUnreadCount} unread`
                              : ""}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex min-h-[500px] min-w-0 flex-col">
            {!selected ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800">
                  <MessageCircle size={25} />
                </span>
                <h2 className="mt-4 font-semibold">Select a conversation</h2>
                <p className="mt-1 max-w-sm text-sm text-gray-500">
                  Choose a conversation from the list to read and reply to messages.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4 dark:border-gray-800">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">
                      {selected.subject || "Customer Support"}
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      {isCustomer
                        ? "NOPTRIX Support Team"
                        : `Customer: ${getEntityLabel(selected.customerId) || getEntityId(selected.customerId)}`}
                    </p>
                  </div>

                  {!isCustomer && selected.status !== "RESOLVED" && selected.status !== "CLOSED" && (
                    <button
                      type="button"
                      onClick={() => void handleResolve()}
                      disabled={working}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      {working ? "Working…" : "Resolve"}
                    </button>
                  )}
                </div>

                {isOwner && (
                  <div className="flex flex-wrap items-end gap-2 border-b border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950/50">
                    <div className="min-w-[220px] flex-1">
                      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                        Assign to Admin (Admin record ID)
                      </label>
                      <input
                        value={assignmentId}
                        onChange={(event) => setAssignmentId(event.target.value)}
                        placeholder="Paste Admin ObjectId"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-900"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleAssign()}
                      disabled={working || !assignmentId.trim()}
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                    >
                      Assign
                    </button>
                    <p className="w-full text-xs text-gray-500">
                      Assignment requires an active Admin with the required Live Chat permissions.
                    </p>
                  </div>
                )}

                <div
                  className="flex-1 space-y-4 overflow-y-auto bg-gray-50/70 p-4 dark:bg-gray-950/40 sm:p-6"
                  aria-live="polite"
                >
                  {messagesLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                      <LoaderCircle size={18} className="animate-spin" />
                      Loading messages…
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-500">
                      No messages in this conversation yet.
                    </div>
                  ) : (
                    messages.map((message) => {
                      const ownMessage =
                        isCustomer
                          ? message.senderType === "CUSTOMER"
                          : message.senderType === "SUPPORT";

                      return (
                        <div
                          key={message._id}
                          className={[
                            "flex",
                            ownMessage ? "justify-end" : "justify-start",
                          ].join(" ")}
                        >
                          <div className={[
                            "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[75%]",
                            ownMessage
                              ? "rounded-br-md bg-indigo-600 text-white"
                              : "rounded-bl-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900",
                          ].join(" ")}>
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              {message.body}
                            </p>
                            <div className={[
                              "mt-2 flex items-center justify-end gap-1.5 text-[10px]",
                              ownMessage
                                ? "text-indigo-100"
                                : "text-gray-400",
                            ].join(" ")}>
                              <span>{formatDate(message.createdAt)}</span>
                              {ownMessage && message.status === "READ" && (
                                <CheckCheck size={13} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {typing && (
                    <p className="text-xs italic text-gray-500">
                      The other participant is typing…
                    </p>
                  )}
                  <div ref={messageEndRef} />
                </div>

                <form onSubmit={handleSend} className="border-t border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900 sm:p-4">
                  {selected.status === "RESOLVED" || selected.status === "CLOSED" ? (
                    <p className="rounded-lg bg-gray-100 p-3 text-center text-sm text-gray-500 dark:bg-gray-800">
                      This conversation is {selected.status.toLowerCase()}; sending is disabled.
                    </p>
                  ) : (
                    <div className="flex items-end gap-2">
                      <textarea
                        value={draft}
                        onChange={(event) => handleTyping(event.target.value)}
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" &&
                            !event.shiftKey &&
                            !event.nativeEvent.isComposing
                          ) {
                            event.preventDefault();
                            event.currentTarget.form?.requestSubmit();
                          }
                        }}
                        rows={2}
                        maxLength={2000}
                        placeholder="Write a message… (Enter to send, Shift+Enter for a new line)"
                        className="max-h-36 min-h-[48px] flex-1 resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-950"
                      />
                      <button
                        type="submit"
                        disabled={sending || !draft.trim()}
                        aria-label="Send message"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {sending
                          ? <LoaderCircle size={19} className="animate-spin" />
                          : <Send size={19} />}
                      </button>
                    </div>
                  )}
                  <p className="mt-2 text-[11px] text-gray-400">
                    Signed in as {user?.accountType || mode}. Do not send passwords or payment card details in chat.
                  </p>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
