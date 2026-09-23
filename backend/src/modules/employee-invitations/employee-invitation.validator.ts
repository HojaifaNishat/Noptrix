import { z } from "zod";
import { EMPLOYMENT_TYPES } from "../employees/employee.model";

const emailSchema = z.string().trim().email().toLowerCase();
const employeeCodeSchema = z.string().trim().min(3).max(50).regex(/^[A-Za-z0-9_-]+$/);

export const createEmployeeInvitationSchema = z.object({
    email: emailSchema,
    roleId: z.string().trim().min(1),
    employmentType: z.enum([
        EMPLOYMENT_TYPES.FULL_TIME,
        EMPLOYMENT_TYPES.PART_TIME,
        EMPLOYMENT_TYPES.CONTRACT,
        EMPLOYMENT_TYPES.INTERN,
    ]),
    employeeCode: employeeCodeSchema,
    department: z.string().trim().max(100).optional(),
    jobTitle: z.string().trim().max(150).optional(),
});

export const acceptEmployeeInvitationSchema = z.object({
    token: z.string().trim().min(1),
    name: z.string().trim().min(2).max(100),
    password: z.string().min(8).max(128),
});

export type CreateEmployeeInvitationInput = z.infer<typeof createEmployeeInvitationSchema>;
export type AcceptEmployeeInvitationInput = z.infer<typeof acceptEmployeeInvitationSchema>;