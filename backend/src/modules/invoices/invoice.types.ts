export type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "VOID" | "OVERDUE";

export interface InvoiceLineInput {
  description: string;
  productId?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxAmount?: number;
}

export interface CreateInvoiceInput {
  orderId?: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  currency: string;
  lines: InvoiceLineInput[];
  discountAmount?: number;
  taxAmount?: number;
  shippingAmount?: number;
  dueAt?: Date | null;
  billingAddress?: Record<string, unknown>;
  notes?: string;
}

export interface InvoiceListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: InvoiceStatus;
  customerId?: string;
}

export interface InvoiceTotals {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
}
