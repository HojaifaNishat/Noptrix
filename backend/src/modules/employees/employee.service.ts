import { Types } from "mongoose";

import { User } from "../users/user.model";

import { Role } from "../roles/role.model";

import {
    Employee,
    EMPLOYEE_STATUSES,
    type EmployeeStatus,
} from "./employee.model";

import type {
    CreateEmployeeInput,
    UpdateEmployeeInput,
} from "./employee.validator";

import { ApiError } from "../../utils/ApiError";

/*
|--------------------------------------------------------------------------
| ObjectId Validation
|--------------------------------------------------------------------------
*/

const validateObjectId = (
    value: string,
    fieldName: string
): Types.ObjectId => {
    if (!Types.ObjectId.isValid(value)) {
        throw ApiError.badRequest(
            `Invalid ${fieldName}.`,
            {
                code: "INVALID_OBJECT_ID",
            }
        );
    }

    return new Types.ObjectId(value);
};

/*
|--------------------------------------------------------------------------
| Get Employee By ID
|--------------------------------------------------------------------------
*/

export const getEmployeeById = async (
    employeeId: string
) => {
    const _id = validateObjectId(
        employeeId,
        "employee ID"
    );

    const employee =
        await Employee.findById(_id)
            .populate(
                "roleId",
                "name slug description status isSystemRole"
            )
            .populate(
                "userId",
                "name email phone status"
            );

    if (!employee) {
        throw ApiError.notFound(
            "Employee not found.",
            {
                code: "EMPLOYEE_NOT_FOUND",
            }
        );
    }

    return employee;
};

/*
|--------------------------------------------------------------------------
| Get Employee By User ID
|--------------------------------------------------------------------------
*/

export const getEmployeeByUserId =
    async (
        userId: string
    ) => {
        const _userId =
            validateObjectId(
                userId,
                "user ID"
            );

        return Employee.findOne({
            userId: _userId,
        })
            .populate(
                "roleId",
                "name slug description status isSystemRole"
            )
            .populate(
                "userId",
                "name email phone status"
            );
    };

/*
|--------------------------------------------------------------------------
| Require Employee By User ID
|--------------------------------------------------------------------------
*/

export const requireEmployeeByUserId =
    async (
        userId: string
    ) => {
        const employee =
            await getEmployeeByUserId(
                userId
            );

        if (!employee) {
            throw ApiError.notFound(
                "Employee profile not found.",
                {
                    code:
                        "EMPLOYEE_NOT_FOUND",
                }
            );
        }

        return employee;
    };

/*
|--------------------------------------------------------------------------
| Get All Employees
|--------------------------------------------------------------------------
*/

export const getAllEmployees = async () => {
    return Employee.find()
        .populate(
            "roleId",
            "name slug description status isSystemRole"
        )
        .populate(
            "userId",
            "name email phone status"
        )
        .sort({
            createdAt: -1,
        });
};

/*
|--------------------------------------------------------------------------
| Create Employee
|--------------------------------------------------------------------------
*/

export const createEmployee = async (
    input: CreateEmployeeInput
) => {
    const userId =
        validateObjectId(
            input.userId,
            "user ID"
        );

    const roleId =
        validateObjectId(
            input.roleId,
            "role ID"
        );

    /*
     * User must exist.
     */
    const user =
        await User.findById(userId);

    if (!user) {
        throw ApiError.notFound(
            "User not found.",
            {
                code: "USER_NOT_FOUND",
            }
        );
    }

    /*
     * One User can have
     * only one Employee profile.
     */
    const existingEmployee =
        await Employee.findOne({
            userId,
        });

    if (existingEmployee) {
        throw ApiError.conflict(
            "Employee profile already exists for this user.",
            {
                code:
                    "EMPLOYEE_ALREADY_EXISTS",
            }
        );
    }

    /*
     * Role must exist and be active.
     */
    const role =
        await Role.findById(roleId);

    if (!role) {
        throw ApiError.notFound(
            "Role not found.",
            {
                code: "ROLE_NOT_FOUND",
            }
        );
    }

    if (
        role.status !== "ACTIVE"
    ) {
        throw ApiError.badRequest(
            "Cannot assign an inactive role to an employee.",
            {
                code:
                    "ROLE_INACTIVE",
            }
        );
    }

    /*
     * Employee code must be unique.
     */
    const existingCode =
        await Employee.findOne({
            employeeCode:
                input.employeeCode
                    .trim()
                    .toUpperCase(),
        });

    if (existingCode) {
        throw ApiError.conflict(
            "Employee code already exists.",
            {
                code:
                    "EMPLOYEE_CODE_EXISTS",
            }
        );
    }

    return Employee.create({
        userId,
        roleId,
        status:
            EMPLOYEE_STATUSES.ACTIVE,
        employmentType:
            input.employmentType,
        employeeCode:
            input.employeeCode
                .trim()
                .toUpperCase(),
        department:
            input.department,
        jobTitle:
            input.jobTitle,
        joiningDate:
            input.joiningDate,
        salary:
            input.salary,
        emergencyContactName:
            input.emergencyContactName,
        emergencyContactPhone:
            input.emergencyContactPhone,
        notes:
            input.notes,
    });
};

