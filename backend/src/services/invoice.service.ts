import crypto from "node:crypto";

import {
    ApiError,
} from "../utils/ApiError";

import {
    logger,
} from "../utils/logger";


/*
|--------------------------------------------------------------------------
| Invoice Service
|--------------------------------------------------------------------------
|
| Responsibility:
|
| - Invoice domain calculations
| - Invoice number generation
| - Line-item normalization
| - Tax / discount / delivery calculations
| - Invoice lifecycle validation
| - Refund / credit-note foundation
| - Provider-independent invoice contracts
|
| Database persistence belongs to:
|
| modules/invoices/
|
| PDF generation belongs to:
|
| pdf.service.ts
|
| Email delivery belongs to:
|
| email.service.ts
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

export const INVOICE_STATUSES = {
    DRAFT: "draft",
    ISSUED: "issued",
    PAID: "paid",
    PARTIALLY_PAID: "partially_paid",
    OVERDUE: "overdue",
    CANCELLED: "cancelled",
    REFUNDED: "refunded",
    PARTIALLY_REFUNDED: "partially_refunded",
} as const;

export type InvoiceStatus =
    (typeof INVOICE_STATUSES)[keyof typeof INVOICE_STATUSES];


export const INVOICE_PAYMENT_STATUSES = {
    UNPAID: "unpaid",
    PARTIALLY_PAID: "partially_paid",
    PAID: "paid",
    REFUNDED: "refunded",
    PARTIALLY_REFUNDED: "partially_refunded",
} as const;

export type InvoicePaymentStatus =
    (typeof INVOICE_PAYMENT_STATUSES)[keyof typeof INVOICE_PAYMENT_STATUSES];


export const INVOICE_DOCUMENT_TYPES = {
    INVOICE: "invoice",
    CREDIT_NOTE: "credit_note",
} as const;

export type InvoiceDocumentType =
    (typeof INVOICE_DOCUMENT_TYPES)[keyof typeof INVOICE_DOCUMENT_TYPES];


/*
|--------------------------------------------------------------------------
| Money
|--------------------------------------------------------------------------
|
| Money is represented as integer minor units internally whenever
| calculations are performed.
|
| Example:
|
| 100.50 BDT → 10050 minor units
|
|--------------------------------------------------------------------------
*/

export interface InvoiceMoney {
    readonly amount: number;
    readonly currency: string;
}


/*
|--------------------------------------------------------------------------
| Customer Snapshot
|--------------------------------------------------------------------------
|
| Invoice stores a snapshot of customer information so historical
| invoices remain correct even if the customer changes their profile.
|
|--------------------------------------------------------------------------
*/

export interface InvoiceCustomer {
    readonly customerId?: string;
    readonly name: string;
    readonly email?: string;
    readonly phone?: string;
    readonly address?: string;
    readonly city?: string;
    readonly state?: string;
    readonly postalCode?: string;
    readonly country?: string;
}


/*
|--------------------------------------------------------------------------
| Seller Snapshot
|--------------------------------------------------------------------------
*/

export interface InvoiceSeller {
    readonly name: string;
    readonly email?: string;
    readonly phone?: string;
    readonly address?: string;
    readonly city?: string;
    readonly state?: string;
    readonly postalCode?: string;
    readonly country?: string;
    readonly taxId?: string;
    readonly registrationNumber?: string;
}


/*
|--------------------------------------------------------------------------
| Invoice Line Item
|--------------------------------------------------------------------------
*/

export interface InvoiceLineItem {
    readonly productId?: string;
    readonly variantId?: string;
    readonly sku?: string;
    readonly name: string;
    readonly quantity: number;
    readonly unitPrice: number;
    readonly discount?: number;
    readonly taxRate?: number;
    readonly metadata?: Readonly<
        Record<
            string,
            string | number | boolean | null
        >
    >;
}


/*
|--------------------------------------------------------------------------
| Normalized Line Item
|--------------------------------------------------------------------------
*/

