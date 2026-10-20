import type { Types } from "mongoose";

export const ADDRESS_TYPES = [
  "HOME",
  "WORK",
  "OTHER",
] as const;

export type AddressType = (typeof ADDRESS_TYPES)[number];

export interface AddressLocation {
  latitude?: number;
  longitude?: number;
}

export interface Address {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;

  type: AddressType;
  label?: string;

  fullName: string;
  phone: string;
  alternatePhone?: string;

  country: string;
  countryCode?: string;
  state: string;
  city: string;
  area?: string;
  postalCode?: string;

  addressLine1: string;
  addressLine2?: string;
  landmark?: string;

  location?: AddressLocation;

  isDefault: boolean;
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateAddressInput {
  type?: AddressType;
  label?: string;

  fullName: string;
  phone: string;
  alternatePhone?: string;

  country: string;
  countryCode?: string;
  state: string;
  city: string;
  area?: string;
  postalCode?: string;

  addressLine1: string;
  addressLine2?: string;
  landmark?: string;

  location?: AddressLocation;
  isDefault?: boolean;
}

export type UpdateAddressInput = Partial<CreateAddressInput>;

export interface AddressListFilters {
  type?: AddressType;
  isDefault?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "fullName";
  sortOrder?: "asc" | "desc";
}

export interface AddressListResult {
  addresses: Address[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
