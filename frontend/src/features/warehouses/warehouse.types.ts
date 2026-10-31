export type WarehouseStatus = "ACTIVE" | "INACTIVE";

export interface Warehouse {
  _id: string;
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
  status: WarehouseStatus;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  deactivatedAt?: string;
}

export interface WarehouseInput {
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
  status: WarehouseStatus;
  isDefault: boolean;
}

export interface WarehouseFilters {
  page: number;
  limit: number;
  search?: string;
  status?: WarehouseStatus;
  city?: string;
  country?: string;
  sortBy: "name" | "code" | "createdAt" | "updatedAt";
  sortOrder: "asc" | "desc";
}

export interface WarehousePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface WarehouseListResult {
  items: Warehouse[];
  pagination: WarehousePagination;
}
