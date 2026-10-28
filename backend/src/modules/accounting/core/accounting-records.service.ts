import { Types } from "mongoose";
import { ApiError } from "../../../utils/ApiError";
import {
  AccountingRecord,
  type IAccountingRecord,
} from "./accounting-records.model";
import {
  ChartAccount,
  JournalEntry,
  type CashFlowCategory,
} from "./accounting-core.model";

type RecordType = IAccountingRecord["type"];
type ReportType = "PROFIT_LOSS" | "BALANCE_SHEET" | "CASH_FLOW";

const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export async function createAccountingRecord(
  type: RecordType,
  input: {
    name: string;
    description?: string;
    amount: number;
    currency: string;
    occurredAt: Date;
    category?: string;
    accountId?: string;
    reference?: string;
  },
  actorId?: string,
) {
  if (
    !Number.isFinite(input.amount) ||
    input.amount <= 0 ||
    Math.abs(input.amount * 100 - Math.round(input.amount * 100)) > 1e-7
  ) {
    throw ApiError.badRequest(
      "Amount must be positive with at most two decimal places.",
    );
  }

  if (input.accountId) {
    if (!Types.ObjectId.isValid(input.accountId)) {
      throw ApiError.badRequest("Account ID is invalid.");
    }
    const expectedAccountType = {
      EXPENSE: "EXPENSE",
      INCOME: "REVENUE",
      ASSET: "ASSET",
      LIABILITY: "LIABILITY",
    }[type];
    const account = await ChartAccount.findOne({
      _id: input.accountId,
      isActive: true,
    }).lean();
    if (!account) throw ApiError.badRequest("Active account was not found.");
    if (account.type !== expectedAccountType) {
      throw ApiError.badRequest(
        `A ${expectedAccountType.toLowerCase()} account is required for this record type.`,
      );
    }
  }

  return AccountingRecord.create({
    ...input,
    accountId: input.accountId
      ? new Types.ObjectId(input.accountId)
      : undefined,
    type,
    status: "DRAFT",
    createdBy: actorId,
  });
}

export async function getAccountingRecord(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Accounting record ID is invalid.");
  }
  const record = await AccountingRecord.findById(id).lean();
  if (!record) throw ApiError.notFound("Accounting record not found.");
  return record;
}

export async function updateAccountingRecord(
  id: string,
  input: Partial<{
    name: string;
    description: string;
    amount: number;
    currency: string;
    occurredAt: Date;
    category: string;
    accountId: string;
    reference: string;
  }>,
) {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Accounting record ID is invalid.");
  }
  if (
    input.amount !== undefined &&
    (!Number.isFinite(input.amount) ||
      input.amount <= 0 ||
      Math.abs(input.amount * 100 - Math.round(input.amount * 100)) > 1e-7)
  ) {
    throw ApiError.badRequest(
      "Amount must be positive with at most two decimal places.",
    );
  }

  const record = await AccountingRecord.findOne({
    _id: id,
    status: "DRAFT",
  });
  if (!record) {
    const existing = await AccountingRecord.exists({ _id: id });
    if (!existing) throw ApiError.notFound("Accounting record not found.");
    throw ApiError.conflict("Only draft accounting records can be updated.");
  }

  const nextAccountId = input.accountId;
  if (nextAccountId !== undefined) {
    if (!Types.ObjectId.isValid(nextAccountId)) {
      throw ApiError.badRequest("Account ID is invalid.");
    }
    const expectedType = {
      EXPENSE: "EXPENSE",
      INCOME: "REVENUE",
      ASSET: "ASSET",
      LIABILITY: "LIABILITY",
    }[record.type];
    const account = await ChartAccount.findOne({
      _id: nextAccountId,
      isActive: true,
    })
      .select("type")
      .lean();
    if (!account || account.type !== expectedType) {
      throw ApiError.badRequest(
        `An active ${expectedType.toLowerCase()} account is required for this record type.`,
      );
    }
    record.accountId = new Types.ObjectId(nextAccountId);
  }

  Object.assign(record, {
    ...input,
    ...(input.accountId === undefined ? {} : { accountId: record.accountId }),
  });
  await record.save();
  return record;
}

export async function deleteAccountingRecord(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Accounting record ID is invalid.");
  }
  const record = await AccountingRecord.findOneAndDelete({
    _id: id,
    status: "DRAFT",
  });
  if (record) return { deleted: true, id };

  const existing = await AccountingRecord.exists({ _id: id });
  if (!existing) throw ApiError.notFound("Accounting record not found.");
  throw ApiError.conflict("Only draft accounting records can be deleted.");
}

