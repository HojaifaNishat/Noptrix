import type { Server as HttpServer } from "http";
import {
    Server,
    type Socket,
} from "socket.io";

import { Types } from "mongoose";
import { verifyAccessToken } from "../../utils/token";
import { User, USER_STATUSES } from "../users/user.model";
import { Admin, ADMIN_STATUSES } from "../admins/admin.model";
import { Owner, OWNER_STATUSES } from "../owners/owner.model";
import { Role, ROLE_STATUSES } from "../roles/role.model";
import { loadRolePermissions } from "../../middlewares/permission.middleware";

import {
    listConversationMessages,
    markConversationRead,
    sendConversationMessage,
} from "./live-chat.service";

type SocketActor = {
    id: string;
    type: "CUSTOMER" | "SUPPORT";
    isOwner?: boolean;
};

type LiveChatSocket = Socket & {
    data: {
        actor?: SocketActor;
    };
};

let io: Server | null = null;

const conversationRoom = (id: string) => `live-chat:conversation:${id}`;
const customerRoom = (id: string) => `live-chat:customer:${id}`;
const supportAgentRoom = (id: string) => `live-chat:support-agent:${id}`;
const supportUnassignedRoom = () => "live-chat:support-unassigned";
const ownerNotificationsRoom = () => "live-chat:owner-notifications";

const acknowledge = (
    callback: unknown,
    result: Record<string, unknown>,
): void => {
    if (typeof callback === "function") {
        (callback as (value: Record<string, unknown>) => void)(result);
    }
};

const authenticateSocket = async (
    socket: LiveChatSocket,
): Promise<SocketActor> => {
    const authToken = socket.handshake.auth?.token;
    const authorization = socket.handshake.headers.authorization;

    const token =
        typeof authToken === "string"
            ? authToken
            : typeof authorization === "string" &&
                authorization.startsWith("Bearer ")
              ? authorization.slice(7)
              : "";

    if (!token) {
        throw new Error("Authentication required.");
    }

    let payload;

    try {
        payload = verifyAccessToken(token);
    } catch {
        throw new Error("Invalid or expired access token.");
    }

    const subject = String(payload.sub ?? "");

    if (!Types.ObjectId.isValid(subject)) {
        throw new Error("Invalid access token subject.");
    }

    const claims = payload as typeof payload & {
        role?: unknown;
        secretVerified?: unknown;
        tokenType?: unknown;
    };

    if (claims.tokenType !== "access") {
        throw new Error("An access token is required.");
    }

    if (typeof claims.role === "string" && claims.role.trim()) {
        const roleClaim = claims.role.trim().toUpperCase();

        if (roleClaim === "OWNER") {
            if (claims.secretVerified !== true) {
                throw new Error("OWNER secret verification required.");
            }

            const owner = await Owner.findOne({
                userId: new Types.ObjectId(subject),
            }).lean();

            if (!owner || owner.status !== OWNER_STATUSES.ACTIVE) {
                throw new Error("Active OWNER account required.");
            }

            const user = await User.findById(owner.userId)
                .select("_id status")
                .lean();

            if (!user || user.status !== USER_STATUSES.ACTIVE) {
                throw new Error("OWNER user account is inactive.");
            }

            return { id: String(owner.userId), type: "SUPPORT", isOwner: true };
        }

        let admin = await Admin.findById(subject).lean();

        if (!admin) {
            admin = await Admin.findOne({
                userId: new Types.ObjectId(subject),
            }).lean();
        }

        if (!admin || admin.status !== ADMIN_STATUSES.ACTIVE) {
            throw new Error("Active support account required.");
        }

        const user = await User.findById(admin.userId)
            .select("_id status")
            .lean();

        if (!user || user.status !== USER_STATUSES.ACTIVE) {
            throw new Error("Support account is inactive.");
        }

        const role = await Role.findById(admin.roleId).lean();

        if (!role || role.status !== ROLE_STATUSES.ACTIVE) {
            throw new Error("Support role is inactive.");
        }

        const permissions = await loadRolePermissions(String(admin.roleId));

        if (!permissions.includes("live-chat.read")) {
            throw new Error("Live Chat read permission required.");
        }

        return { id: String(admin.userId), type: "SUPPORT", isOwner: false };
    }

    const user = await User.findById(subject)
        .select("_id status")
        .lean();

    if (!user || user.status !== USER_STATUSES.ACTIVE) {
        throw new Error("Active customer account required.");
    }

    return { id: subject, type: "CUSTOMER", isOwner: false };
};

