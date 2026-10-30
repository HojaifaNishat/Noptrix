import apiClient from "./client";

import type { ApiResponse } from "@/types/api";
import type {
  PeopleListParams,
  PeopleListResponse,
  PersonStatus,
  CustomerSegment,
} from "@/features/people/people.types";

export interface CustomerGroup {
  id: CustomerSegment;
  name: string;
  description: string;
  count: number;
}

export interface CustomerNotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  marketing: boolean;
}

interface CustomerListItem {
  _id: string;
  avatar?: string;
  userId:
    | {
        _id: string;
        name: string;
        email?: string;
        phone?: string;
        avatarUrl?: string;
        lastLoginAt?: string;
        isEmailVerified?: boolean;
        isPhoneVerified?: boolean;
      }
    | string
    | null;
  status: PersonStatus;
  totalOrders: number;
  createdAt: string;
}

interface CustomerListResponse {
  items: CustomerListItem[];
  pagination: PeopleListResponse["pagination"];
}

export const customersApi = {
  async getGroups(): Promise<CustomerGroup[]> {
    const response =
      await apiClient.get<ApiResponse<CustomerGroup[]>>("/customers/groups");
    return response.data.data;
  },

  async getAll(params: PeopleListParams): Promise<PeopleListResponse> {
    const response = await apiClient.get<ApiResponse<CustomerListResponse>>(
      "/customers",
      { params },
    );

    return {
      ...response.data.data,
      items: response.data.data.items.map((customer) => {
        const user =
          typeof customer.userId === "object" ? customer.userId : null;

        return {
          id: customer._id,
          ...(typeof customer.userId === "object" && customer.userId
            ? { accountUserId: customer.userId._id }
            : {}),
          name: user?.name ?? "Unknown user",
          ...(user?.email ? { email: user.email } : {}),
          ...(user?.phone ? { phone: user.phone } : {}),
          ...(customer.avatar || user?.avatarUrl
            ? { avatarUrl: customer.avatar ?? user?.avatarUrl }
            : {}),
          ...(user?.lastLoginAt ? { lastLoginAt: user.lastLoginAt } : {}),
          ...(user?.isEmailVerified !== undefined
            ? { isEmailVerified: user.isEmailVerified }
            : {}),
          ...(user?.isPhoneVerified !== undefined
            ? { isPhoneVerified: user.isPhoneVerified }
            : {}),
          status: customer.status,
          createdAt: customer.createdAt,
          totalOrders: customer.totalOrders,
        };
      }),
    };
  },

  async updateStatus(customerId: string, status: PersonStatus): Promise<void> {
    await apiClient.patch<ApiResponse<unknown>>(
      `/customers/${customerId}/status`,
      { status },
    );
  },

  async getNotificationPreferences(
    customerId: string,
  ): Promise<CustomerNotificationPreferences> {
    const response = await apiClient.get<
      ApiResponse<{
        customerId: string;
        preferences: CustomerNotificationPreferences;
      }>
    >(`/customers/${customerId}/notification-preferences`);
    return response.data.data.preferences;
  },

  async updateNotificationPreferences(
    customerId: string,
    preferences: Partial<CustomerNotificationPreferences>,
  ): Promise<CustomerNotificationPreferences> {
    const response = await apiClient.patch<
      ApiResponse<{
        customerId: string;
        preferences: CustomerNotificationPreferences;
      }>
    >(`/customers/${customerId}/notification-preferences`, preferences);
    return response.data.data.preferences;
  },
};