export interface NormalizedInvoiceLineItem {
    readonly productId?: string;
    readonly variantId?: string;
    readonly sku?: string;
    readonly name: string;
    readonly quantity: number;
    readonly unitPrice: number;
    readonly subtotal: number;
    readonly discount: number;
    readonly taxableAmount: number;
    readonly taxRate: number;
    readonly taxAmount: number;
    readonly total: number;
    readonly metadata?: Readonly<
        Record<
            string,
            string | number | boolean | null
        >
    >;
}


/*
|--------------------------------------------------------------------------
| Invoice Totals
|--------------------------------------------------------------------------
*/

export interface InvoiceTotals {
    readonly subtotal: number;
    readonly itemDiscount: number;
    readonly orderDiscount: number;
    readonly deliveryFee: number;
    readonly tax: number;
    readonly total: number;
    readonly paidAmount: number;
    readonly dueAmount: number;
}


/*
|--------------------------------------------------------------------------
| Create Invoice Input
|--------------------------------------------------------------------------
*/

export interface CreateInvoiceInput {
    readonly orderId: string;
    readonly customer: InvoiceCustomer;
    readonly seller?: InvoiceSeller;
    readonly items: readonly InvoiceLineItem[];
    readonly currency: string;
    readonly orderDiscount?: number;
    readonly deliveryFee?: number;
    readonly paidAmount?: number;
    readonly notes?: string;
    readonly metadata?: Readonly<
        Record<
            string,
            string | number | boolean | null
        >
    >;
}


/*
|--------------------------------------------------------------------------
| Invoice
|--------------------------------------------------------------------------
*/

export interface Invoice {
    readonly invoiceId: string;
    readonly invoiceNumber: string;
    readonly documentType: InvoiceDocumentType;
    readonly orderId: string;
    readonly customer: InvoiceCustomer;
    readonly seller?: InvoiceSeller;
    readonly items: readonly NormalizedInvoiceLineItem[];
    readonly totals: InvoiceTotals;
    readonly currency: string;
    readonly status: InvoiceStatus;
    readonly paymentStatus: InvoicePaymentStatus;
    readonly issuedAt?: Date;
    readonly dueAt?: Date;
    readonly cancelledAt?: Date;
    readonly refundedAt?: Date;
    readonly notes?: string;
    readonly metadata?: Readonly<
        Record<
            string,
            string | number | boolean | null
        >
    >;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}


/*
|--------------------------------------------------------------------------
| Credit Note
|--------------------------------------------------------------------------
*/

export interface CreditNote {
    readonly creditNoteId: string;
    readonly creditNoteNumber: string;
    readonly invoiceId: string;
    readonly orderId: string;
    readonly amount: number;
    readonly currency: string;
    readonly reason?: string;
    readonly createdAt: Date;
}


/*
|--------------------------------------------------------------------------
| Decimal / Money Helpers
|--------------------------------------------------------------------------
*/

const roundMoney = (
    amount: number
): number => {
    if (
        !Number.isFinite(amount)
    ) {
        return 0;
    }

    return Math.round(
        (
            amount +
            Number.EPSILON
        ) * 100
    ) / 100;
};


const toMinorUnits = (
    amount: number
): number => {
    return Math.round(
        (
            amount +
            Number.EPSILON
        ) * 100
    );
};


const fromMinorUnits = (
    amount: number
): number => {
    return amount / 100;
};


/*
|--------------------------------------------------------------------------
| Validation Helpers
|--------------------------------------------------------------------------
*/

const normalizeString = (
    value: string
): string => {
    return value.trim();
};


const validateRequiredString = (
    value: string,
    fieldName: string
): string => {
    const normalized =
        normalizeString(value);

    if (!normalized) {
        throw ApiError.badRequest(
            `${fieldName} is required.`,
            {
                code:
                    "INVOICE_REQUIRED_FIELD",
                details: {
                    field:
                        fieldName,
                },
            }
        );
    }

    return normalized;
};


