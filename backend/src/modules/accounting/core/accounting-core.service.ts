import { randomUUID } from "node:crypto";
import mongoose, { Types } from "mongoose";
import { ApiError } from "../../../utils/ApiError";
import {
  ChartAccount,
  JournalEntry,
  type IJournalLine,
  type AccountType,
  type CashFlowCategory,
} from "./accounting-core.model";

const roundMoney = (value: number) => Math.round(value * 100) / 100;

export async function createChartAccount(input: {
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  parentId?: string;
  description?: string;
  isCashAccount?: boolean;
  cashFlowCategory?: CashFlowCategory;
}) {
  if (input.isCashAccount && input.cashFlowCategory) {
    throw ApiError.badRequest(
      "Cash accounts cannot have a cash flow category.",
    );
  }
  if (input.isCashAccount && input.type !== "ASSET") {
    throw ApiError.badRequest(
      "Only asset accounts can be marked as cash accounts.",
    );
  }

  if (input.parentId) {
    if (!Types.ObjectId.isValid(input.parentId)) {
      throw ApiError.badRequest("Parent account ID is invalid.");
    }
    const parent = await ChartAccount.findById(input.parentId).lean();
    if (!parent) throw ApiError.badRequest("Parent account was not found.");
    if (parent.type !== input.type) {
      throw ApiError.badRequest(
        "Parent and child accounts must use the same account type.",
      );
    }
    if (!parent.isActive) {
      throw ApiError.badRequest("Parent account must be active.");
    }
  }

  try {
    return await ChartAccount.create({
      ...input,
      parentId: input.parentId ? new Types.ObjectId(input.parentId) : undefined,
    });
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      throw ApiError.conflict("Account code already exists.");
    }
    throw error;
  }
}

export async function listChartAccounts(
  input: {
    type?: AccountType;
    isActive?: boolean;
    search?: string;
  } = {},
) {
  const filter: Record<string, unknown> = {};
  if (input.type) filter.type = input.type;
  if (input.isActive !== undefined) filter.isActive = input.isActive;
  if (input.search) {
    const escaped = input.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { code: { $regex: escaped, $options: "i" } },
      { name: { $regex: escaped, $options: "i" } },
    ];
  }
  return ChartAccount.find(filter).sort({ code: 1 }).lean();
}

export async function getChartAccount(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Account ID is invalid.");
  }
  const account = await ChartAccount.findById(id).lean();
  if (!account) throw ApiError.notFound("Account not found.");
  return account;
}

export async function updateChartAccount(
  id: string,
  input: {
    name?: string;
    description?: string;
    isActive?: boolean;
    isCashAccount?: boolean;
    cashFlowCategory?: CashFlowCategory | null;
  },
) {
  const account = await ChartAccount.findById(id);
  if (!account) throw ApiError.notFound("Account not found.");

  const nextIsCashAccount = input.isCashAccount ?? account.isCashAccount;
  const nextCashFlowCategory =
    input.cashFlowCategory === undefined
      ? account.cashFlowCategory
      : input.cashFlowCategory;
  if (nextIsCashAccount && nextCashFlowCategory) {
    throw ApiError.badRequest(
      "Cash accounts cannot have a cash flow category.",
    );
  }
  if (nextIsCashAccount && account.type !== "ASSET") {
    throw ApiError.badRequest(
      "Only asset accounts can be marked as cash accounts.",
    );
  }

  if (input.cashFlowCategory !== undefined) {
    account.cashFlowCategory = input.cashFlowCategory ?? undefined;
  }
  if (input.isCashAccount !== undefined) {
    account.isCashAccount = input.isCashAccount;
  }

  if (account.isSystem && input.isActive === false) {
    throw ApiError.conflict("System accounts cannot be deactivated.");
  }

  if (input.isActive === false) {
    const activeChildren = await ChartAccount.exists({
      parentId: account._id,
      isActive: true,
    });
    if (activeChildren) {
      throw ApiError.conflict(
        "An account with active child accounts cannot be deactivated.",
      );
    }

    const used = await JournalEntry.exists({
      status: { $in: ["POSTED", "REVERSED"] },
      "lines.accountId": account._id,
    });
    if (used) {
      throw ApiError.conflict(
        "An account used by posted entries cannot be deactivated.",
      );
    }
  }

  Object.assign(account, {
    ...input,
    cashFlowCategory: input.cashFlowCategory ?? account.cashFlowCategory,
  });
  if (input.isCashAccount === true) account.cashFlowCategory = undefined;
  await account.save();
  return account;
}

