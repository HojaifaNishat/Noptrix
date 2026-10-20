import type { Types } from "mongoose";

export const SUPPLIER_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
] as const;

export type SupplierStatus = (typeof SUPPLIER_STATUSES)[number];

export interface SupplierAddress {
  street?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
}

export interface SupplierContact {
  name?: string;
  email?: string;
  phone?: string;
  designation?: string;
}

export interface SupplierAuditEntry {
  action: "CREATED" | "UPDATED" | "STATUS_CHANGED";
  performedBy: Types.ObjectId;
  performedAt: Date;
  changes?: Record<string, unknown>;
}

export interface Supplier {
  name: string;
  code: string;
  slug: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  website?: string;
  taxId?: string;
  registrationNumber?: string;
  address: SupplierAddress;
  contactPerson?: SupplierContact;
  paymentTermsDays: number;
  creditLimit: number;
  currency: string;
  status: SupplierStatus;
  notes?: string;
  tags: string[];
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  auditTrail: SupplierAuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSupplierInput {
  name: string;
  code?: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  website?: string;
  taxId?: string;
  registrationNumber?: string;
  address: SupplierAddress;
  contactPerson?: SupplierContact;
  paymentTermsDays?: number;
  creditLimit?: number;
  currency?: string;
  notes?: string;
  tags?: string[];
}

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

export interface SupplierFilters {
  search?: string;
  status?: SupplierStatus;
  city?: string;
  country?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: "name" | "code" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface SupplierListResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
