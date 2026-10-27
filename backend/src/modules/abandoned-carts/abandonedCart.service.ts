
import {
  createHash,
  randomBytes,
} from "node:crypto";
import mongoose, { Types } from "mongoose";

import { env } from "../../config/env";
import { CartModel } from "../cart/cart.model";
import { User } from "../users/user.model";
import { sendEmail } from "../../services/email.service";
import { ApiError } from "../../utils/ApiError";
import { logger } from "../../utils/logger";
import AbandonedCartModel from "./abandonedCart.model";
import type { AbandonedCartListFilters } from "./abandonedCart.types";

const ABANDON_AFTER_MINUTES = 60;
const SNAPSHOT_RETENTION_DAYS = 90;
const TOKEN_TTL_HOURS = 48;
const FIRST_REMINDER_HOURS = 24;
const FINAL_REMINDER_HOURS = 72;
const MAX_REMINDERS = 2;

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

function makeRecoveryUrl(token: string) {
  const base = env.APP_URL.replace(/\/+$/, "");
  return `${base}/cart/recover?token=${encodeURIComponent(token)}`;
}

function isValidObjectId(value: string) {
  return Types.ObjectId.isValid(value);
}

/**
 * Detect inactive ACTIVE carts, create immutable snapshots,
 * and move their original cart into ABANDONED state.
 *
 * Run this periodically from a scheduler/worker.
 */
export async function detectAbandonedCarts(options?: {
  olderThanMinutes?: number;
  batchSize?: number;
  dryRun?: boolean;
}) {
  const olderThanMinutes = Math.max(
    5,
    Math.min(options?.olderThanMinutes ?? ABANDON_AFTER_MINUTES, 10080),
  );

  const batchSize = Math.max(
    1,
    Math.min(options?.batchSize ?? 200, 1000),
  );

  const cutoff = new Date(Date.now() - olderThanMinutes * HOUR_MS / 60);
  const carts = await CartModel.find({
    status: "ACTIVE",
    updatedAt: { $lte: cutoff },
    "items.0": { $exists: true },
  })
    .sort({ updatedAt: 1 })
    .limit(batchSize);

  if (options?.dryRun) {
    return {
      scanned: carts.length,
      created: 0,
      dryRun: true,
    };
  }

  let created = 0;

  for (const cart of carts) {
    try {
      const existing = await AbandonedCartModel.findOne({
        cartId: cart._id,
        status: "OPEN",
      }).select("_id");

      if (existing) {
        continue;
      }

      const snapshot = {
        cartId: cart._id,
        userId: cart.userId,
        status: "OPEN" as const,
        cartStatusAtCapture: cart.status,
        items: cart.toObject().items.map((item) => ({ ...item })),
        currency: cart.currency,
        itemCount: cart.itemCount,
        subtotal: cart.subtotal,
        couponCode: cart.appliedCouponCode,
        abandonedAt: new Date(),
        reminderCount: 0,
        expiresAt: new Date(Date.now() + SNAPSHOT_RETENTION_DAYS * DAY_MS),
      };

      try {
        await AbandonedCartModel.create(snapshot);
      } catch (error) {
        // The unique OPEN-cart index handles concurrent scans.
        const duplicate = await AbandonedCartModel.exists({
          cartId: cart._id,
          status: "OPEN",
        });

        if (duplicate) continue;
        throw error;
      }

      cart.status = "ABANDONED";
      await cart.save();
      created += 1;
    } catch (error) {
      logger.error(
        { error, cartId: String(cart._id) },
        "Failed to capture abandoned cart",
      );
    }
  }

  return {
    scanned: carts.length,
    created,
    dryRun: false,
  };
}

/**
 * Send initial recovery emails and due reminders.
 * SMTP errors are logged; unsent records remain eligible for retry.
 */
