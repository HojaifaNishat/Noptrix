import type { Types } from "mongoose";

export interface ProductImageActor {
  userId: string;
}

export interface ProductImageInput {
  alt?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface ProductImageListQuery {
  page: number;
  limit: number;
}

export interface ProductImageRecord {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  url: string;
  publicId?: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  createdAt: Date;
  updatedAt: Date;
}