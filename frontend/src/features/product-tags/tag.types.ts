export interface ProductTag {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductTagAssignment {
  _id: string;
  productId: string;
  tagId: ProductTag | string;
  createdAt: string;
}

export interface ProductTagListResult {
  items: ProductTag[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ProductTagInput {
  name: string;
  slug?: string;
  description?: string;
}

export interface ProductTagUpdateInput {
  name?: string;
  slug?: string;
  description?: string | null;
}

export interface ProductTagQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ProductTagProduct {
  _id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
}

export interface ProductTagProductListResult {
  items: ProductTagProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