export async function createJournalDraft(
  input: {
    entryDate: Date;
    description: string;
    currency: string;
    referenceType?: string;
    referenceId?: string;
    lines: Array<{
      accountId: string;
      description?: string;
      debit: number;
      credit: number;
    }>;
  },
  actorId?: string,
) {
  const accountIds = [...new Set(input.lines.map((line) => line.accountId))];

  if (accountIds.some((id) => !Types.ObjectId.isValid(id))) {
    throw ApiError.badRequest("One or more account IDs are invalid.");
  }

  const accounts = await ChartAccount.find({
    _id: { $in: accountIds },
    isActive: true,
  }).select("_id");

  if (accounts.length !== accountIds.length) {
    throw ApiError.badRequest(
      "Every journal line must reference an active account.",
    );
  }

  for (const line of input.lines) {
    if (
      !Number.isFinite(line.debit) ||
      !Number.isFinite(line.credit) ||
      line.debit < 0 ||
      line.credit < 0 ||
      line.debit > 0 === line.credit > 0 ||
      Math.abs(line.debit * 100 - Math.round(line.debit * 100)) > 1e-7 ||
      Math.abs(line.credit * 100 - Math.round(line.credit * 100)) > 1e-7
    ) {
      throw ApiError.badRequest(
        "Each journal line must have either a valid debit or credit amount.",
      );
    }
  }

  const lines: IJournalLine[] = input.lines.map((line) => ({
    accountId: new Types.ObjectId(line.accountId),
    description: line.description,
    debit: roundMoney(line.debit),
    credit: roundMoney(line.credit),
  }));

  const totalDebit = roundMoney(
    lines.reduce((sum, line) => sum + line.debit, 0),
  );
  const totalCredit = roundMoney(
    lines.reduce((sum, line) => sum + line.credit, 0),
  );

  if (totalDebit <= 0 || Math.abs(totalDebit - totalCredit) > 0.001) {
    throw ApiError.badRequest(
      "Journal debits and credits must be equal and greater than zero.",
    );
  }

  return JournalEntry.create({
    entryNumber: `JE-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`,
    entryDate: input.entryDate,
    description: input.description,
    currency: input.currency,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    lines,
    totalDebit,
    totalCredit,
    status: "DRAFT",
    createdBy: actorId,
  });
}

export async function postJournalEntry(id: string, actorId?: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Journal entry ID is invalid.");
  }

  const session = await mongoose.startSession();
  let postedEntry: Awaited<ReturnType<typeof JournalEntry.findOneAndUpdate>> =
    null;

  try {
    await session.withTransaction(async () => {
      const draft = await JournalEntry.findOne({
        _id: id,
        status: "DRAFT",
      })
        .select("lines reversalOf")
        .session(session)
        .lean();
      if (!draft) {
        throw ApiError.conflict(
          "Journal entry was not found or is no longer a draft.",
        );
      }

      const distinctAccountIds = [
        ...new Set(draft.lines.map((line) => String(line.accountId))),
      ];
      const activeAccounts = await ChartAccount.countDocuments({
        _id: { $in: draft.lines.map((line) => line.accountId) },
        isActive: true,
      }).session(session);
      if (activeAccounts !== distinctAccountIds.length) {
        throw ApiError.conflict(
          "Journal entry contains an inactive or missing account.",
        );
      }

      postedEntry = await JournalEntry.findOneAndUpdate(
        {
          _id: id,
          status: "DRAFT",
          $expr: { $eq: ["$totalDebit", "$totalCredit"] },
        },
        {
          $set: {
            status: "POSTED",
            postedAt: new Date(),
            postedBy: actorId,
          },
        },
        { new: true, runValidators: true, session },
      );
      if (!postedEntry) {
        throw ApiError.conflict(
          "Journal entry was not found, is no longer a draft, or is unbalanced.",
        );
      }

      if (draft.reversalOf) {
        const reversed = await JournalEntry.updateOne(
          { _id: draft.reversalOf, status: "POSTED" },
          { $set: { status: "REVERSED" } },
          { session },
        );
        if (reversed.modifiedCount !== 1) {
          throw ApiError.conflict(
            "The original journal entry is no longer eligible for reversal.",
          );
        }
      }
    });

    if (!postedEntry) {
      throw ApiError.internal("Journal posting transaction returned no entry.");
    }
    return postedEntry;
  } finally {
    await session.endSession();
  }
}

export async function createJournalReversal(
  id: string,
  input: { entryDate?: Date; description?: string } = {},
  actorId?: string,
) {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Journal entry ID is invalid.");
  }

  const original = await JournalEntry.findOne({
    _id: id,
    status: { $in: ["POSTED", "REVERSED"] },
  }).lean();
  if (!original) {
    throw ApiError.conflict("Only a posted journal entry can be reversed.");
  }

  try {
    return await JournalEntry.create({
      entryNumber: `JE-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`,
      entryDate: input.entryDate ?? new Date(),
      description: input.description ?? `Reversal of ${original.entryNumber}`,
      referenceType: "JOURNAL_REVERSAL",
      referenceId: String(original._id),
      currency: original.currency,
      lines: original.lines.map((line) => ({
        accountId: line.accountId,
        description: line.description,
        debit: line.credit,
        credit: line.debit,
      })),
      totalDebit: original.totalCredit,
      totalCredit: original.totalDebit,
      status: "DRAFT",
      createdBy: actorId,
      reversalOf: original._id,
    });
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      throw ApiError.conflict(
        "A reversal draft already exists for this journal entry.",
      );
    }
    throw error;
  }
}

