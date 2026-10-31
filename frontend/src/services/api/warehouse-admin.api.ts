import apiClient from "@/services/api/client";
import type { ApiResponse } from "@/types/api";
import type {
  Warehouse,
  WarehouseFilters,
  WarehouseInput,
  WarehouseListResult,
} from "@/features/warehouses/warehouse.types";

type WarehouseListApiResponse = ApiResponse<Warehouse[]> & {
  pagination?: WarehouseListResult["pagination"];
  meta?: WarehouseListResult["pagination"];
};

const emptyPagination: WarehouseListResult["pagination"] = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

export const warehouseAdminApi = {
  async list(filters: WarehouseFilters): Promise<WarehouseListResult> {
    const response = await apiClient.get<WarehouseListApiResponse>(
      "/warehouses",
      { params: filters },
    );

    const payload = response.data.data;

    const items = Array.isArray(payload)
      ? payload
      : ((payload as unknown as { items?: Warehouse[] })?.items ?? []);

    const pagination =
      response.data.pagination ??
      response.data.meta ??
      (!Array.isArray(payload)
        ? (payload as unknown as WarehouseListResult)?.pagination
        : undefined);

    return {
      items,
      pagination: pagination ?? {
        ...emptyPagination,
        page: filters.page,
        limit: filters.limit,
        total: items.length,
        totalPages: items.length ? 1 : 0,
      },
    };
  },

  async get(id: string): Promise<Warehouse> {
    const response = await apiClient.get<ApiResponse<Warehouse>>(
      `/warehouses/${id}`,
    );
    return response.data.data;
  },

  async create(input: WarehouseInput): Promise<Warehouse> {
    const response = await apiClient.post<ApiResponse<Warehouse>>(
      "/warehouses",
      input,
    );
    return response.data.data;
  },

  async update(id: string, input: Partial<WarehouseInput>): Promise<Warehouse> {
    const response = await apiClient.patch<ApiResponse<Warehouse>>(
      `/warehouses/${id}`,
      input,
    );
    return response.data.data;
  },

  async activate(id: string): Promise<Warehouse> {
    const response = await apiClient.post<ApiResponse<Warehouse>>(
      `/warehouses/${id}/activate`,
    );
    return response.data.data;
  },

  async deactivate(id: string): Promise<Warehouse> {
    const response = await apiClient.delete<ApiResponse<Warehouse>>(
      `/warehouses/${id}`,
    );
    return response.data.data;
  },
};
