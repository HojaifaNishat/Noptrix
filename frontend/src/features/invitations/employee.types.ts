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

export interface EmployeeUser {
    id?: string;
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
}

export interface EmployeeRole {
    id?: string;
    _id?: string;
    name?: string;
    slug?: string;
    description?: string;
    status?: string;
    isSystemRole?: boolean;
}

export interface Employee {
    id?: string;
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
