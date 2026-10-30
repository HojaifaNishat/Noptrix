import type { PaginatedResponse } from "@/types/api";

export type PersonStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BLOCKED";

export type CustomerSegment = PersonStatus | "NEW_BUYERS" | "REPEAT_BUYERS";

export interface PeopleListParams {
  page: number;
  limit: number;
  search?: string;
  status?: PersonStatus;
  segment?: CustomerSegment;
}

export interface PeopleRecord {
  id: string;
  accountUserId?: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  status: PersonStatus;
  createdAt: string;
  lastLoginAt?: string;
  totalOrders?: number;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

export type PeopleListResponse = PaginatedResponse<PeopleRecord>;