const validateCurrency = (
    currency: string
): string => {
    const normalized =
        normalizeString(
            currency
        ).toUpperCase();

    if (
        !/^[A-Z]{3}$/.test(
            normalized
        )
    ) {
        throw ApiError.badRequest(
            "Invoice currency must be a valid ISO 4217 currency code.",
            {
                code:
                    "INVALID_INVOICE_CURRENCY",
            }
        );
    }

    return normalized;
};


const validatePositiveAmount = (
    amount: number,
    fieldName: string
): number => {
    if (
        typeof amount !== "number" ||
        !Number.isFinite(amount)
    ) {
        throw ApiError.badRequest(
            `${fieldName} must be a valid number.`,
            {
                code:
                    "INVALID_INVOICE_AMOUNT",
            }
        );
    }

    if (amount < 0) {
        throw ApiError.badRequest(
            `${fieldName} cannot be negative.`,
            {
                code:
                    "NEGATIVE_INVOICE_AMOUNT",
            }
        );
    }

    return roundMoney(amount);
};


const validateQuantity = (
    quantity: number
): number => {
    if (
        typeof quantity !== "number" ||
        !Number.isFinite(quantity)
    ) {
        throw ApiError.badRequest(
            "Invoice item quantity must be a valid number.",
            {
                code:
                    "INVALID_INVOICE_QUANTITY",
            }
        );
    }

    if (
        quantity <= 0
    ) {
        throw ApiError.badRequest(
            "Invoice item quantity must be greater than zero.",
            {
                code:
                    "INVALID_INVOICE_QUANTITY",
            }
        );
    }

    if (
        quantity > 1_000_000
    ) {
        throw ApiError.badRequest(
            "Invoice item quantity is too large.",
            {
                code:
                    "INVOICE_QUANTITY_TOO_LARGE",
            }
        );
    }

    return quantity;
};


const validateTaxRate = (
    taxRate = 0
): number => {
    if (
        typeof taxRate !== "number" ||
        !Number.isFinite(taxRate)
    ) {
        throw ApiError.badRequest(
            "Invoice tax rate must be a valid number.",
            {
                code:
                    "INVALID_INVOICE_TAX_RATE",
            }
        );
    }

    if (
        taxRate < 0 ||
        taxRate > 100
    ) {
        throw ApiError.badRequest(
            "Invoice tax rate must be between 0 and 100.",
            {
                code:
                    "INVALID_INVOICE_TAX_RATE",
            }
        );
    }

    return roundMoney(
        taxRate
    );
};


/*
|--------------------------------------------------------------------------
| Line Item Normalization
|--------------------------------------------------------------------------
*/

export const normalizeInvoiceLineItem = (
    item: InvoiceLineItem
): NormalizedInvoiceLineItem => {
    if (!item) {
        throw ApiError.badRequest(
            "Invoice line item is required.",
            {
                code:
                    "INVOICE_ITEM_REQUIRED",
            }
        );
    }

    const name =
        validateRequiredString(
            item.name,
            "Product name"
        );

    const quantity =
        validateQuantity(
            item.quantity
        );

    const unitPrice =
        validatePositiveAmount(
            item.unitPrice,
            "Unit price"
        );

    const discount =
        validatePositiveAmount(
            item.discount ?? 0,
            "Item discount"
        );

    const taxRate =
        validateTaxRate(
            item.taxRate ?? 0
        );

    const subtotalMinor =
        toMinorUnits(
            unitPrice *
            quantity
        );

    const discountMinor =
        Math.min(
            toMinorUnits(
                discount
            ),
            subtotalMinor
        );

    const taxableMinor =
        Math.max(
            0,
            subtotalMinor -
                discountMinor
        );

    const taxMinor =
        Math.round(
            taxableMinor *
            (taxRate / 100)
        );

    const totalMinor =
        taxableMinor +
        taxMinor;

    return {
        productId:
            item.productId,

        variantId:
            item.variantId,

        sku:
            item.sku,

        name,

        quantity,

        unitPrice,

        subtotal:
            fromMinorUnits(
                subtotalMinor
            ),

        discount:
            fromMinorUnits(
                discountMinor
            ),

        taxableAmount:
            fromMinorUnits(
                taxableMinor
            ),

        taxRate,

        taxAmount:
            fromMinorUnits(
                taxMinor
            ),

        total:
            fromMinorUnits(
                totalMinor
            ),

        metadata:
            item.metadata,
    };
};


