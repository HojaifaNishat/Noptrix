import type { ProductStatus, ProductType } from "../products/product.types";

export interface SellerProductCreateInput {
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  type?: ProductType;
  sku?: string;
  barcode?: string;
  categoryId: string;
  subcategoryId?: string;
  brandId?: string;
  collectionIds?: string[];
  price: number;
  compareAtPrice?: number;
  currency?: string;
  trackInventory?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  inventoryPolicy?: "DENY" | "CONTINUE";
  requiresShipping?: boolean;
  shipping?: {
    required?: boolean;
    weight?: number;
    weightUnit?: "g" | "kg";
    length?: number;
    width?: number;
    height?: number;
    dimensionUnit?: "cm" | "m";
  };
  tags?: string[];
  attributes?: Record<string, unknown>;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    canonicalUrl?: string;
  };
}

export type SellerProductUpdateInput = Partial<SellerProductCreateInput>;

export interface SellerProductListQuery {
  page: number;
  limit: number;
  search?: string;
  status?: ProductStatus;
  type?: ProductType;
  categoryId?: string;
  subcategoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: "true" | "false";
  sortBy: "createdAt" | "updatedAt" | "name" | "price";
  sortOrder: "asc" | "desc";
}
