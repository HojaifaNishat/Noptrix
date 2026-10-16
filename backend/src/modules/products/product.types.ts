import type { Types } from "mongoose";
import type {
  IProduct,
  ProductStatus,
  ProductType,
  InventoryPolicy,
} from "./product.model";

export { PRODUCT_STATUSES, PRODUCT_TYPES, INVENTORY_POLICIES } from "./product.model";
export type { ProductStatus, ProductType, InventoryPolicy } from "./product.model";

export interface ProductSeo {
  readonly title?: string;
  readonly description?: string;
  readonly keywords?: readonly string[];
}

export interface ProductShipping {
  readonly requiresShipping: boolean;
  readonly weight?: number;
  readonly weightUnit?: "g" | "kg";
  readonly length?: number;
  readonly width?: number;
  readonly height?: number;
  readonly dimensionUnit?: "cm" | "m";
}

export type ProductData = Readonly<IProduct>;

export interface CreateProductInput {
  readonly name: string;
  readonly slug?: string;
  readonly type?: ProductType;
  readonly shortDescription?: string;
  readonly description?: string;
  readonly categoryId?: string;
  readonly subcategoryId?: string;
  readonly brandId?: string;
  readonly collectionIds?: readonly string[];
  readonly price: number;
  readonly compareAtPrice?: number;
  readonly currency?: string;
  readonly images?: readonly string[];
  readonly status?: ProductStatus;
  readonly isFeatured?: boolean;
  readonly sku: string;
  readonly barcode?: string;
  readonly inventoryPolicy?: InventoryPolicy;
  readonly hasVariants?: boolean;
  readonly defaultImageId?: string;
  readonly seo?: ProductSeo;
  readonly shipping?: ProductShipping;
  readonly createdBy?: string;
}

export interface UpdateProductInput {
  readonly name?: string;
  readonly slug?: string;
  readonly type?: ProductType;
  readonly shortDescription?: string | null;
  readonly description?: string;
  readonly categoryId?: string | null;
  readonly subcategoryId?: string | null;
  readonly brandId?: string | null;
  readonly collectionIds?: readonly string[];
  readonly price?: number;
  readonly compareAtPrice?: number | null;
  readonly currency?: string;
  readonly images?: readonly string[];
  readonly status?: ProductStatus;
  readonly isFeatured?: boolean;
  readonly sku?: string;
  readonly barcode?: string | null;
  readonly inventoryPolicy?: InventoryPolicy;
  readonly hasVariants?: boolean;
  readonly defaultImageId?: string | null;
  readonly seo?: ProductSeo;
  readonly shipping?: ProductShipping;
  readonly updatedBy?: string;
}

export interface ProductListFilters {
  readonly search?: string;
  readonly categoryId?: string;
  readonly subcategoryId?: string;
  readonly brandId?: string;
  readonly status?: ProductStatus;
  readonly type?: ProductType;
  readonly isFeatured?: boolean;
  readonly hasVariants?: boolean;
}

export interface ProductPagination {
  readonly page: number;
  readonly limit: number;
}

export interface ProductListQuery extends ProductListFilters, ProductPagination {
  readonly sortBy?: "name" | "price" | "createdAt" | "updatedAt";
  readonly sortOrder?: "asc" | "desc";
}

export interface ProductListResult {
  readonly items: readonly ProductData[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
    readonly hasNextPage: boolean;
    readonly hasPreviousPage: boolean;
  };
}

export interface ProductImageReference {
  readonly imageId: Types.ObjectId;
}
