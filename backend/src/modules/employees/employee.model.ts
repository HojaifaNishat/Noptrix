import {
    Document,
    Model,
    Schema,
    Types,
    model,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| Employee Status
|--------------------------------------------------------------------------
*/

export const EMPLOYEE_STATUSES = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    SUSPENDED: "SUSPENDED",
    TERMINATED: "TERMINATED",
} as const;

export type EmployeeStatus =
    typeof EMPLOYEE_STATUSES[
        keyof typeof EMPLOYEE_STATUSES
    ];

/*
|--------------------------------------------------------------------------
| Employment Types
|--------------------------------------------------------------------------
*/

export const EMPLOYMENT_TYPES = {
    FULL_TIME: "FULL_TIME",
    PART_TIME: "PART_TIME",
    CONTRACT: "CONTRACT",
    INTERN: "INTERN",
} as const;

export type EmploymentType =
    typeof EMPLOYMENT_TYPES[
        keyof typeof EMPLOYMENT_TYPES
    ];

/*
|--------------------------------------------------------------------------
| Employee Interface
|--------------------------------------------------------------------------
*/

export interface IEmployee {
    _id: Types.ObjectId;

    /**
     * Core account identity.
     *
     * User module owns:
     * - name
     * - email
     * - phone
     * - password
     * - authentication
     */
    userId: Types.ObjectId;

    /**
     * Employee's assigned system role.
     *
     * Role itself is owned by the Roles module.
     * Permissions are resolved through:
     *
     * Employee → Role → RolePermission → Permission
     */
    roleId: Types.ObjectId;

    status: EmployeeStatus;

    employmentType: EmploymentType;

    employeeCode: string;

    department?: string;

    jobTitle?: string;

    joiningDate?: Date;

    leavingDate?: Date;

    salary?: number;

    emergencyContactName?: string;

    emergencyContactPhone?: string;

    notes?: string;

    createdAt: Date;

    updatedAt: Date;
}

export interface IEmployeeDocument
    extends IEmployee,
        Document {}

export type EmployeeModel =
    Model<IEmployeeDocument>;

/*
|--------------------------------------------------------------------------
| Employee Schema
|--------------------------------------------------------------------------
*/

const employeeSchema =
    new Schema<IEmployeeDocument>(
        {
            userId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: [
                    true,
                    "User ID is required.",
                ],
                unique: true,
                index: true,
            },

            roleId: {
                type: Schema.Types.ObjectId,
                ref: "Role",
                required: [
                    true,
                    "Employee role is required.",
                ],
                index: true,
            },

            status: {
                type: String,
                enum: {
                    values: Object.values(
                        EMPLOYEE_STATUSES
                    ),
                    message:
                        "Invalid employee status.",
                },
                default:
                    EMPLOYEE_STATUSES.ACTIVE,
                index: true,
            },

            employmentType: {
                type: String,
                enum: {
                    values: Object.values(
                        EMPLOYMENT_TYPES
                    ),
                    message:
                        "Invalid employment type.",
                },
                required: [
                    true,
                    "Employment type is required.",
                ],
                index: true,
            },

            employeeCode: {
                type: String,
                required: [
                    true,
                    "Employee code is required.",
                ],
                trim: true,
                uppercase: true,
                unique: true,
                index: true,
                maxlength: [
                    50,
                    "Employee code cannot exceed 50 characters.",
                ],
            },

            department: {
                type: String,
                trim: true,
                maxlength: [
                    100,
                    "Department cannot exceed 100 characters.",
                ],
            },

            jobTitle: {
                type: String,
                trim: true,
                maxlength: [
                    150,
                    "Job title cannot exceed 150 characters.",
                ],
            },

            joiningDate: {
                type: Date,
            },

            leavingDate: {
                type: Date,
            },

            salary: {
                type: Number,
                min: [
                    0,
                    "Salary cannot be negative.",
                ],
            },

            emergencyContactName: {
                type: String,
                trim: true,
                maxlength: [
                    100,
                    "Emergency contact name cannot exceed 100 characters.",
                ],
            },

            emergencyContactPhone: {
                type: String,
                trim: true,
                maxlength: [
                    30,
                    "Emergency contact phone cannot exceed 30 characters.",
                ],
            },

            notes: {
                type: String,
                trim: true,
                maxlength: [
                    5000,
                    "Employee notes cannot exceed 5000 characters.",
                ],
            },
        },
        {
            timestamps: true,
            versionKey: false,
        }
    );

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

employeeSchema.index(
    {
        status: 1,
        createdAt: -1,
    },
    {
        name: "employee_status_createdAt",
    }
);

employeeSchema.index(
    {
        roleId: 1,
        status: 1,
    },
    {
        name: "employee_role_status",
    }
);

employeeSchema.index(
    {
        department: 1,
        status: 1,
    },
    {
        name: "employee_department_status",
    }
);

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

export const Employee =
    model<
        IEmployeeDocument,
        EmployeeModel
    >(
        "Employee",
        employeeSchema
    );