import type { WarehouseStatus } from "./warehouse.model";

export interface CreateWarehouseInput {
  name: string;
  code: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  status?: WarehouseStatus;
  isDefault?: boolean;
}

export type UpdateWarehouseInput = Partial<CreateWarehouseInput>;

export interface WarehouseListFilters {
  page: number;
  limit: number;
  search?: string;
  status?: WarehouseStatus;
  city?: string;
  country?: string;
  sortBy: "name" | "code" | "createdAt" | "updatedAt";
  sortOrder: "asc" | "desc";
}