/*
|--------------------------------------------------------------------------
| Normalize Invoice Items
|--------------------------------------------------------------------------
*/

export const normalizeInvoiceItems = (
    items: readonly InvoiceLineItem[]
): readonly NormalizedInvoiceLineItem[] => {
    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {
        throw ApiError.badRequest(
            "At least one invoice item is required.",
            {
                code:
                    "INVOICE_ITEMS_REQUIRED",
            }
        );
    }

    if (
        items.length > 500
    ) {
        throw ApiError.badRequest(
            "An invoice cannot contain more than 500 line items.",
            {
                code:
                    "INVOICE_ITEM_LIMIT_EXCEEDED",
            }
        );
    }

    return items.map(
        normalizeInvoiceLineItem
    );
};


/*
|--------------------------------------------------------------------------
| Calculate Invoice Totals
|--------------------------------------------------------------------------
*/

export const calculateInvoiceTotals = (
    items: readonly NormalizedInvoiceLineItem[],
    orderDiscount = 0,
    deliveryFee = 0,
    paidAmount = 0
): InvoiceTotals => {
    const subtotalMinor =
        items.reduce(
            (
                total,
                item
            ) =>
                total +
                toMinorUnits(
                    item.subtotal
                ),
            0
        );

    const itemDiscountMinor =
        items.reduce(
            (
                total,
                item
            ) =>
                total +
                toMinorUnits(
                    item.discount
                ),
            0
        );

    const orderDiscountValue =
        validatePositiveAmount(
            orderDiscount,
            "Order discount"
        );

    const deliveryFeeValue =
        validatePositiveAmount(
            deliveryFee,
            "Delivery fee"
        );

    const subtotalAfterItemDiscountMinor =
        Math.max(
            0,
            subtotalMinor -
                itemDiscountMinor
        );

    const orderDiscountMinor =
        Math.min(
            toMinorUnits(
                orderDiscountValue
            ),
            subtotalAfterItemDiscountMinor
        );

    const taxMinor =
        items.reduce(
            (
                total,
                item
            ) =>
                total +
                toMinorUnits(
                    item.taxAmount
                ),
            0
        );

    const deliveryMinor =
        toMinorUnits(
            deliveryFeeValue
        );

    const totalMinor =
        Math.max(
            0,
            subtotalAfterItemDiscountMinor -
                orderDiscountMinor +
                taxMinor +
                deliveryMinor
        );

    const paidAmountValue =
        validatePositiveAmount(
            paidAmount,
            "Paid amount"
        );

    const paidMinor =
        Math.min(
            toMinorUnits(
                paidAmountValue
            ),
            totalMinor
        );

    const dueMinor =
        Math.max(
            0,
            totalMinor -
                paidMinor
        );

    return {
        subtotal:
            fromMinorUnits(
                subtotalMinor
            ),

        itemDiscount:
            fromMinorUnits(
                itemDiscountMinor
            ),

        orderDiscount:
            fromMinorUnits(
                orderDiscountMinor
            ),

        deliveryFee:
            fromMinorUnits(
                deliveryMinor
            ),

        tax:
            fromMinorUnits(
                taxMinor
            ),

        total:
            fromMinorUnits(
                totalMinor
            ),

        paidAmount:
            fromMinorUnits(
                paidMinor
            ),

        dueAmount:
            fromMinorUnits(
                dueMinor
            ),
    };
};


/*
|--------------------------------------------------------------------------
| Payment Status Resolver
|--------------------------------------------------------------------------
*/

