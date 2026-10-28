import type { Request, Response, NextFunction, RequestHandler } from "express";
import { ApiError } from "../../../utils/ApiError";
import { createJournalReversal } from "./accounting-core.service";
import {
  createChartAccount,
  getChartAccount,
  listChartAccounts,
  updateChartAccount,
  createJournalDraft,
  postJournalEntry,
  getJournalEntry,
  listJournalEntries,
  getGeneralLedger,
} from "./accounting-core.service";
import {
  listAccountsQuerySchema,
  listJournalQuerySchema,
  listLedgerQuerySchema,
  reverseJournalSchema,
} from "./accounting-core.validator";

function actorId(req: Request): string | undefined {
  return req.ownerAuth?.ownerId ?? req.adminAuth?.adminId;
}

function routeParam(req: Request, key: string): string {
  const value = req.params[key];
  if (typeof value !== "string") {
    throw ApiError.badRequest(`Invalid route parameter: ${key}`);
  }
  return value;
}

function run(
  handler: (req: Request, res: Response) => Promise<unknown>,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res).catch(next);
  };
}

export const createAccountHandler = run(async (req, res) => {
  const account = await createChartAccount(req.body);
  res.status(201).json({ success: true, data: account });
});

export const filteredAccountsHandler = run(async (req, res) => {
  const query = listAccountsQuerySchema.parse(req.query);
  const accounts = await listChartAccounts({
    type: query.type,
    isActive:
      query.isActive === undefined ? undefined : query.isActive === "true",
    search: query.search,
  });
  res.json({ success: true, data: accounts });
});

export const getAccountHandler = run(async (req, res) => {
  const account = await getChartAccount(routeParam(req, "id"));
  res.json({ success: true, data: account });
});

export const updateAccountHandler = run(async (req, res) => {
  const account = await updateChartAccount(routeParam(req, "id"), req.body);
  res.json({ success: true, data: account });
});

export const createJournalHandler = run(async (req, res) => {
  const entry = await createJournalDraft(req.body, actorId(req));
  res.status(201).json({ success: true, data: entry });
});

export const listJournalHandler = run(async (req, res) => {
  const query = listJournalQuerySchema.parse(req.query);
  const result = await listJournalEntries({
    ...query,
  });
  res.json({ success: true, data: result });
});

export const getJournalHandler = run(async (req, res) => {
  const entry = await getJournalEntry(routeParam(req, "id"));
  res.json({ success: true, data: entry });
});

export const postJournalHandler = run(async (req, res) => {
  const entry = await postJournalEntry(routeParam(req, "id"), actorId(req));
  res.json({ success: true, data: entry });
});

export const reverseJournalHandler = run(async (req, res) => {
  const input = reverseJournalSchema.parse(req.body);
  const entry = await createJournalReversal(
    routeParam(req, "id"),
    input,
    actorId(req),
  );
  res.status(201).json({ success: true, data: entry });
});

export const ledgerHandler = run(async (req, res) => {
  const query = listLedgerQuerySchema.parse(req.query);
  const result = await getGeneralLedger({
    ...query,
  });
  res.json({ success: true, data: result });
});
