import { describe, expect, it } from "vitest";
import {
  createAccountSchema,
  createJournalSchema,
} from "../../src/modules/accounting/core/accounting-core.validator";
import {
  accountingRecordSchema,
  accountingReportQuerySchema,
} from "../../src/modules/accounting/core/accounting-records.validator";

describe("accounting validators", () => {
  it("requires a journal line to be either debit or credit, not both", () => {
    const journal = {
      entryDate: "2026-10-28T00:00:00.000Z",
      description: "Opening entry",
      currency: "bdt",
      lines: [
        {
          accountId: "507f1f77bcf86cd799439011",
          debit: 100,
          credit: 10,
        },
        {
          accountId: "507f1f77bcf86cd799439012",
          debit: 0,
          credit: 100,
        },
      ],
    };

    expect(createJournalSchema.safeParse(journal).success).toBe(false);
    expect(
      createJournalSchema.safeParse({
        ...journal,
        lines: [{ ...journal.lines[0], credit: 0 }, journal.lines[1]],
      }).success,
    ).toBe(true);
  });

  it("prevents cash accounts from being assigned a cash flow category", () => {
    const account = {
      code: "1010",
      name: "Bank",
      type: "ASSET",
      isCashAccount: true,
      cashFlowCategory: "OPERATING",
    };

    expect(createAccountSchema.safeParse(account).success).toBe(false);
    expect(
      createAccountSchema.safeParse({
        ...account,
        cashFlowCategory: undefined,
      }).success,
    ).toBe(true);
  });

  it("requires record amounts and normalizes report currency", () => {
    const record = {
      name: "Office rent",
      amount: 125.5,
      currency: "bdt",
      occurredAt: "2026-10-01",
    };

    expect(accountingRecordSchema.safeParse(record).success).toBe(true);
    expect(
      accountingRecordSchema.safeParse({
        ...record,
        amount: undefined,
      }).success,
    ).toBe(false);
    expect(
      accountingReportQuerySchema.parse({ currency: "bdt" }).currency,
    ).toBe("BDT");
  });
});
