import type { Role } from "@/types/role";

export type AdminStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "BLOCKED";

export interface AdminUser {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  status?: string;
}

export type AdminRole = Omit<Partial<Role>, "status"> & {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
  status?: string;
  hierarchyLevel?: number;
};

export interface Admin {
  _id: string;
  id?: string;
  userId: string | AdminUser;
  roleId: string | AdminRole;
  status: AdminStatus;
  lastLoginAt?: string;
  lastLoginIp?: string;
  createdAt: string;
  updatedAt: string;
}
