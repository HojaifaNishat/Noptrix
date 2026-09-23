import { z } from "zod";

import {
    EMPLOYEE_STATUSES,
    EMPLOYMENT_TYPES,
} from "./employee.model";

/*
|--------------------------------------------------------------------------
| Shared Schemas
|--------------------------------------------------------------------------
*/

const employeeIdSchema = z
    .string()
    .trim()
    .min(1, "Employee ID is required.");

const userIdSchema = z
    .string()
    .trim()
    .min(1, "User ID is required.");

const roleIdSchema = z
    .string()
    .trim()
    .min(1, "Role ID is required.");

const employeeCodeSchema = z
    .string()
    .trim()
    .min(
        3,
        "Employee code must be at least 3 characters."
    )
    .max(
        50,
        "Employee code cannot exceed 50 characters."
    )
    .regex(
        /^[A-Za-z0-9_-]+$/,
        "Employee code may contain only letters, numbers, underscores, and hyphens."
    );

const departmentSchema = z
    .string()
    .trim()
    .min(
        1,
        "Department cannot be empty."
    )
    .max(
        100,
        "Department cannot exceed 100 characters."
    );

const jobTitleSchema = z
    .string()
    .trim()
    .min(
        1,
        "Job title cannot be empty."
    )
    .max(
        150,
        "Job title cannot exceed 150 characters."
    );

const phoneSchema = z
    .string()
    .trim()
    .min(
        7,
        "Phone number is too short."
    )
    .max(
        30,
        "Phone number is too long."
    );

const notesSchema = z
    .string()
    .trim()
    .max(
        5000,
        "Employee notes cannot exceed 5000 characters."
    );

/*
|--------------------------------------------------------------------------
| Create Employee
|--------------------------------------------------------------------------
*/

export const createEmployeeSchema =
    z.object({
        userId: userIdSchema,

        roleId: roleIdSchema,

        employmentType: z.enum([
            EMPLOYMENT_TYPES.FULL_TIME,
            EMPLOYMENT_TYPES.PART_TIME,
            EMPLOYMENT_TYPES.CONTRACT,
            EMPLOYMENT_TYPES.INTERN,
        ]),

        employeeCode:
            employeeCodeSchema,

        department:
            departmentSchema.optional(),

        jobTitle:
            jobTitleSchema.optional(),

        joiningDate: z
            .coerce
            .date()
            .optional(),

        salary: z
            .number()
            .min(
                0,
                "Salary cannot be negative."
            )
            .optional(),

        emergencyContactName: z
            .string()
            .trim()
            .min(
                1,
                "Emergency contact name cannot be empty."
            )
            .max(
                100,
                "Emergency contact name cannot exceed 100 characters."
            )
            .optional(),

        emergencyContactPhone:
            phoneSchema.optional(),

        notes:
            notesSchema.optional(),
    });

/*
|--------------------------------------------------------------------------
| Update Employee
|--------------------------------------------------------------------------
*/

export const updateEmployeeSchema =
    z
        .object({
            roleId:
                roleIdSchema.optional(),

            employmentType:
                z.enum([
                    EMPLOYMENT_TYPES.FULL_TIME,
                    EMPLOYMENT_TYPES.PART_TIME,
                    EMPLOYMENT_TYPES.CONTRACT,
                    EMPLOYMENT_TYPES.INTERN,
                ]).optional(),

            department:
                departmentSchema.optional(),

            jobTitle:
                jobTitleSchema.optional(),

            joiningDate: z
                .coerce
                .date()
                .optional(),

            leavingDate: z
                .coerce
                .date()
                .optional(),

            salary: z
                .number()
                .min(
                    0,
                    "Salary cannot be negative."
                )
                .optional(),

            emergencyContactName:
                z.string()
                    .trim()
                    .min(
                        1,
                        "Emergency contact name cannot be empty."
                    )
                    .max(
                        100,
                        "Emergency contact name cannot exceed 100 characters."
                    )
                    .optional(),

            emergencyContactPhone:
                phoneSchema.optional(),

            notes:
                notesSchema.optional(),
        })
        .refine(
            (data) =>
                Object.keys(data)
                    .length > 0,
            {
                message:
                    "At least one field is required.",
            }
        );

/*
|--------------------------------------------------------------------------
| Update Own Employee Profile
|--------------------------------------------------------------------------
|
| Role, status, salary, and employment dates remain owner-controlled.
|
|--------------------------------------------------------------------------
*/

export const updateOwnEmployeeSchema =
    z
        .object({
            department:
                departmentSchema.optional(),

            jobTitle:
                jobTitleSchema.optional(),

            emergencyContactName:
                z.string()
                    .trim()
                    .min(
                        1,
                        "Emergency contact name cannot be empty."
                    )
                    .max(
                        100,
                        "Emergency contact name cannot exceed 100 characters."
                    )
                    .optional(),

            emergencyContactPhone:
                phoneSchema.optional(),

            notes:
                notesSchema.optional(),
        })
        .refine(
            (data) =>
                Object.keys(data)
                    .length > 0,
            {
                message:
                    "At least one field is required.",
            }
        );

/*
|--------------------------------------------------------------------------
| Employee Status
|--------------------------------------------------------------------------
*/

export const updateEmployeeStatusSchema =
    z.object({
        status: z.enum([
            EMPLOYEE_STATUSES.ACTIVE,
            EMPLOYEE_STATUSES.INACTIVE,
            EMPLOYEE_STATUSES.SUSPENDED,
            EMPLOYEE_STATUSES.TERMINATED,
        ]),
    });

/*
|--------------------------------------------------------------------------
| Employee ID Params
|--------------------------------------------------------------------------
*/

export const employeeIdParamSchema =
    z.object({
        employeeId:
            employeeIdSchema,
    });

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type CreateEmployeeInput =
    z.infer<
        typeof createEmployeeSchema
    >;

export type UpdateEmployeeInput =
    z.infer<
        typeof updateEmployeeSchema
    >;

export type UpdateOwnEmployeeInput =
    z.infer<
        typeof updateOwnEmployeeSchema
    >;

export type UpdateEmployeeStatusInput =
    z.infer<
        typeof updateEmployeeStatusSchema
    >;

export type EmployeeIdParam =
    z.infer<
        typeof employeeIdParamSchema
    >;