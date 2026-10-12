import { Types } from "mongoose";

import { ApiError } from "../../utils/ApiError";
import { User, USER_STATUSES } from "../users/user.model";
import { Admin, ADMIN_STATUSES } from "../admins/admin.model";
import { Owner, OWNER_STATUSES } from "../owners/owner.model";
import { Role, ROLE_STATUSES } from "../roles/role.model";
import { loadRolePermissions } from "../../middlewares/permission.middleware";

import { LiveChatConversation } from "./live-chat-conversation.model";
import { LiveChatMessage } from "./live-chat-message.model";
import {
    LIVE_CHAT_STATUSES,
    LIVE_CHAT_SENDER_TYPES,
    LIVE_CHAT_MESSAGE_STATUSES,
} from "./live-chat.types";

const PAGE_SIZE_MAX = 100;
const MESSAGE_MAX_LENGTH = 2000;

type Actor = {
    id: string;
    type: "CUSTOMER" | "SUPPORT";
};

const objectId = (id: string): Types.ObjectId => {
    if (!Types.ObjectId.isValid(id)) {
        throw ApiError.unauthorized("Invalid authenticated identity.");
    }

    return new Types.ObjectId(id);
};

const parsePage = (value: unknown): number => {
    const page = Number(value ?? 1);
    return Number.isInteger(page) && page > 0 ? page : 1;
};

const parseLimit = (value: unknown): number => {
    const limit = Number(value ?? 25);
    return Number.isInteger(limit) && limit > 0
        ? Math.min(limit, PAGE_SIZE_MAX)
        : 25;
};

const normalizeMessage = (body: unknown): string => {
    if (typeof body !== "string") {
        throw ApiError.badRequest("Message body is required.");
    }

    const normalized = body.trim();

    if (!normalized || normalized.length > MESSAGE_MAX_LENGTH) {
        throw ApiError.badRequest(
            `Message must contain 1-${MESSAGE_MAX_LENGTH} characters.`,
        );
    }

    return normalized;
};

const ensureActiveCustomer = async (userId: string) => {
    const user = await User.findById(objectId(userId))
        .select("_id status name email")
        .lean();

    if (!user || user.status !== USER_STATUSES.ACTIVE) {
        throw ApiError.forbidden("An active customer account is required.");
    }

    return user;
};

const resolveSupportAgent = async (
    authenticatedId: string,
    permission?: "live-chat.read" | "live-chat.reply",
) => {
    const identity = objectId(authenticatedId);

    // OWNER is a separate identity and is not an Admin record.
    const owner = await Owner.findOne({
        userId: identity,
    }).lean();

    if (owner) {
        if (owner.status !== OWNER_STATUSES.ACTIVE) {
            throw ApiError.forbidden("The OWNER account is inactive.");
        }

        const user = await User.findById(owner.userId)
            .select("_id status")
            .lean();

        if (!user || user.status !== USER_STATUSES.ACTIVE) {
            throw ApiError.forbidden("The OWNER user account is inactive.");
        }

        return {
            userId: String(owner.userId),
            isOwner: true,
        };
    }

    // Regular support identities resolve through the Admin model.
    let admin = await Admin.findById(identity).lean();

    if (!admin) {
        admin = await Admin.findOne({ userId: identity }).lean();
    }

    if (!admin || admin.status !== ADMIN_STATUSES.ACTIVE) {
        throw ApiError.forbidden("An active support account is required.");
    }

    const user = await User.findById(admin.userId)
        .select("_id status")
        .lean();

    if (!user || user.status !== USER_STATUSES.ACTIVE) {
        throw ApiError.forbidden("The support account is inactive.");
    }

    const role = await Role.findById(admin.roleId).lean();

    if (!role || role.status !== ROLE_STATUSES.ACTIVE) {
        throw ApiError.forbidden("The support role is inactive.");
    }

    if (permission) {
        const permissions = await loadRolePermissions(String(admin.roleId));

        if (!permissions.includes(permission)) {
            throw ApiError.forbidden(
                `Missing required permission: ${permission}.`,
            );
        }
    }

    return {
        userId: String(user._id),
        isOwner: false,
    };
};

const ensureConversationAccess = async (
    conversationId: string,
    actor: Actor,
    permission?: "live-chat.read" | "live-chat.reply",
) => {
    if (!Types.ObjectId.isValid(conversationId)) {
        throw ApiError.badRequest("Invalid conversation ID.");
    }

    const conversation = await LiveChatConversation.findById(conversationId);

    if (!conversation) {
        throw ApiError.notFound("Conversation not found.");
    }

    if (actor.type === "CUSTOMER") {
        if (String(conversation.customerId) !== actor.id) {
            // Do not disclose another customer's conversation.
            throw ApiError.notFound("Conversation not found.");
        }

        await ensureActiveCustomer(actor.id);
        return conversation;
    }

    const support = await resolveSupportAgent(actor.id, permission);

    if (
        !support.isOwner &&
        conversation.assignedAdminId &&
        String(conversation.assignedAdminId) !== support.userId
    ) {
        throw ApiError.forbidden(
            "This conversation is assigned to another support agent.",
        );
    }

    return conversation;
};

