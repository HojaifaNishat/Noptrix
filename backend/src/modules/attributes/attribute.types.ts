import type { Types } from "mongoose";
import type { Attribute } from "./attribute.model";

export const ATTRIBUTE_TYPES = [
  "TEXT",
  "NUMBER",
  "BOOLEAN",
  "SELECT",
  "MULTI_SELECT",
] as const;

export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];
export type AttributeStatus = "ACTIVE" | "INACTIVE";
export type AttributeDocument = InstanceType<typeof Attribute>;

export interface CreateAttributeInput {
  name: string;
  slug?: string;
  description?: string;
  type: AttributeType;
  options?: string[];
  isRequired?: boolean;
  isVariant?: boolean;
  isFilterable?: boolean;
  isSearchable?: boolean;
  status?: AttributeStatus;
  sortOrder?: number;
  createdBy?: string;
}

export interface UpdateAttributeInput {
  name?: string;
  slug?: string;
  description?: string;
  type?: AttributeType;
  options?: string[];
  isRequired?: boolean;
  isVariant?: boolean;
  isFilterable?: boolean;
  isSearchable?: boolean;
  status?: AttributeStatus;
  sortOrder?: number;
  updatedBy?: string;
}

export interface AttributeListQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: AttributeType;
  status?: AttributeStatus;
  isVariant?: boolean;
  isFilterable?: boolean;
  sortBy?: "name" | "createdAt" | "updatedAt" | "sortOrder";
  sortOrder?: "asc" | "desc";
}

export interface AttributeListResult {
  data: readonly AttributeDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AttributeActor {
  id: Types.ObjectId;
}
