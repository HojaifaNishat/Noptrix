import { Types } from "mongoose";

export const COLLECTION_STATUSES = [
  "ACTIVE",
  "INACTIVE",
] as const;

export type CollectionStatus =
  (typeof COLLECTION_STATUSES)[number];

export interface ICollection {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  products: Types.ObjectId[];
  status: CollectionStatus;
  isFeatured: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
}

export interface ICollectionFilters {
  search?: string;
  status?: CollectionStatus;
  isFeatured?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "name" | "createdAt" | "updatedAt" | "sortOrder";
  sortOrder?: "asc" | "desc";
}

export interface ICreateCollectionInput {
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

export interface IUpdateCollectionInput
  extends Partial<ICreateCollectionInput> {}