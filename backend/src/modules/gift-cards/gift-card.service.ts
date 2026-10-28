import { randomBytes } from "node:crypto";
import { Types, type ClientSession } from "mongoose";
import GiftCardModel from "./gift-card.model";
import type { CreateGiftCardInput, GiftCardListQuery } from "./gift-card.types";
import { ApiError } from "../../utils/ApiError";

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function generateGiftCardCode() {
  return `NOP-${randomBytes(12).toString("hex").toUpperCase()}`;
}

function isExpired(expiresAt?: Date | null) {
  return Boolean(expiresAt && expiresAt.getTime() <= Date.now());
}

export async function createGiftCard(
  input: CreateGiftCardInput,
  actorId?: string,
) {
  if (input.expiresAt && input.expiresAt.getTime() <= Date.now()) {
    throw ApiError.badRequest("Gift card expiry must be in the future");
  }

  // A collision is extraordinarily unlikely; still retry duplicate-key collisions.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const [giftCard] = await GiftCardModel.create([
        {
          code: generateGiftCardCode(),
          initialBalance: input.initialBalance,
          balance: input.initialBalance,
          currency: (input.currency ?? "BDT").toUpperCase(),
          expiresAt: input.expiresAt ?? null,
          recipientEmail: input.recipientEmail,
          recipientName: input.recipientName,
          note: input.note,
          status: "ACTIVE",
          createdBy: actorId ? new Types.ObjectId(actorId) : undefined,
          updatedBy: actorId ? new Types.ObjectId(actorId) : undefined,
        },
      ]);

      // Return the generated code only at issuance time.
      return giftCard;
    } catch (error: unknown) {
      const duplicateKey =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000;

      if (!duplicateKey || attempt === 2) throw error;
    }
  }

  throw ApiError.internal("Could not generate a unique gift card code");
}

export async function getGiftCardById(giftCardId: string) {
  if (!Types.ObjectId.isValid(giftCardId)) {
    throw ApiError.badRequest("Invalid gift card ID");
  }

  const card = await GiftCardModel.findById(giftCardId);

  if (!card) throw ApiError.notFound("Gift card not found");

  return card;
}

export async function listGiftCards(query: GiftCardListQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const filter: Record<string, unknown> = {};

  if (query.status) filter.status = query.status;

  if (query.search) {
    const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { code: { $regex: escaped, $options: "i" } },
      { recipientEmail: { $regex: escaped, $options: "i" } },
      { recipientName: { $regex: escaped, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    GiftCardModel.find(filter)
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    GiftCardModel.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Customer balance preview. Do not expose recipient details or the full record.
 */
export async function getGiftCardBalance(code: string) {
  const card = await GiftCardModel.findOne({
    code: normalizeCode(code),
  }).select("code balance currency status expiresAt");

  if (!card) throw ApiError.notFound("Gift card not found");

  if (
    card.status !== "ACTIVE" ||
    card.balance <= 0 ||
    isExpired(card.expiresAt)
  ) {
    throw ApiError.badRequest("Gift card is not available");
  }

  return {
    code: card.code,
    balance: card.balance,
    currency: card.currency,
    expiresAt: card.expiresAt ?? null,
  };
}

export async function setGiftCardStatus(
  giftCardId: string,
  status: "ACTIVE" | "INACTIVE",
  actorId?: string,
) {
  const card = await getGiftCardById(giftCardId);

  if (status === "ACTIVE" && card.balance <= 0) {
    throw ApiError.badRequest("A depleted gift card cannot be reactivated");
  }

  if (status === "ACTIVE" && isExpired(card.expiresAt)) {
    throw ApiError.badRequest("An expired gift card cannot be reactivated");
  }

  card.status = status;
  if (actorId) card.updatedBy = new Types.ObjectId(actorId);

  await card.save();
  return card;
}

/**
 * Atomically deducts balance. Call this only within the same database
 * transaction that creates/updates the order. Pass the transaction session.
 * This function intentionally does not create an order or payment by itself.
 */
export async function redeemGiftCardBalance(
  input: { code: string; amount: number; currency: string },
  session: ClientSession,
) {
  const code = normalizeCode(input.code);
  const currency = input.currency.trim().toUpperCase();

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw ApiError.badRequest("Gift card redemption amount must be positive");
  }

  const now = new Date();

  const card = await GiftCardModel.findOneAndUpdate(
    {
      code,
      status: "ACTIVE",
      currency,
      balance: { $gte: input.amount },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    },
    { $inc: { balance: -input.amount } },
    { new: true, session, runValidators: true },
  );

  if (!card) {
    throw ApiError.badRequest(
      "Gift card is invalid, expired, wrong currency, or has insufficient balance",
    );
  }

  if (card.balance === 0) {
    await GiftCardModel.updateOne(
      { _id: card._id, balance: 0 },
      { $set: { status: "DEPLETED" } },
      { session },
    );
  }

  return {
    giftCardId: String(card._id),
    code: card.code,
    redeemedAmount: input.amount,
    remainingBalance: card.balance,
    currency: card.currency,
  };
}