export async function sendDueAbandonedCartEmails(options?: {
  batchSize?: number;
  dryRun?: boolean;
}) {
  const batchSize = Math.max(1, Math.min(options?.batchSize ?? 100, 500));
  const now = Date.now();

  const records = await AbandonedCartModel.find({
    status: "OPEN",
    expiresAt: { $gt: new Date(now) },
  })
    .sort({ lastEmailAt: 1, abandonedAt: 1 })
    .limit(batchSize);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const record of records) {
    let reminderNumber: number;

    if (!record.emailSentAt) {
      reminderNumber = 0;
    } else if (
      record.reminderCount === 0 &&
      record.lastEmailAt &&
      now - record.lastEmailAt.getTime() >= FIRST_REMINDER_HOURS * HOUR_MS
    ) {
      reminderNumber = 1;
    } else if (
      record.reminderCount === 1 &&
      record.lastEmailAt &&
      now - record.lastEmailAt.getTime() >= FINAL_REMINDER_HOURS * HOUR_MS
    ) {
      reminderNumber = 2;
    } else {
      skipped += 1;
      continue;
    }

    if (record.reminderCount >= MAX_REMINDERS) {
      skipped += 1;
      continue;
    }

    const user = await User.findById(record.userId)
      .select("name email status")
      .lean();

    if (!user || user.status !== "ACTIVE" || !user.email) {
      skipped += 1;
      continue;
    }

    if (options?.dryRun) {
      sent += 1;
      continue;
    }

    // Rotate the token on each attempt/reminder. Only the hash is persisted.
    const token = randomBytes(32).toString("hex");
    record.recoveryTokenHash = hashToken(token);
    record.recoveryTokenExpiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * HOUR_MS);
    await record.save();

    const recoveryUrl = makeRecoveryUrl(token);
    const safeName = escapeHtml(user.name || "Customer");
    const isReminder = reminderNumber > 0;

    const subject =
      reminderNumber === 2
        ? "Your saved cart is waiting for you"
        : isReminder
          ? "A reminder about your NOPTRIX cart"
          : "You left items in your NOPTRIX cart";

    const text = [
      `Hello ${user.name || "Customer"},`,
      "",
      "You have items waiting in your NOPTRIX cart.",
      `Items: ${record.itemCount}`,
      `Subtotal at the time saved: ${record.currency} ${record.subtotal.toFixed(2)}`,
      "",
      "Prices and stock may have changed. Checkout will confirm the current details.",
      `Recover your cart: ${recoveryUrl}`,
      "",
      "If you have already completed your purchase, you can ignore this email.",
    ].join("\n");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;line-height:1.6">
        <h2>Hello ${safeName},</h2>
        <p>${isReminder ? "Your saved cart is still waiting for you." : "You left some items in your NOPTRIX cart."}</p>
        <p><strong>Items:</strong> ${record.itemCount}<br>
        <strong>Saved subtotal:</strong> ${escapeHtml(record.currency)} ${record.subtotal.toFixed(2)}</p>
        <p>Prices and availability may have changed. Your current total will be checked at checkout.</p>
        <p><a href="${escapeHtml(recoveryUrl)}"
          style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px">
          Recover my cart
        </a></p>
        <p>If you have already completed your purchase, you can ignore this email.</p>
      </div>
    `;

    try {
      // emailId is unique per record + reminder stage for queue-compatible tracing.
      await sendEmail({
        to: user.email,
        subject,
        text,
        html,
        headers: {
          "X-NOPTRIX-Abandoned-Cart": String(record._id),
        },
      });

      const update = await AbandonedCartModel.updateOne(
        {
          _id: record._id,
          status: "OPEN",
          reminderCount: record.reminderCount,
          lastEmailAt: record.lastEmailAt ?? null,
        },
        {
          $set: {
            emailSentAt: record.emailSentAt ?? new Date(),
            lastEmailAt: new Date(),
            recoveryTokenHash: record.recoveryTokenHash,
            recoveryTokenExpiresAt: record.recoveryTokenExpiresAt,
          },
          ...(reminderNumber > 0
            ? { $inc: { reminderCount: 1 } }
            : {}),
        },
      );

      if (update.modifiedCount === 1) {
        sent += 1;
      } else {
        skipped += 1;
      }
    } catch (error) {
      failed += 1;
      logger.error(
        { error, abandonedCartId: String(record._id) },
        "Abandoned cart email failed",
      );
    }
  }

  return { scanned: records.length, sent, skipped, failed, dryRun: !!options?.dryRun };
}

/**
 * Recover the original cart using a single-use bearer token.
 * This does not create an order or initiate payment.
 */
export async function recoverAbandonedCart(token: string) {
  if (
    typeof token !== "string" ||
    !/^[a-f0-9]{64}$/i.test(token)
  ) {
    throw ApiError.badRequest("Invalid recovery token");
  }

  const tokenHash = hashToken(token);
  const session = await mongoose.startSession();

  try {
    let recoveredCartId: Types.ObjectId | null = null;

    await session.withTransaction(async () => {
      const record = await AbandonedCartModel.findOne({
        status: "OPEN",
        recoveryTokenHash: tokenHash,
        recoveryTokenExpiresAt: { $gt: new Date() },
        expiresAt: { $gt: new Date() },
      }).session(session);

      if (!record) {
        throw ApiError.badRequest("Recovery link is invalid or expired");
      }

      const alreadyActive = await CartModel.findOne({
        userId: record.userId,
        status: "ACTIVE",
      }).session(session);

      if (alreadyActive) {
        throw ApiError.conflict(
          "An active cart already exists. Sign in and continue with your current cart.",
        );
      }

      const cart = await CartModel.findOne({
        _id: record.cartId,
        userId: record.userId,
        status: "ABANDONED",
      }).session(session);

      if (!cart) {
        throw ApiError.conflict("This cart can no longer be recovered");
      }

      cart.status = "ACTIVE";
      cart.expiresAt = new Date(Date.now() + 30 * DAY_MS);
      await cart.save({ session });

      record.status = "RECOVERED";
      record.recoveredAt = new Date();
      record.recoveryTokenHash = undefined;
      record.recoveryTokenExpiresAt = undefined;
      await record.save({ session });

      recoveredCartId = cart._id;
    });
    
    return {
      recovered: true,
      cartId: recoveredCartId ? String(recoveredCartId) : undefined,
      message: "Cart recovered. Review current prices and availability before checkout.",
    };
  } finally {
    await session.endSession();
  }
}

/**
 * Call this after the order has been successfully created from a cart.
 * Pass the cartId from the checkout/order flow.
 */
export async function markAbandonedCartConverted(cartId: string) {
  if (!isValidObjectId(cartId)) {
    throw ApiError.badRequest("Invalid cart ID");
  }

  return AbandonedCartModel.updateOne(
    { cartId: new Types.ObjectId(cartId), status: { $in: ["OPEN", "RECOVERED"] } },
    {
      $set: {
        status: "CONVERTED",
        convertedAt: new Date(),
      },
      $unset: {
        recoveryTokenHash: 1,
        recoveryTokenExpiresAt: 1,
      },
    },
  );
}

/**
 * Admin list endpoint backing service.
 */
export async function listAbandonedCarts(filters: AbandonedCartListFilters) {
  const page = Math.max(1, Math.floor(filters.page || 1));
  const limit = Math.max(1, Math.min(100, Math.floor(filters.limit || 20)));

  const query: Record<string, unknown> = {};

  if (filters.status) query.status = filters.status;

  if (filters.userId) {
    if (!isValidObjectId(filters.userId)) {
      throw ApiError.badRequest("Invalid user ID");
    }
    query.userId = new Types.ObjectId(filters.userId);
  }

  if (filters.from || filters.to) {
    const abandonedAt: Record<string, Date> = {};
    if (filters.from) abandonedAt.$gte = filters.from;
    if (filters.to) abandonedAt.$lte = filters.to;
    query.abandonedAt = abandonedAt;
  }

  const [records, total] = await Promise.all([
    AbandonedCartModel.find(query)
      .select("-recoveryTokenHash")
      .sort({ abandonedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AbandonedCartModel.countDocuments(query),
  ]);

  return {
    records,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getAbandonedCartAnalytics() {
  const [byStatus, openTotals, conversionTotals] = await Promise.all([
    AbandonedCartModel.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    AbandonedCartModel.aggregate([
      { $match: { status: "OPEN" } },
      {
        $group: {
          _id: "$currency",
          carts: { $sum: 1 },
          itemCount: { $sum: "$itemCount" },
          subtotal: { $sum: "$subtotal" },
        },
      },
    ]),
    AbandonedCartModel.aggregate([
      { $match: { status: { $in: ["CONVERTED", "RECOVERED"] } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const count = (status: string) =>
    byStatus.find((entry) => entry._id === status)?.count ?? 0;

  const total = byStatus.reduce((sum, entry) => sum + entry.count, 0);
  const converted = count("CONVERTED");

  return {
    total,
    open: count("OPEN"),
    recovered: count("RECOVERED"),
    converted,
    expired: count("EXPIRED"),
    conversionRate: total > 0 ? Number(((converted / total) * 100).toFixed(2)) : 0,
    openTotals,
    conversionTotals,
  };
}

/**
 * Expire old records and invalidate their recovery tokens.
 * This intentionally does not depend on MongoDB TTL deletion.
 */
export async function expireAbandonedCarts(batchSize = 500) {
  const now = new Date();

  const result = await AbandonedCartModel.updateMany(
    {
      status: "OPEN",
      expiresAt: { $lte: now },
    },
    {
      $set: { status: "EXPIRED" },
      $unset: {
        recoveryTokenHash: 1,
        recoveryTokenExpiresAt: 1,
      },
    },
    { limit: Math.max(1, Math.min(batchSize, 1000)) } as never,
  );

  return { expired: result.modifiedCount };
}
