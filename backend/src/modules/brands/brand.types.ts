import type { Types } from "mongoose";
import type { BrandStatus } from "./brand.model";

export interface BrandLogoAsset {
  readonly publicId: string;
  readonly secureUrl: string;
  readonly url: string;
  readonly assetId: string;
  readonly version: number;
  readonly resourceType: "image";
  readonly format: string;
  readonly bytes: number;
  readonly width?: number;
  readonly height?: number;
  readonly originalFilename?: string;
}

export interface BrandSeo {
  readonly title?: string;
  readonly description?: string;
}

export interface BrandDocument {
  readonly _id: Types.ObjectId;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly logo?: string;
  readonly logoAsset?: BrandLogoAsset;
  readonly website?: string;
  readonly status: BrandStatus;
  readonly sortOrder: number;
  readonly seo?: BrandSeo;
  readonly createdBy?: Types.ObjectId | null;
  readonly updatedBy?: Types.ObjectId | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateBrandInput {
  readonly name: string;
  readonly slug?: string;
  readonly description?: string;
  readonly logo?: string;
  readonly website?: string;
  readonly status?: BrandStatus;
  readonly sortOrder?: number;
  readonly seo?: BrandSeo;
}

export interface UpdateBrandInput {
  readonly name?: string;
  readonly slug?: string;
  readonly description?: string;
  readonly logo?: string;
  readonly website?: string;
  readonly status?: BrandStatus;
  readonly sortOrder?: number;
  readonly seo?: BrandSeo;
  readonly removeLogo?: boolean;
}

export interface BrandListQuery {
  readonly search?: string;
  readonly status?: BrandStatus;
  readonly page: number;
  readonly limit: number;
  readonly sortBy?: "name" | "sortOrder" | "createdAt" | "updatedAt";
  readonly sortOrder?: "asc" | "desc";
}

export interface BrandListResult {
  readonly items: readonly BrandDocument[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
    readonly hasNextPage: boolean;
    readonly hasPreviousPage: boolean;
  };
}
