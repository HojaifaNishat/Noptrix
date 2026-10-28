export type LowStockFilter = "ALL" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface LowStockQuery {
  page: number;
  limit: number;
  search?: string;
  warehouseId?: string;
  productId?: string;
  status: LowStockFilter;
  sortBy: "quantity" | "createdAt" | "updatedAt";
  sortOrder: "asc" | "desc";
}