export async function listAccountingRecords(
  type: RecordType,
  input: {
    status?: "DRAFT" | "APPROVED" | "REJECTED";
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  } = {},
) {
  if (input.from && input.to && input.from > input.to) {
    throw ApiError.badRequest("Start date must be before end date.");
  }

  const page = input.page ?? 1;
  const limit = input.limit ?? 25;
  const filter: Record<string, unknown> = { type };
  if (input.status) filter.status = input.status;
  if (input.from || input.to) {
    filter.occurredAt = {
      ...(input.from ? { $gte: input.from } : {}),
      ...(input.to ? { $lte: input.to } : {}),
    };
  }

  const [items, total] = await Promise.all([
    AccountingRecord.find(filter)
      .sort({ occurredAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AccountingRecord.countDocuments(filter),
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

export async function approveAccountingRecord(id: string, actorId?: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Accounting record ID is invalid.");
  }

  const record = await AccountingRecord.findOneAndUpdate(
    { _id: id, status: "DRAFT" },
    {
      $set: {
        status: "APPROVED",
        approvedBy: actorId,
        approvedAt: new Date(),
      },
    },
    { new: true, runValidators: true },
  );
  if (!record) {
    throw ApiError.conflict("Record not found or is no longer a draft.");
  }
  return record;
}

export async function rejectAccountingRecord(id: string, actorId?: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Accounting record ID is invalid.");
  }

  const record = await AccountingRecord.findOneAndUpdate(
    { _id: id, status: "DRAFT" },
    {
      $set: {
        status: "REJECTED",
        rejectedBy: actorId,
        rejectedAt: new Date(),
      },
    },
    { new: true, runValidators: true },
  );
  if (!record) {
    throw ApiError.conflict("Record not found or is no longer a draft.");
  }
  return record;
}

export async function getFinancialReport(
  type: ReportType,
  input: {
    from?: Date;
    to?: Date;
    currency?: string;
  },
) {
  if (input.from && input.to && input.from > input.to) {
    throw ApiError.badRequest("Start date must be before end date.");
  }

  const reportTo = input.to ?? new Date();
  if (input.from && input.from > reportTo) {
    throw ApiError.badRequest(
      "Report start date cannot be after its end date.",
    );
  }
  const match: Record<string, unknown> = {
    status: { $in: ["POSTED", "REVERSED"] },
  };
  if (input.currency) match.currency = input.currency.toUpperCase();
  if (type === "BALANCE_SHEET") {
    match.entryDate = { $lte: reportTo };
  } else {
    match.entryDate = {
      ...(input.from ? { $gte: input.from } : {}),
      $lte: reportTo,
    };
  }

  if (type === "CASH_FLOW") {
    return getCashFlowReport(match, { ...input, to: reportTo });
  }

  const groupedLines = await JournalEntry.aggregate<{
    _id: { currency: string; accountId: Types.ObjectId };
    debit: number;
    credit: number;
  }>([
    { $match: match },
    { $unwind: "$lines" },
    {
      $group: {
        _id: { currency: "$currency", accountId: "$lines.accountId" },
        debit: { $sum: "$lines.debit" },
        credit: { $sum: "$lines.credit" },
      },
    },
  ]);

  const accountIds = [
    ...new Set(groupedLines.map((line) => String(line._id.accountId))),
  ];
  const accounts = await ChartAccount.find({
    _id: { $in: accountIds },
  })
    .select("_id code name type")
    .lean();
  const accountById = new Map(
    accounts.map((account) => [String(account._id), account]),
  );

  const currencyGroups = new Map<
    string,
    {
      assets: Array<{ code: string; name: string; balance: number }>;
      liabilities: Array<{ code: string; name: string; balance: number }>;
      equity: Array<{ code: string; name: string; balance: number }>;
      currentEarningsCents: number;
      revenueAccounts: Array<{ code: string; name: string; amount: number }>;
      expenseAccounts: Array<{ code: string; name: string; amount: number }>;
    }
  >();

  for (const line of groupedLines) {
    const account = accountById.get(String(line._id.accountId));
    if (!account) continue;

    const group = currencyGroups.get(line._id.currency) ?? {
      assets: [],
      liabilities: [],
      equity: [],
      currentEarningsCents: 0,
      revenueAccounts: [],
      expenseAccounts: [],
    };
    const debit = Math.round(line.debit * 100);
    const credit = Math.round(line.credit * 100);

    if (type === "PROFIT_LOSS") {
      if (account.type === "REVENUE") {
        group.revenueAccounts.push({
          code: account.code,
          name: account.name,
          amount: (credit - debit) / 100,
        });
      } else if (account.type === "EXPENSE") {
        group.expenseAccounts.push({
          code: account.code,
          name: account.name,
          amount: (debit - credit) / 100,
        });
      }
    } else {
      const balanceCents = ["ASSET", "EXPENSE"].includes(account.type)
        ? debit - credit
        : credit - debit;
      const item = {
        code: account.code,
        name: account.name,
        balance: balanceCents / 100,
      };
      if (account.type === "ASSET") group.assets.push(item);
      if (account.type === "LIABILITY") group.liabilities.push(item);
      if (account.type === "EQUITY") group.equity.push(item);
      if (account.type === "REVENUE") {
        group.currentEarningsCents += credit - debit;
      }
      if (account.type === "EXPENSE") {
        group.currentEarningsCents -= debit - credit;
      }
    }

    currencyGroups.set(line._id.currency, group);
  }

  const reports = [...currencyGroups.entries()].map(([currency, group]) => {
    if (type === "PROFIT_LOSS") {
      const revenue = round(
        group.revenueAccounts.reduce((sum, item) => sum + item.amount, 0),
      );
      const expenses = round(
        group.expenseAccounts.reduce((sum, item) => sum + item.amount, 0),
      );
      return {
        currency,
        period: { from: input.from, to: reportTo },
        revenue,
        expenses,
        netProfit: round(revenue - expenses),
        revenueAccounts: group.revenueAccounts,
        expenseAccounts: group.expenseAccounts,
      };
    }

    if (group.currentEarningsCents !== 0) {
      group.equity.push({
        code: "CURRENT_EARNINGS",
        name: "Current earnings",
        balance: group.currentEarningsCents / 100,
      });
    }
    const assets = round(
      group.assets.reduce((sum, item) => sum + item.balance, 0),
    );
    const liabilities = round(
      group.liabilities.reduce((sum, item) => sum + item.balance, 0),
    );
    const equity = round(
      group.equity.reduce((sum, item) => sum + item.balance, 0),
    );
    return {
      currency,
      asOf: reportTo,
      assets,
      liabilities,
      equity,
      balanceCheck: round(assets - liabilities - equity),
      accounts: {
        assets: group.assets,
        liabilities: group.liabilities,
        equity: group.equity,
      },
    };
  });

  return {
    report: type,
    period:
      type === "BALANCE_SHEET"
        ? { asOf: reportTo }
        : { from: input.from, to: reportTo },
    reports,
    note: "Results are grouped by currency; balances from different currencies are never combined.",
  };
}

async function getCashFlowReport(
  match: Record<string, unknown>,
  input: { from?: Date; to?: Date; currency?: string },
) {
  const categories = ["OPERATING", "INVESTING", "FINANCING"] as const;
  const entries = await JournalEntry.aggregate<{
    _id: { entryId: Types.ObjectId; currency: string };
    cashMovement: number;
    classifiedLines: Array<{
      category: CashFlowCategory;
      amount: number;
    } | null>;
  }>([
    { $match: match },
    { $unwind: "$lines" },
    {
      $lookup: {
        from: ChartAccount.collection.name,
        localField: "lines.accountId",
        foreignField: "_id",
        as: "account",
      },
    },
    { $unwind: "$account" },
    {
      $group: {
        _id: { entryId: "$_id", currency: "$currency" },
        cashMovement: {
          $sum: {
            $cond: [
              "$account.isCashAccount",
              { $subtract: ["$lines.debit", "$lines.credit"] },
              0,
            ],
          },
        },
        classifiedLines: {
          $push: {
            $cond: [
              {
                $and: [
                  { $eq: ["$account.isCashAccount", false] },
                  { $in: ["$account.cashFlowCategory", categories] },
                ],
              },
              {
                category: "$account.cashFlowCategory",
                amount: { $subtract: ["$lines.credit", "$lines.debit"] },
              },
              null,
            ],
          },
        },
      },
    },
    { $match: { cashMovement: { $ne: 0 } } },
  ]);

  const byCurrency = new Map<string, Record<string, number>>();
  for (const entry of entries) {
    const totals = byCurrency.get(entry._id.currency) ?? {
      OPERATING: 0,
      INVESTING: 0,
      FINANCING: 0,
      UNCLASSIFIED: 0,
    };
    let classifiedTotal = 0;
    for (const line of entry.classifiedLines) {
      if (!line) continue;
      const amountCents = Math.round(line.amount * 100);
      totals[line.category] = (totals[line.category] ?? 0) + amountCents;
      classifiedTotal += amountCents;
    }
    totals.UNCLASSIFIED +=
      Math.round(entry.cashMovement * 100) - classifiedTotal;
    byCurrency.set(entry._id.currency, totals);
  }

  const reports = [...byCurrency.entries()].map(([currency, totals]) => ({
    currency,
    period: { from: input.from, to: input.to },
    operating: round((totals.OPERATING ?? 0) / 100),
    investing: round((totals.INVESTING ?? 0) / 100),
    financing: round((totals.FINANCING ?? 0) / 100),
    unclassified: round((totals.UNCLASSIFIED ?? 0) / 100),
    netCashChange: round(
      Object.values(totals).reduce((sum, value) => sum + value, 0) / 100,
    ),
  }));

  return {
    report: "CASH_FLOW",
    period: { from: input.from, to: input.to },
    reports,
    note: "Cash flow classification uses cash accounts and the configured category on each non-cash chart account. Unclassified movements are reported separately.",
  };
}
