export interface ProductImage {
  _id: string;
  productId: string;
  url: string;
  publicId?: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ImagePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductImageListResult {
  items: ProductImage[];
  pagination: ImagePagination;
}

export interface ImageUpdateInput {
  alt?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface ImageUploadInput {
  files: File[];
  alt?: string;
  primaryIndex?: number;
}

export interface VariableProduct {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  type: string;
  status: string;
}

export interface ProductListResult {
  items: VariableProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