/*
|--------------------------------------------------------------------------
| Update Employee
|--------------------------------------------------------------------------
*/

export const updateEmployee = async (
    employeeId: string,
    input: UpdateEmployeeInput
) => {
    const _id =
        validateObjectId(
            employeeId,
            "employee ID"
        );

    const employee =
        await Employee.findById(_id);

    if (!employee) {
        throw ApiError.notFound(
            "Employee not found.",
            {
                code:
                    "EMPLOYEE_NOT_FOUND",
            }
        );
    }

    /*
     * Role change requires role
     * existence + active status.
     */
    if (
        input.roleId !== undefined
    ) {
        const roleId =
            validateObjectId(
                input.roleId,
                "role ID"
            );

        const role =
            await Role.findById(
                roleId
            );

        if (!role) {
            throw ApiError.notFound(
                "Role not found.",
                {
                    code:
                        "ROLE_NOT_FOUND",
                }
            );
        }

        if (
            role.status !==
            "ACTIVE"
        ) {
            throw ApiError.badRequest(
                "Cannot assign an inactive role to an employee.",
                {
                    code:
                        "ROLE_INACTIVE",
                }
            );
        }

        employee.roleId =
            roleId;
    }

    if (
        input.employmentType !==
        undefined
    ) {
        employee.employmentType =
            input.employmentType;
    }

    if (
        input.department !==
        undefined
    ) {
        employee.department =
            input.department;
    }

    if (
        input.jobTitle !==
        undefined
    ) {
        employee.jobTitle =
            input.jobTitle;
    }

    if (
        input.joiningDate !==
        undefined
    ) {
        employee.joiningDate =
            input.joiningDate;
    }

    if (
        input.leavingDate !==
        undefined
    ) {
        employee.leavingDate =
            input.leavingDate;
    }

    if (
        input.salary !==
        undefined
    ) {
        employee.salary =
            input.salary;
    }

    if (
        input.emergencyContactName !==
        undefined
    ) {
        employee.emergencyContactName =
            input.emergencyContactName;
    }

    if (
        input.emergencyContactPhone !==
        undefined
    ) {
        employee.emergencyContactPhone =
            input.emergencyContactPhone;
    }

    if (
        input.notes !==
        undefined
    ) {
        employee.notes =
            input.notes;
    }

    await employee.save();

    return employee;
};

/*
|--------------------------------------------------------------------------
| Update Employee Status
|--------------------------------------------------------------------------
*/

export const updateEmployeeStatus =
    async (
        employeeId: string,
        status: EmployeeStatus
    ) => {
        const _id =
            validateObjectId(
                employeeId,
                "employee ID"
            );

        const employee =
            await Employee.findById(
                _id
            );

        if (!employee) {
            throw ApiError.notFound(
                "Employee not found.",
                {
                    code:
                        "EMPLOYEE_NOT_FOUND",
                }
            );
        }

        employee.status =
            status;

        /*
         * Automatically record
         * leaving date when employee
         * becomes terminated.
         */
        if (
            status ===
            EMPLOYEE_STATUSES.TERMINATED
        ) {
            employee.leavingDate =
                employee.leavingDate ??
                new Date();
        }

        await employee.save();

        return employee;
    };

/*
|--------------------------------------------------------------------------
| Activate Employee
|--------------------------------------------------------------------------
*/

export const activateEmployee =
    async (
        employeeId: string
    ) => {
        return updateEmployeeStatus(
            employeeId,
            EMPLOYEE_STATUSES.ACTIVE
        );
    };

/*
|--------------------------------------------------------------------------
| Deactivate Employee
|--------------------------------------------------------------------------
*/

export const deactivateEmployee =
    async (
        employeeId: string
    ) => {
        return updateEmployeeStatus(
            employeeId,
            EMPLOYEE_STATUSES.INACTIVE
        );
    };

/*
|--------------------------------------------------------------------------
| Suspend Employee
|--------------------------------------------------------------------------
*/

export const suspendEmployee =
    async (
        employeeId: string
    ) => {
        return updateEmployeeStatus(
            employeeId,
            EMPLOYEE_STATUSES.SUSPENDED
        );
    };

/*
|--------------------------------------------------------------------------
| Terminate Employee
|--------------------------------------------------------------------------
*/

export const terminateEmployee =
    async (
        employeeId: string
    ) => {
        return updateEmployeeStatus(
            employeeId,
            EMPLOYEE_STATUSES.TERMINATED
        );
    };

/*
|--------------------------------------------------------------------------
| Delete Employee
|--------------------------------------------------------------------------
*/

export const deleteEmployee = async (
    employeeId: string
) => {
    const _id =
        validateObjectId(
            employeeId,
            "employee ID"
        );

    const employee =
        await Employee.findById(_id);

    if (!employee) {
        throw ApiError.notFound(
            "Employee not found.",
            {
                code:
                    "EMPLOYEE_NOT_FOUND",
            }
        );
    }

    await Employee.deleteOne({
        _id,
    });

    return employee;
};