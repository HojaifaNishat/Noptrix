export const EMPLOYEE_INVITATION_STATUSES = [
    "PENDING",
    "ACCEPTED",
    "EXPIRED",
    "REVOKED",
] as const;

export type EmployeeInvitationStatus =
    (typeof EMPLOYEE_INVITATION_STATUSES)[number];

export interface InvitationRole {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    status?: string;
    isSystemRole?: boolean;
}

export interface InvitationApplication {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
}

export interface InvitationUser {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
}

export interface InvitationEmployee {
    _id: string;
    employeeCode?: string;
    employmentType?: string;
    department?: string;
    jobTitle?: string;
    joiningDate?: string;
    leavingDate?: string;
    salary?: number;
    status?: string;
}

export interface EmployeeInvitation {
    _id: string;
    applicationId: string | InvitationApplication;
    email: string;
    name: string;
    invitedBy: string | InvitationUser;
    roleId: string | InvitationRole;
    status: EmployeeInvitationStatus;
    expiresAt: string;
    acceptedAt?: string;
    acceptedUserId?: string | InvitationUser;
    acceptedEmployeeId?: string | InvitationEmployee;
    revokedAt?: string;
    revokedBy?: string | InvitationUser;
    createdAt: string;
    updatedAt: string;
}

export interface CreateEmployeeInvitationInput {
    applicationId: string;
    roleId: string;
}

export interface CreateEmployeeInvitationResult {
    invitationId: string;
    applicationId: string;
    applicantId: string;
    email: string;
    name: string;
    roleId: string;
    expiresAt: string;
    token: string;
}

export interface AcceptEmployeeInvitationInput {
    token: string;
}

export interface AcceptEmployeeInvitationResult {
    userId: string;
    employeeId: string;
    invitationId: string;
    applicationId: string;
    email: string;
    name: string;
    roleId: string;
    role: string;
}

export interface EmployeeInvitationQuery {
    page?: number;
    limit?: number;
    status?: EmployeeInvitationStatus;
    search?: string;
    applicationId?: string;
    roleId?: string;
}

export interface EmployeeInvitationPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface EmployeeInvitationListResponse {
    invitations: EmployeeInvitation[];
    pagination: EmployeeInvitationPagination;
}