export const initializeLiveChatSocket = (
    httpServer: HttpServer,
): Server => {
    if (io) {
        return io;
    }

    io = new Server(httpServer, {
        cors: {
            origin: true,
            credentials: true,
        },
        transports: ["websocket", "polling"],
    });

    io.use((socket, next) => {
        void authenticateSocket(socket as LiveChatSocket)
            .then((actor) => {
                (socket as LiveChatSocket).data.actor = actor;
                next();
            })
            .catch(() => {
                next(new Error("Live Chat authentication failed."));
            });
    });

    io.on("connection", (rawSocket) => {
        const socket = rawSocket as LiveChatSocket;
        const actor = socket.data.actor;

        if (!actor) {
            socket.disconnect(true);
            return;
        }

        if (actor.type === "CUSTOMER") {
            void socket.join(customerRoom(actor.id));
        } else if (actor.isOwner === true) {
            // OWNER can receive updates for all conversations.
            void socket.join(ownerNotificationsRoom());
        } else {
            // Support agents receive updates for their own and unassigned
            // conversations only. Message access is checked separately.
            void socket.join(supportAgentRoom(actor.id));
            void socket.join(supportUnassignedRoom());
        }

        socket.on("live-chat:join", async (data: unknown, callback?: unknown) => {
            try {
                if (
                    !data ||
                    typeof data !== "object" ||
                    !("conversationId" in data) ||
                    typeof data.conversationId !== "string"
                ) {
                    acknowledge(callback, {
                        success: false,
                        message: "A valid conversationId is required.",
                    });
                    return;
                }

                const conversationId = data.conversationId;

                // This call verifies ownership or support permission and
                // assignment before the socket joins the room.
                await listConversationMessages(
                    conversationId,
                    actor,
                    1,
                    1,
                );

                await socket.join(conversationRoom(conversationId));

                acknowledge(callback, {
                    success: true,
                    conversationId,
                });
            } catch {
                acknowledge(callback, {
                    success: false,
                    message: "Conversation access denied.",
                });
            }
        });

        socket.on("live-chat:leave", async (data: unknown) => {
            if (
                data &&
                typeof data === "object" &&
                "conversationId" in data &&
                typeof data.conversationId === "string" &&
                Types.ObjectId.isValid(data.conversationId)
            ) {
                await socket.leave(conversationRoom(data.conversationId));
            }
        });

        socket.on("live-chat:typing", (data: unknown) => {
            if (
                !data ||
                typeof data !== "object" ||
                !("conversationId" in data) ||
                typeof data.conversationId !== "string" ||
                !socket.rooms.has(conversationRoom(data.conversationId))
            ) {
                return;
            }

            socket.to(conversationRoom(data.conversationId)).emit(
                "live-chat:typing",
                {
                    conversationId: data.conversationId,
                    senderType: actor.type,
                    isTyping: "isTyping" in data && data.isTyping === true,
                },
            );
        });

        socket.on("live-chat:send", async (data: unknown, callback?: unknown) => {
            try {
                if (
                    !data ||
                    typeof data !== "object" ||
                    !("conversationId" in data) ||
                    typeof data.conversationId !== "string" ||
                    !("body" in data)
                ) {
                    acknowledge(callback, {
                        success: false,
                        message: "conversationId and body are required.",
                    });
                    return;
                }

                const conversationId = data.conversationId;

                // Never trust a client-provided sender ID or sender type.
                const result = await sendConversationMessage(
                    conversationId,
                    actor,
                    data.body,
                );

                const event = {
                    conversation: result.conversation,
                    message: result.message,
                };

                io?.to(conversationRoom(conversationId)).emit(
                    "live-chat:message",
                    event,
                );

                const assignedAdminId = String(
                    result.conversation.assignedAdminId ?? "",
                );

                const inboxUpdate = {
                    conversationId,
                    lastMessageAt: result.conversation.lastMessageAt,
                };

                // OWNER may monitor all conversations.
                io?.to(ownerNotificationsRoom()).emit(
                    "live-chat:inbox-updated",
                    inboxUpdate,
                );

                if (assignedAdminId) {
                    // Only the assigned agent gets this conversation update.
                    io?.to(supportAgentRoom(assignedAdminId)).emit(
                        "live-chat:inbox-updated",
                        inboxUpdate,
                    );
                } else {
                    // Unassigned conversations are visible to eligible agents.
                    io?.to(supportUnassignedRoom()).emit(
                        "live-chat:inbox-updated",
                        inboxUpdate,
                    );
                }

                io?.to(customerRoom(String(result.conversation.customerId))).emit(
                    "live-chat:inbox-updated",
                    {
                        conversationId,
                        lastMessageAt: result.conversation.lastMessageAt,
                    },
                );

                acknowledge(callback, {
                    success: true,
                    data: event,
                });
            } catch (error) {
                acknowledge(callback, {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unable to send message.",
                });
            }
        });

        socket.on("live-chat:read", async (data: unknown, callback?: unknown) => {
            try {
                if (
                    !data ||
                    typeof data !== "object" ||
                    !("conversationId" in data) ||
                    typeof data.conversationId !== "string" ||
                    !socket.rooms.has(conversationRoom(data.conversationId))
                ) {
                    acknowledge(callback, {
                        success: false,
                        message: "Join an authorized conversation first.",
                    });
                    return;
                }

                const result = await markConversationRead(
                    data.conversationId,
                    actor,
                );

                io?.to(conversationRoom(data.conversationId)).emit(
                    "live-chat:read",
                    {
                        ...result,
                        readerType: actor.type,
                    },
                );

                acknowledge(callback, {
                    success: true,
                    data: result,
                });
            } catch {
                acknowledge(callback, {
                    success: false,
                    message: "Unable to mark messages as read.",
                });
            }
        });
    });

    return io;
};

export const notifyLiveChatAssignment = (conversation: {
    _id: unknown;
    assignedAdminId?: unknown;
    lastMessageAt?: Date;
}): void => {
    if (!io) return;

    const conversationId = String(conversation._id);
    const assignedAdminId = String(conversation.assignedAdminId ?? "");

    // Refresh unassigned inboxes without disclosing the conversation ID.
    io.to(supportUnassignedRoom()).emit("live-chat:inbox-updated", {
        refresh: true,
    });

    io.to(ownerNotificationsRoom()).emit("live-chat:inbox-updated", {
        conversationId,
        lastMessageAt: conversation.lastMessageAt,
    });

    if (assignedAdminId) {
        io.to(supportAgentRoom(assignedAdminId)).emit(
            "live-chat:inbox-updated",
            {
                conversationId,
                lastMessageAt: conversation.lastMessageAt,
            },
        );
    }
};

export const disconnectLiveChatSockets = (): void => {
    io?.disconnectSockets(true);
};

export const getLiveChatSocketServer = (): Server | null => io;
