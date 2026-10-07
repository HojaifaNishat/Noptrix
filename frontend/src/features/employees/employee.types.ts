export const EMPLOYEE_STATUSES = [
    "ACTIVE",
    "INACTIVE",
    "SUSPENDED",
    "TERMINATED",
] as const;

export type EmployeeStatus =
    (typeof EMPLOYEE_STATUSES)[number];

export const EMPLOYMENT_TYPES = [
    "FULL_TIME",
    "PART_TIME",
    "CONTRACT",
    "INTERN",
] as const;

export type EmploymentType =
    (typeof EMPLOYMENT_TYPES)[number];

export interface EmployeeRole {
    _id?: string;
    id?: string;
    name?: string;
    slug?: string;
    description?: string;
    status?: string;
    isSystemRole?: boolean;
}

export interface EmployeeUser {
    _id?: string;
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
}

export interface Employee {
    _id: string;

    userId:
        | string
        | EmployeeUser;

    roleId:
        | string
        | EmployeeRole;

    status: EmployeeStatus;

    employmentType: EmploymentType;

    employeeCode: string;

    department?: string;

    jobTitle?: string;

    joiningDate?: string;

    leavingDate?: string;

    salary?: number;

    emergencyContactName?: string;

    emergencyContactPhone?: string;

    notes?: string;

    createdAt?: string;

    updatedAt?: string;
}

export interface EmployeeListParams {
    status?: EmployeeStatus;
    employmentType?: EmploymentType;
    department?: string;
    roleId?: string;
}

export interface UpdateEmployeeInput {
    roleId?: string;

    employmentType?: EmploymentType;

    department?: string;

    jobTitle?: string;

    joiningDate?: string;

    leavingDate?: string;

    salary?: number;

    emergencyContactName?: string;

    emergencyContactPhone?: string;

    notes?: string;
}

export interface UpdateEmployeeStatusInput {
    status: EmployeeStatus;
}

export interface EmployeeRoleOption {
    id: string;
    name: string;
    slug: string;
    description?: string;
    status?: string;
}
