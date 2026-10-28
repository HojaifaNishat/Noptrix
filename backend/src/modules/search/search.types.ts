export const SEARCH_SORT_OPTIONS = [
  "relevance",
  "newest",
  "price_asc",
  "price_desc",
  "name_asc",
  "name_desc",
] as const;

export type SearchSortOption = (typeof SEARCH_SORT_OPTIONS)[number];

export interface ProductSearchFilters {
  q?: string;
  categoryId?: string;
  subcategoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  inStock?: boolean;
  sortBy: SearchSortOption;
  page: number;
  limit: number;
}

export interface SearchSuggestion {
  name: string;
  slug: string;
  price: number;
  currency: string;
}

export interface SearchResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: {
    q?: string;
    categoryId?: string;
    subcategoryId?: string;
    brandId?: string;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
    inStock?: boolean;
    sortBy: SearchSortOption;
  };
}
