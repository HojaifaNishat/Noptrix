export const ATTRIBUTE_TYPES = [
  "TEXT",
  "NUMBER",
  "BOOLEAN",
  "SELECT",
  "MULTI_SELECT",
] as const;

export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];

export const ATTRIBUTE_STATUSES = [
  "ACTIVE",
  "INACTIVE",
] as const;

export type AttributeStatus =
  (typeof ATTRIBUTE_STATUSES)[number];

export interface Attribute {
  readonly _id: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly type: AttributeType;
  readonly options: readonly string[];
  readonly isRequired: boolean;
  readonly isVariant: boolean;
  readonly isFilterable: boolean;
  readonly isSearchable: boolean;
  readonly status: AttributeStatus;
  readonly sortOrder: number;
  readonly createdBy?: string | null;
  readonly updatedBy?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateAttributeInput {
  readonly name: string;
  readonly slug?: string;
  readonly description?: string;
  readonly type: AttributeType;
  readonly options?: string[];
  readonly isRequired?: boolean;
  readonly isVariant?: boolean;
  readonly isFilterable?: boolean;
  readonly isSearchable?: boolean;
  readonly status?: AttributeStatus;
  readonly sortOrder?: number;
}

export interface UpdateAttributeInput {
  readonly name?: string;
  readonly slug?: string;
  readonly description?: string;
  readonly type?: AttributeType;
  readonly options?: string[];
  readonly isRequired?: boolean;
  readonly isVariant?: boolean;
  readonly isFilterable?: boolean;
  readonly isSearchable?: boolean;
  readonly status?: AttributeStatus;
  readonly sortOrder?: number;
}

export interface AttributeListParams {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly type?: AttributeType;
  readonly status?: AttributeStatus;
  readonly isVariant?: boolean;
  readonly isFilterable?: boolean;
  readonly sortBy?:
    | "name"
    | "createdAt"
    | "updatedAt"
    | "sortOrder";
  readonly sortOrder?: "asc" | "desc";
}

export interface AttributePagination {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface AttributeListResult {
  readonly items: readonly Attribute[];
  readonly pagination: AttributePagination;
}

export interface UpdateAttributeStatusInput {
  readonly status: AttributeStatus;
}

export interface UpdateAttributeSortOrderInput {
  readonly sortOrder: number;
}