export const createCustomerConversation = async (
    customerId: string,
    input: { subject?: unknown; message?: unknown },
) => {
    await ensureActiveCustomer(customerId);

    const firstMessage = normalizeMessage(input.message);
    const subject =
        typeof input.subject === "string" && input.subject.trim()
            ? input.subject.trim().slice(0, 150)
            : "Customer Support";

    const customerObjectId = objectId(customerId);

    const conversation = await LiveChatConversation.create({
        customerId: customerObjectId,
        subject,
        status: LIVE_CHAT_STATUSES.OPEN,
        lastMessage: firstMessage,
        lastMessageAt: new Date(),
        lastMessageSenderId: customerObjectId,
        customerUnreadCount: 0,
        supportUnreadCount: 1,
    });

    const message = await LiveChatMessage.create({
        conversationId: conversation._id,
        senderId: customerObjectId,
        senderType: LIVE_CHAT_SENDER_TYPES.CUSTOMER,
        body: firstMessage,
        status: LIVE_CHAT_MESSAGE_STATUSES.SENT,
    });

    return { conversation, message };
};

export const listCustomerConversations = async (
    customerId: string,
    pageInput?: unknown,
    limitInput?: unknown,
) => {
    await ensureActiveCustomer(customerId);

    const page = parsePage(pageInput);
    const limit = parseLimit(limitInput);
    const filter = { customerId: objectId(customerId) };

    const [items, total] = await Promise.all([
        LiveChatConversation.find(filter)
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        LiveChatConversation.countDocuments(filter),
    ]);

    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const listSupportInbox = async (
    adminId: string,
    pageInput?: unknown,
    limitInput?: unknown,
    statusInput?: unknown,
) => {
    const support = await resolveSupportAgent(adminId, "live-chat.read");
    const page = parsePage(pageInput);
    const limit = parseLimit(limitInput);

    const filter: Record<string, unknown> = {};

    if (!support.isOwner) {
        filter.$or = [
            { assignedAdminId: objectId(support.userId) },
            { assignedAdminId: { $exists: false } },
        ];
    }

    if (
        typeof statusInput === "string" &&
        Object.values(LIVE_CHAT_STATUSES).includes(
            statusInput as (typeof LIVE_CHAT_STATUSES)[keyof typeof LIVE_CHAT_STATUSES],
        )
    ) {
        filter.status = statusInput;
    } else {
        filter.status = {
            $in: [LIVE_CHAT_STATUSES.OPEN, LIVE_CHAT_STATUSES.WAITING],
        };
    }

    const [items, total] = await Promise.all([
        LiveChatConversation.find(filter)
            .sort({ lastMessageAt: -1, updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("customerId", "name email avatarUrl")
            .lean(),
        LiveChatConversation.countDocuments(filter),
    ]);

    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const listConversationMessages = async (
    conversationId: string,
    actor: Actor,
    pageInput?: unknown,
    limitInput?: unknown,
) => {
    const permission =
        actor.type === "SUPPORT" ? "live-chat.read" : undefined;

    const conversation = await ensureConversationAccess(
        conversationId,
        actor,
        permission,
    );

    const page = parsePage(pageInput);
    const limit = parseLimit(limitInput);
    const filter = { conversationId: conversation._id };

    const [items, total] = await Promise.all([
        LiveChatMessage.find(filter)
            .sort({ createdAt: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        LiveChatMessage.countDocuments(filter),
    ]);

    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const sendConversationMessage = async (
    conversationId: string,
    actor: Actor,
    body: unknown,
) => {
    const permission =
        actor.type === "SUPPORT" ? "live-chat.reply" : undefined;

    const conversation = await ensureConversationAccess(
        conversationId,
        actor,
        permission,
    );

    if (
        conversation.status === LIVE_CHAT_STATUSES.RESOLVED ||
        conversation.status === LIVE_CHAT_STATUSES.CLOSED
    ) {
        throw ApiError.conflict(
            "This conversation is closed. Reopen it before sending a message.",
        );
    }

    const text = normalizeMessage(body);
    let senderUserId = actor.id;
    let senderType: (typeof LIVE_CHAT_SENDER_TYPES)[keyof typeof LIVE_CHAT_SENDER_TYPES] = LIVE_CHAT_SENDER_TYPES.CUSTOMER;

    if (actor.type === "SUPPORT") {
        const support = await resolveSupportAgent(actor.id, "live-chat.reply");
        senderUserId = support.userId;
        senderType = LIVE_CHAT_SENDER_TYPES.SUPPORT;
    } else {
        await ensureActiveCustomer(actor.id);
    }

    const message = await LiveChatMessage.create({
        conversationId: conversation._id,
        senderId: objectId(senderUserId),
        senderType,
        body: text,
        status: LIVE_CHAT_MESSAGE_STATUSES.SENT,
    });

    conversation.lastMessage = text;
    conversation.lastMessageAt = new Date();
    conversation.lastMessageSenderId = objectId(senderUserId);

    if (actor.type === "CUSTOMER") {
        conversation.status = LIVE_CHAT_STATUSES.OPEN;
        conversation.supportUnreadCount += 1;
    } else {
        conversation.customerUnreadCount += 1;
        if (conversation.status === LIVE_CHAT_STATUSES.OPEN) {
            conversation.status = LIVE_CHAT_STATUSES.WAITING;
        }
    }

    await conversation.save();

    return { conversation, message };
};

export const markConversationRead = async (
    conversationId: string,
    actor: Actor,
) => {
    const permission =
        actor.type === "SUPPORT" ? "live-chat.read" : undefined;

    const conversation = await ensureConversationAccess(
        conversationId,
        actor,
        permission,
    );

    const senderType =
        actor.type === "CUSTOMER"
            ? LIVE_CHAT_SENDER_TYPES.SUPPORT
            : LIVE_CHAT_SENDER_TYPES.CUSTOMER;

    const readAt = new Date();

    await LiveChatMessage.updateMany(
        {
            conversationId: conversation._id,
            senderType,
            status: LIVE_CHAT_MESSAGE_STATUSES.SENT,
        },
        {
            $set: {
                status: LIVE_CHAT_MESSAGE_STATUSES.READ,
                readAt,
            },
        },
    );

    if (actor.type === "CUSTOMER") {
        conversation.customerUnreadCount = 0;
    } else {
        conversation.supportUnreadCount = 0;
    }

    await conversation.save();

    return { conversationId, readAt };
};

export const resolveConversation = async (
    conversationId: string,
    adminId: string,
) => {
    const conversation = await ensureConversationAccess(
        conversationId,
        { id: adminId, type: "SUPPORT" },
        "live-chat.reply",
    );

    conversation.status = LIVE_CHAT_STATUSES.RESOLVED;
    conversation.resolvedAt = new Date();
    await conversation.save();

    return conversation;
};

export const assignConversationToAdmin = async (
    conversationId: string,
    ownerId: string,
    targetAdminId: string,
) => {
    // Verify that the caller is an active OWNER.
    const owner = await resolveSupportAgent(ownerId);

    if (!owner.isOwner) {
        throw ApiError.forbidden(
            "Only the OWNER can assign support conversations.",
        );
    }

    if (
        typeof targetAdminId !== "string" ||
        !Types.ObjectId.isValid(targetAdminId)
    ) {
        throw ApiError.badRequest("A valid target admin ID is required.");
    }

    const conversation = await ensureConversationAccess(
        conversationId,
        { id: ownerId, type: "SUPPORT" },
        "live-chat.reply",
    );

    if (
        conversation.status === LIVE_CHAT_STATUSES.RESOLVED ||
        conversation.status === LIVE_CHAT_STATUSES.CLOSED
    ) {
        throw ApiError.badRequest(
            "Resolved or closed conversations cannot be assigned.",
        );
    }

    const targetAdmin = await Admin.findById(targetAdminId).lean();

    if (
        !targetAdmin ||
        targetAdmin.status !== ADMIN_STATUSES.ACTIVE
    ) {
        throw ApiError.badRequest(
            "The target admin account is not active.",
        );
    }

    const targetUser = await User.findById(targetAdmin.userId)
        .select("_id status")
        .lean();

    if (!targetUser || targetUser.status !== USER_STATUSES.ACTIVE) {
        throw ApiError.badRequest(
            "The target admin's user account is not active.",
        );
    }

    const targetRole = await Role.findById(targetAdmin.roleId).lean();

    if (!targetRole || targetRole.status !== ROLE_STATUSES.ACTIVE) {
        throw ApiError.badRequest(
            "The target admin's role is not active.",
        );
    }

    const permissions = await loadRolePermissions(
        String(targetAdmin.roleId),
    );

    if (
        !permissions.includes("live-chat.read") ||
        !permissions.includes("live-chat.reply")
    ) {
        throw ApiError.badRequest(
            "The target admin must have live-chat.read and live-chat.reply permissions.",
        );
    }

    // assignedAdminId references User, not Admin.
    conversation.assignedAdminId = targetUser._id;

    await conversation.save();

    return conversation;
};
