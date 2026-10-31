export type CollectionStatus = "ACTIVE" | "INACTIVE";

export interface CollectionProduct {
  _id: string;
  name: string;
  slug?: string;
  sku?: string;
  price?: number;
  status?: string;
  image?: string;
  images?: Array<{
    url?: string;
    imageUrl?: string;
  }>;
}

export interface Collection {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  products: CollectionProduct[];
  status: CollectionStatus;
  isFeatured: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionInput {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  products?: string[];
  status?: CollectionStatus;
  isFeatured?: boolean;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
}

export type CollectionUpdateInput = Partial<CollectionInput>;

export interface CollectionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CollectionListResponse {
  items: Collection[];
  pagination: CollectionPagination;
}

export interface CollectionFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: CollectionStatus;
  isFeatured?: boolean;
  sortBy?: "name" | "createdAt" | "updatedAt" | "sortOrder";
  sortOrder?: "asc" | "desc";
}

export interface ProductOption {
  _id: string;
  name: string;
  slug?: string;
  status?: string;
}
