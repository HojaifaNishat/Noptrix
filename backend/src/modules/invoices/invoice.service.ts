import { Types } from "mongoose";
import InvoiceModel from "./invoice.model";
import type {
  CreateInvoiceInput,
  InvoiceListQuery,
  InvoiceTotals,
} from "./invoice.types";
import { ApiError } from "../../utils/ApiError";

function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateTotals(input: CreateInvoiceInput): {
  lines: InvoiceTotals extends never
    ? never
    : Array<{
        description: string;
        productId?: Types.ObjectId;
        sku?: string;
        quantity: number;
        unitPrice: number;
        discountAmount: number;
        taxAmount: number;
        lineTotal: number;
      }>;
  totals: InvoiceTotals;
} {
  let subtotal = 0;
  let lineDiscounts = 0;
  let lineTaxes = 0;

  const lines = input.lines.map((line) => {
    const base = money(line.quantity * line.unitPrice);
    const discount = money(line.discountAmount ?? 0);
    const tax = money(line.taxAmount ?? 0);

    if (discount > base) {
      throw ApiError.badRequest("Line discount cannot exceed line subtotal");
    }

    if (discount + tax > base) {
      throw ApiError.badRequest("Line discount and tax exceed line subtotal");
    }

    const lineTotal = money(base - discount + tax);

    subtotal += base;
    lineDiscounts += discount;
    lineTaxes += tax;

    return {
      description: line.description,
      productId: line.productId
        ? new Types.ObjectId(line.productId)
        : undefined,
      sku: line.sku,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discountAmount: discount,
      taxAmount: tax,
      lineTotal,
    };
  });

  const discountAmount = money(input.discountAmount ?? lineDiscounts);
  const taxAmount = money(input.taxAmount ?? lineTaxes);
  const shippingAmount = money(input.shippingAmount ?? 0);

  if (discountAmount > subtotal) {
    throw ApiError.badRequest("Invoice discount cannot exceed subtotal");
  }

  const total = money(subtotal - discountAmount + taxAmount + shippingAmount);

  if (total < 0) {
    throw ApiError.badRequest("Invoice total cannot be negative");
  }

  return {
    lines,
    totals: {
      subtotal: money(subtotal),
      discountAmount,
      taxAmount,
      shippingAmount,
      total,
    },
  };
}

function generateInvoiceNumber() {
  const date = new Date();
  const ymd = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("");

  // Unique index is the final protection against collisions.
  return `INV-${ymd}-${new Types.ObjectId().toHexString().toUpperCase()}`;
}

export async function createInvoice(
  input: CreateInvoiceInput,
  actorId?: string,
) {
  if (input.dueAt && input.dueAt.getTime() <= Date.now()) {
    throw ApiError.badRequest("Invoice due date must be in the future");
  }

  const { lines, totals } = calculateTotals(input);

  return InvoiceModel.create({
    invoiceNumber: generateInvoiceNumber(),
    orderId: input.orderId ? new Types.ObjectId(input.orderId) : undefined,
    customerId: new Types.ObjectId(input.customerId),
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    currency: input.currency.toUpperCase(),
    lines,
    totals,
    status: "DRAFT",
    dueAt: input.dueAt ?? null,
    billingAddress: input.billingAddress,
    notes: input.notes,
    createdBy: actorId ? new Types.ObjectId(actorId) : undefined,
  });
}

export async function getInvoiceById(invoiceId: string) {
  if (!Types.ObjectId.isValid(invoiceId)) {
    throw ApiError.badRequest("Invalid invoice ID");
  }

  const invoice = await InvoiceModel.findById(invoiceId);

  if (!invoice) throw ApiError.notFound("Invoice not found");

  return invoice;
}

export async function listInvoices(query: InvoiceListQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const filter: Record<string, unknown> = {};

  if (query.status) filter.status = query.status;

  if (query.customerId) {
    filter.customerId = new Types.ObjectId(query.customerId);
  }

  if (query.search) {
    const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { invoiceNumber: { $regex: escaped, $options: "i" } },
      { customerName: { $regex: escaped, $options: "i" } },
      { customerEmail: { $regex: escaped, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    InvoiceModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    InvoiceModel.countDocuments(filter),
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

export async function updateInvoiceStatus(
  invoiceId: string,
  status: "ISSUED" | "VOID",
) {
  const invoice = await getInvoiceById(invoiceId);

  if (invoice.status === "PAID" || invoice.status === "VOID") {
    throw ApiError.conflict("Paid or void invoices cannot change status");
  }

  if (status === "ISSUED") {
    if (invoice.status !== "DRAFT") {
      throw ApiError.conflict("Only draft invoices can be issued");
    }

    invoice.status = "ISSUED";
    invoice.issuedAt = new Date();
  } else {
    if (invoice.status !== "DRAFT" && invoice.status !== "ISSUED") {
      throw ApiError.conflict("This invoice cannot be voided");
    }

    invoice.status = "VOID";
    invoice.voidedAt = new Date();
  }

  await invoice.save();
  return invoice;
}

/**
 * Call only after a trusted payment gateway/webhook verifies full payment.
 * For production, call inside the payment/order transaction.
 */
export async function markInvoicePaid(invoiceId: string) {
  const invoice = await getInvoiceById(invoiceId);

  if (invoice.status === "PAID") return invoice;

  if (invoice.status !== "ISSUED" && invoice.status !== "OVERDUE") {
    throw ApiError.conflict("Only issued invoices can be marked paid");
  }

  invoice.status = "PAID";
  invoice.paidAt = new Date();

  await invoice.save();
  return invoice;
}

export async function refreshOverdueInvoices() {
  const now = new Date();

  const result = await InvoiceModel.updateMany(
    {
      status: "ISSUED",
      dueAt: { $lt: now },
    },
    { $set: { status: "OVERDUE" } },
  );

  return { modifiedCount: result.modifiedCount };
}
