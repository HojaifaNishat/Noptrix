import type { Request, Response, NextFunction, RequestHandler } from "express";
import { ApiError } from "../../../utils/ApiError";
import {
  approveAccountingRecord,
  createAccountingRecord,
  deleteAccountingRecord,
  getAccountingRecord,
  getFinancialReport,
  listAccountingRecords,
  rejectAccountingRecord,
  updateAccountingRecord,
} from "./accounting-records.service";
import type { IAccountingRecord } from "./accounting-records.model";
import {
  accountingRecordListQuerySchema,
  updateAccountingRecordSchema,
  accountingReportQuerySchema,
} from "./accounting-records.validator";

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

export const createRecordHandler = (type: IAccountingRecord["type"]) =>
  run(async (req, res) => {
    const record = await createAccountingRecord(type, req.body, actorId(req));
    res.status(201).json({ success: true, data: record });
  });

export const listRecordsHandler = (type: IAccountingRecord["type"]) =>
  run(async (req, res) => {
    const query = accountingRecordListQuerySchema.parse(req.query);
    const records = await listAccountingRecords(type, query);
    res.json({ success: true, data: records });
  });

export const getRecordHandler = run(async (req, res) => {
  const record = await getAccountingRecord(routeParam(req, "id"));
  res.json({ success: true, data: record });
});

export const updateRecordHandler = run(async (req, res) => {
  const input = updateAccountingRecordSchema.parse(req.body);
  const record = await updateAccountingRecord(routeParam(req, "id"), input);
  res.json({ success: true, data: record });
});

export const deleteRecordHandler = run(async (req, res) => {
  const result = await deleteAccountingRecord(routeParam(req, "id"));
  res.json({ success: true, data: result });
});

export const approveRecordHandler = run(async (req, res) => {
  const record = await approveAccountingRecord(
    routeParam(req, "id"),
    actorId(req),
  );
  res.json({ success: true, data: record });
});

export const rejectRecordHandler = run(async (req, res) => {
  const record = await rejectAccountingRecord(
    routeParam(req, "id"),
    actorId(req),
  );
  res.json({ success: true, data: record });
});

export const financialReportHandler = (
  type: "PROFIT_LOSS" | "BALANCE_SHEET" | "CASH_FLOW",
) =>
  run(async (req, res) => {
    const query = accountingReportQuerySchema.parse(req.query);
    const result = await getFinancialReport(type, query);
    res.json({ success: true, data: result });
  });