export async function getJournalEntry(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Journal entry ID is invalid.");
  }
  const entry = await JournalEntry.findById(id).lean();
  if (!entry) throw ApiError.notFound("Journal entry not found.");
  return entry;
}

export async function listJournalEntries(input: {
  status?: "DRAFT" | "POSTED" | "REVERSED";
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}) {
  const page = input.page ?? 1;
  const limit = input.limit ?? 25;
  if (input.from && input.to && input.from > input.to) {
    throw ApiError.badRequest("Start date must be before end date.");
  }
  const filter: Record<string, unknown> = {};

  if (input.status) filter.status = input.status;
  if (input.from || input.to) {
    filter.entryDate = {
      ...(input.from ? { $gte: input.from } : {}),
      ...(input.to ? { $lte: input.to } : {}),
    };
  }

  const [items, total] = await Promise.all([
    JournalEntry.find(filter)
      .sort({ entryDate: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    JournalEntry.countDocuments(filter),
  ]);

  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

export async function getGeneralLedger(input: {
  accountId: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}) {
  if (!Types.ObjectId.isValid(input.accountId)) {
    throw ApiError.badRequest("Account ID is invalid.");
  }

  const account = await ChartAccount.findById(input.accountId).lean();
  if (!account) throw ApiError.notFound("Account not found.");

  const page = input.page ?? 1;
  const limit = input.limit ?? 25;

  const filter: Record<string, unknown> = {
    status: { $in: ["POSTED", "REVERSED"] },
    "lines.accountId": new Types.ObjectId(input.accountId),
  };

  if (input.from || input.to) {
    filter.entryDate = {
      ...(input.from ? { $gte: input.from } : {}),
      ...(input.to ? { $lte: input.to } : {}),
    };
  }

  const [entries, total] = await Promise.all([
    JournalEntry.find(filter)
      .sort({ entryDate: 1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    JournalEntry.countDocuments(filter),
  ]);

  const accountDebitNormal = ["ASSET", "EXPENSE"].includes(account.type);
  const firstEntry = entries[0];
  const openingBoundary =
    firstEntry?.entryDate ?? input.from ?? input.to ?? new Date();
  const openingTotals = await JournalEntry.aggregate<{
    debit: number;
    credit: number;
  }>([
    {
      $match: {
        status: { $in: ["POSTED", "REVERSED"] },
        "lines.accountId": new Types.ObjectId(input.accountId),
        ...(firstEntry
          ? {
              $or: [
                { entryDate: { $lt: openingBoundary } },
                {
                  entryDate: openingBoundary,
                  _id: { $lt: firstEntry._id },
                },
              ],
            }
          : { entryDate: { $lt: openingBoundary } }),
      },
    },
    { $unwind: "$lines" },
    {
      $match: {
        "lines.accountId": new Types.ObjectId(input.accountId),
      },
    },
    {
      $group: {
        _id: null,
        debit: { $sum: "$lines.debit" },
        credit: { $sum: "$lines.credit" },
      },
    },
  ]);
  const openingMovement = roundMoney(
    (openingTotals[0]?.debit ?? 0) - (openingTotals[0]?.credit ?? 0),
  );
  const openingBalance = accountDebitNormal
    ? openingMovement
    : -openingMovement;
  let runningBalance = openingBalance;

  const items = entries.map((entry) => {
    const lines = entry.lines.filter(
      (line) => String(line.accountId) === input.accountId,
    );
    const debit = roundMoney(lines.reduce((sum, line) => sum + line.debit, 0));
    const credit = roundMoney(
      lines.reduce((sum, line) => sum + line.credit, 0),
    );
    const movement = accountDebitNormal
      ? roundMoney(debit - credit)
      : roundMoney(credit - debit);
    runningBalance = roundMoney(runningBalance + movement);

    return {
      entryId: String(entry._id),
      entryNumber: entry.entryNumber,
      entryDate: entry.entryDate,
      description: entry.description,
      currency: entry.currency,
      debit,
      credit,
      movement,
      runningBalance,
    };
  });

  return {
    account: {
      id: String(account._id),
      code: account.code,
      name: account.name,
      type: account.type,
    },
    items,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    openingBalance,
  };
}