export const resolveInvoicePaymentStatus = (
    total: number,
    paidAmount: number
): InvoicePaymentStatus => {
    const totalMinor =
        toMinorUnits(
            total
        );

    const paidMinor =
        toMinorUnits(
            paidAmount
        );

    if (
        paidMinor <= 0
    ) {
        return INVOICE_PAYMENT_STATUSES.UNPAID;
    }

    if (
        paidMinor >= totalMinor
    ) {
        return INVOICE_PAYMENT_STATUSES.PAID;
    }

    return INVOICE_PAYMENT_STATUSES.PARTIALLY_PAID;
};


/*
|--------------------------------------------------------------------------
| Invoice Status Resolver
|--------------------------------------------------------------------------
*/

export const resolveInvoiceStatus = (
    paymentStatus: InvoicePaymentStatus
): InvoiceStatus => {
    switch (paymentStatus) {
        case INVOICE_PAYMENT_STATUSES.PAID:
            return INVOICE_STATUSES.PAID;

        case INVOICE_PAYMENT_STATUSES.PARTIALLY_PAID:
            return INVOICE_STATUSES.PARTIALLY_PAID;

        case INVOICE_PAYMENT_STATUSES.REFUNDED:
            return INVOICE_STATUSES.REFUNDED;

        case INVOICE_PAYMENT_STATUSES.PARTIALLY_REFUNDED:
            return INVOICE_STATUSES.PARTIALLY_REFUNDED;

        case INVOICE_PAYMENT_STATUSES.UNPAID:
        default:
            return INVOICE_STATUSES.ISSUED;
    }
};


/*
|--------------------------------------------------------------------------
| Invoice Number Generation
|--------------------------------------------------------------------------
*/

export const generateInvoiceNumber = (
    date = new Date()
): string => {
    const year =
        date.getUTCFullYear();

    const month =
        String(
            date.getUTCMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const timestamp =
        Date.now()
            .toString(36)
            .toUpperCase();

    const random =
        crypto
            .randomBytes(3)
            .toString("hex")
            .toUpperCase();

    return [
        "NPX",
        year,
        month,
        timestamp,
        random,
    ].join("-");
};


/*
|--------------------------------------------------------------------------
| Credit Note Number Generation
|--------------------------------------------------------------------------
*/

export const generateCreditNoteNumber = (
    date = new Date()
): string => {
    const year =
        date.getUTCFullYear();

    const timestamp =
        Date.now()
            .toString(36)
            .toUpperCase();

    const random =
        crypto
            .randomBytes(3)
            .toString("hex")
            .toUpperCase();

    return [
        "NPCN",
        year,
        timestamp,
        random,
    ].join("-");
};


/*
|--------------------------------------------------------------------------
| Invoice ID
|--------------------------------------------------------------------------
*/

export const generateInvoiceId = (): string => {
    return [
        "inv",
        crypto
            .randomBytes(16)
            .toString("hex"),
    ].join("_");
};


/*
|--------------------------------------------------------------------------
| Create Invoice
|--------------------------------------------------------------------------
*/

export const createInvoice = (
    input: CreateInvoiceInput
): Invoice => {
    const orderId =
        validateRequiredString(
            input.orderId,
            "Order ID"
        );

    const currency =
        validateCurrency(
            input.currency
        );

    const items =
        normalizeInvoiceItems(
            input.items
        );

    const totals =
        calculateInvoiceTotals(
            items,
            input.orderDiscount ?? 0,
            input.deliveryFee ?? 0,
            input.paidAmount ?? 0
        );

    const paymentStatus =
        resolveInvoicePaymentStatus(
            totals.total,
            totals.paidAmount
        );

    const status =
        resolveInvoiceStatus(
            paymentStatus
        );

    const now =
        new Date();

    const invoice: Invoice = {
        invoiceId:
            generateInvoiceId(),

        invoiceNumber:
            generateInvoiceNumber(
                now
            ),

        documentType:
            INVOICE_DOCUMENT_TYPES.INVOICE,

        orderId,

        customer:
            input.customer,

        seller:
            input.seller,

        items,

        totals,

        currency,

        status,

        paymentStatus,

        issuedAt:
            now,

        notes:
            input.notes,

        metadata:
            input.metadata,

        createdAt:
            now,

        updatedAt:
            now,
    };

    logger.info(
        {
            invoiceId:
                invoice.invoiceId,

            invoiceNumber:
                invoice.invoiceNumber,

            orderId:
                invoice.orderId,

            total:
                invoice.totals.total,

            currency:
                invoice.currency,
        },
        "Invoice created."
    );

    return invoice;
};


/*
|--------------------------------------------------------------------------
| Payment Recording
|--------------------------------------------------------------------------
*/

export const calculatePaymentUpdate = (
    invoice: Invoice,
    additionalPayment: number
): {
    readonly paidAmount: number;
    readonly dueAmount: number;
    readonly paymentStatus: InvoicePaymentStatus;
    readonly status: InvoiceStatus;
} => {
    const payment =
        validatePositiveAmount(
            additionalPayment,
            "Payment amount"
        );

    const currentPaidMinor =
        toMinorUnits(
            invoice.totals.paidAmount
        );

    const totalMinor =
        toMinorUnits(
            invoice.totals.total
        );

    const paymentMinor =
        toMinorUnits(
            payment
        );

    const newPaidMinor =
        Math.min(
            totalMinor,
            currentPaidMinor +
                paymentMinor
        );

    const dueMinor =
        Math.max(
            0,
            totalMinor -
                newPaidMinor
        );

    const paidAmount =
        fromMinorUnits(
            newPaidMinor
        );

    const dueAmount =
        fromMinorUnits(
            dueMinor
        );

    const paymentStatus =
        resolveInvoicePaymentStatus(
            invoice.totals.total,
            paidAmount
        );

    const status =
        resolveInvoiceStatus(
            paymentStatus
        );

    return {
        paidAmount,
        dueAmount,
        paymentStatus,
        status,
    };
};


/*
|--------------------------------------------------------------------------
| Refund Calculation
|--------------------------------------------------------------------------
*/

export const calculateInvoiceRefund = (
    invoice: Invoice,
    refundAmount: number
): {
    readonly refundAmount: number;
    readonly remainingPaidAmount: number;
    readonly paymentStatus: InvoicePaymentStatus;
    readonly status: InvoiceStatus;
} => {
    const refund =
        validatePositiveAmount(
            refundAmount,
            "Refund amount"
        );

    const paidMinor =
        toMinorUnits(
            invoice.totals.paidAmount
        );

    const refundMinor =
        toMinorUnits(
            refund
        );

    if (
        refundMinor >
        paidMinor
    ) {
        throw ApiError.badRequest(
            "Refund amount cannot exceed the paid amount.",
            {
                code:
                    "REFUND_EXCEEDS_PAID_AMOUNT",
            }
        );
    }

    const remainingPaidMinor =
        paidMinor -
        refundMinor;

    const totalMinor =
        toMinorUnits(
            invoice.totals.total
        );

    const remainingPaidAmount =
        fromMinorUnits(
            remainingPaidMinor
        );

    let paymentStatus:
        InvoicePaymentStatus;

    let status:
        InvoiceStatus;

    if (
        remainingPaidMinor <= 0
    ) {
        paymentStatus =
            INVOICE_PAYMENT_STATUSES.REFUNDED;

        status =
            INVOICE_STATUSES.REFUNDED;
    } else if (
        remainingPaidMinor <
        totalMinor
    ) {
        paymentStatus =
            INVOICE_PAYMENT_STATUSES.PARTIALLY_REFUNDED;

        status =
            INVOICE_STATUSES.PARTIALLY_REFUNDED;
    } else {
        paymentStatus =
            INVOICE_PAYMENT_STATUSES.PAID;

        status =
            INVOICE_STATUSES.PAID;
    }

    return {
        refundAmount:
            refund,

        remainingPaidAmount,

        paymentStatus,

        status,
    };
};


/*
|--------------------------------------------------------------------------
| Credit Note Creation
|--------------------------------------------------------------------------
*/

export const createCreditNote = (
    invoice: Invoice,
    amount: number,
    reason?: string
): CreditNote => {
    const refund =
        validatePositiveAmount(
            amount,
            "Credit note amount"
        );

    const paidMinor =
        toMinorUnits(
            invoice.totals.paidAmount
        );

    const refundMinor =
        toMinorUnits(
            refund
        );

    if (
        refundMinor >
        paidMinor
    ) {
        throw ApiError.badRequest(
            "Credit note amount cannot exceed the paid amount.",
            {
                code:
                    "CREDIT_NOTE_EXCEEDS_PAID_AMOUNT",
            }
        );
    }

    const now =
        new Date();

    return {
        creditNoteId:
            [
                "cn",
                crypto
                    .randomBytes(16)
                    .toString("hex"),
            ].join("_"),

        creditNoteNumber:
            generateCreditNoteNumber(
                now
            ),

        invoiceId:
            invoice.invoiceId,

        orderId:
            invoice.orderId,

        amount:
            refund,

        currency:
            invoice.currency,

        reason:
            reason?.trim(),

        createdAt:
            now,
    };
};


/*
|--------------------------------------------------------------------------
| Invoice Cancellation
|--------------------------------------------------------------------------
*/

export const canCancelInvoice = (
    invoice: Invoice
): boolean => {
    return (
        invoice.status !==
            INVOICE_STATUSES.CANCELLED &&
        invoice.status !==
            INVOICE_STATUSES.REFUNDED &&
        invoice.status !==
            INVOICE_STATUSES.PARTIALLY_REFUNDED
    );
};


export const assertInvoiceCanBeCancelled = (
    invoice: Invoice
): void => {
    if (
        !canCancelInvoice(
            invoice
        )
    ) {
        throw ApiError.conflict(
            "This invoice cannot be cancelled in its current state.",
            {
                code:
                    "INVOICE_CANNOT_BE_CANCELLED",
                details: {
                    invoiceId:
                        invoice.invoiceId,

                    status:
                        invoice.status,
                },
            }
        );
    }
};


/*
|--------------------------------------------------------------------------
| Invoice Status Transition
|--------------------------------------------------------------------------
*/

const INVOICE_STATUS_TRANSITIONS:
    Readonly<
        Record<
            InvoiceStatus,
            readonly InvoiceStatus[]
        >
    > = {
        [INVOICE_STATUSES.DRAFT]: [
            INVOICE_STATUSES.ISSUED,
            INVOICE_STATUSES.CANCELLED,
        ],

        [INVOICE_STATUSES.ISSUED]: [
            INVOICE_STATUSES.PAID,
            INVOICE_STATUSES.PARTIALLY_PAID,
            INVOICE_STATUSES.OVERDUE,
            INVOICE_STATUSES.CANCELLED,
            INVOICE_STATUSES.PARTIALLY_REFUNDED,
            INVOICE_STATUSES.REFUNDED,
        ],

        [INVOICE_STATUSES.PARTIALLY_PAID]: [
            INVOICE_STATUSES.PAID,
            INVOICE_STATUSES.OVERDUE,
            INVOICE_STATUSES.PARTIALLY_REFUNDED,
            INVOICE_STATUSES.REFUNDED,
        ],

        [INVOICE_STATUSES.PAID]: [
            INVOICE_STATUSES.PARTIALLY_REFUNDED,
            INVOICE_STATUSES.REFUNDED,
        ],

        [INVOICE_STATUSES.OVERDUE]: [
            INVOICE_STATUSES.PAID,
            INVOICE_STATUSES.PARTIALLY_PAID,
            INVOICE_STATUSES.PARTIALLY_REFUNDED,
            INVOICE_STATUSES.REFUNDED,
        ],

        [INVOICE_STATUSES.CANCELLED]: [],

        [INVOICE_STATUSES.REFUNDED]: [],

        [INVOICE_STATUSES.PARTIALLY_REFUNDED]: [
            INVOICE_STATUSES.REFUNDED,
        ],
    };


/*
|--------------------------------------------------------------------------
| Status Transition Guard
|--------------------------------------------------------------------------
*/

export const canTransitionInvoiceStatus = (
    currentStatus: InvoiceStatus,
    nextStatus: InvoiceStatus
): boolean => {
    if (
        currentStatus ===
        nextStatus
    ) {
        return true;
    }

    return INVOICE_STATUS_TRANSITIONS[
        currentStatus
    ].includes(
        nextStatus
    );
};


export const assertInvoiceStatusTransition = (
    currentStatus: InvoiceStatus,
    nextStatus: InvoiceStatus
): void => {
    if (
        !canTransitionInvoiceStatus(
            currentStatus,
            nextStatus
        )
    ) {
        throw ApiError.conflict(
            `Invalid invoice status transition: ${currentStatus} → ${nextStatus}`,
            {
                code:
                    "INVALID_INVOICE_STATUS_TRANSITION",
                details: {
                    currentStatus,
                    nextStatus,
                },
            }
        );
    }
};


/*
|--------------------------------------------------------------------------
| Invoice Aging
|--------------------------------------------------------------------------
*/

export const isInvoiceOverdue = (
    invoice: Invoice,
    now = new Date()
): boolean => {
    if (
        !invoice.dueAt
    ) {
        return false;
    }

    if (
        invoice.paymentStatus ===
            INVOICE_PAYMENT_STATUSES.PAID ||
        invoice.paymentStatus ===
            INVOICE_PAYMENT_STATUSES.REFUNDED
    ) {
        return false;
    }

    return (
        now.getTime() >
        invoice.dueAt.getTime()
    );
};


/*
|--------------------------------------------------------------------------
| Invoice Summary
|--------------------------------------------------------------------------
*/

export interface InvoiceSummary {
    readonly invoiceId: string;
    readonly invoiceNumber: string;
    readonly orderId: string;
    readonly currency: string;
    readonly subtotal: number;
    readonly discount: number;
    readonly tax: number;
    readonly deliveryFee: number;
    readonly total: number;
    readonly paidAmount: number;
    readonly dueAmount: number;
    readonly status: InvoiceStatus;
    readonly paymentStatus: InvoicePaymentStatus;
}


export const getInvoiceSummary = (
    invoice: Invoice
): InvoiceSummary => {
    return {
        invoiceId:
            invoice.invoiceId,

        invoiceNumber:
            invoice.invoiceNumber,

        orderId:
            invoice.orderId,

        currency:
            invoice.currency,

        subtotal:
            invoice.totals.subtotal,

        discount:
            roundMoney(
                invoice.totals.itemDiscount +
                invoice.totals.orderDiscount
            ),

        tax:
            invoice.totals.tax,

        deliveryFee:
            invoice.totals.deliveryFee,

        total:
            invoice.totals.total,

        paidAmount:
            invoice.totals.paidAmount,

        dueAmount:
            invoice.totals.dueAmount,

        status:
            invoice.status,

        paymentStatus:
            invoice.paymentStatus,
    };
};


/*
|--------------------------------------------------------------------------
| Invoice Service Health
|--------------------------------------------------------------------------
*/

export const checkInvoiceService = async (): Promise<{
    readonly configured: boolean;
    readonly healthy: boolean;
}> => {
    /*
     * Invoice calculation has no external provider dependency.
     * PDF/email/database integrations are separate services/modules.
     */
    return {
        configured: true,
        healthy: true,
    };
};


/*
|--------------------------------------------------------------------------
| Invoice Service Initialization
|--------------------------------------------------------------------------
*/

export const initializeInvoiceService =
    (): void => {
        logger.info(
            {
                service:
                    "invoice",

                documentTypes:
                    Object.values(
                        INVOICE_DOCUMENT_TYPES
                    ),

                statuses:
                    Object.values(
                        INVOICE_STATUSES
                    ),
            },
            "Invoice service initialized."
        );
    };