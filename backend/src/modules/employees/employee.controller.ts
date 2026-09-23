import {
    Request,
    Response,
} from "express";

import {
    asyncHandler,
} from "../../utils/asyncHandler";

import {
    ApiError,
} from "../../utils/ApiError";

import {
    getAuthenticatedUserId,
} from "../../middlewares/userAuth.middleware";

import {
    getEmployeeById,
    getEmployeeByUserId,
    requireEmployeeByUserId,
    getAllEmployees,
    createEmployee,
    updateEmployee,
    updateEmployeeStatus,
    deleteEmployee,
} from "./employee.service";

import type {
    CreateEmployeeInput,
    UpdateEmployeeInput,
    UpdateOwnEmployeeInput,
    UpdateEmployeeStatusInput,
    EmployeeIdParam,
} from "./employee.validator";

/*
|--------------------------------------------------------------------------
| Sanitize Employee
|--------------------------------------------------------------------------
*/

const sanitizeEmployee = (
    employee: any
) => {
    const employeeObject =
        typeof employee.toObject ===
        "function"
            ? employee.toObject()
            : { ...employee };

    return employeeObject;
};

/*
|--------------------------------------------------------------------------
| Create Employee
|--------------------------------------------------------------------------
*/

export const createEmployeeController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {
            const input =
                req.body as CreateEmployeeInput;

            const employee =
                await createEmployee(
                    input
                );

            res.status(201).json({
                success: true,
                message:
                    "Employee created successfully.",
                data: sanitizeEmployee(
                    employee
                ),
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Get All Employees
|--------------------------------------------------------------------------
*/

export const getAllEmployeesController =
    asyncHandler(
        async (
            _req: Request,
            res: Response
        ) => {
            const employees =
                await getAllEmployees();

            res.status(200).json({
                success: true,
                message:
                    "Employees retrieved successfully.",
                data: employees.map(
                    sanitizeEmployee
                ),
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Get My Employee Profile
|--------------------------------------------------------------------------
*/

export const getMyEmployeeController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {
            const userId =
                getAuthenticatedUserId(
                    req
                );

            const employee =
                await requireEmployeeByUserId(
                    userId
                );

            res.status(200).json({
                success: true,
                message:
                    "Employee profile retrieved successfully.",
                data: sanitizeEmployee(
                    employee
                ),
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Get Employee By User ID
|--------------------------------------------------------------------------
*/

export const getEmployeeByUserController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {
            const userId =
                getAuthenticatedUserId(
                    req
                );

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

            res.status(200).json({
                success: true,
                message:
                    "Employee retrieved successfully.",
                data: sanitizeEmployee(
                    employee
                ),
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Get Employee By ID
|--------------------------------------------------------------------------
*/

export const getEmployeeController =
    asyncHandler(
        async (
            req: Request<
                EmployeeIdParam
            >,
            res: Response
        ) => {
            const {
                employeeId,
            } = req.params;

            const employee =
                await getEmployeeById(
                    employeeId
                );

            res.status(200).json({
                success: true,
                message:
                    "Employee retrieved successfully.",
                data: sanitizeEmployee(
                    employee
                ),
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Update My Employee Profile
|--------------------------------------------------------------------------
*/

export const updateMyEmployeeController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {
            const userId =
                getAuthenticatedUserId(
                    req
                );

            const employee =
                await requireEmployeeByUserId(
                    userId
                );

            const input =
                req.body as UpdateOwnEmployeeInput;

            const updatedEmployee =
                await updateEmployee(
                    employee._id.toString(),
                    input
                );

            res.status(200).json({
                success: true,
                message:
                    "Employee profile updated successfully.",
                data: sanitizeEmployee(
                    updatedEmployee
                ),
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Update Employee
|--------------------------------------------------------------------------
*/

export const updateEmployeeController =
    asyncHandler(
        async (
            req: Request<
                EmployeeIdParam
            >,
            res: Response
        ) => {
            const {
                employeeId,
            } = req.params;

            const input =
                req.body as UpdateEmployeeInput;

            const employee =
                await updateEmployee(
                    employeeId,
                    input
                );

            res.status(200).json({
                success: true,
                message:
                    "Employee updated successfully.",
                data: sanitizeEmployee(
                    employee
                ),
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Update Employee Status
|--------------------------------------------------------------------------
*/

export const updateEmployeeStatusController =
    asyncHandler(
        async (
            req: Request<
                EmployeeIdParam,
                unknown,
                UpdateEmployeeStatusInput
            >,
            res: Response
        ) => {
            const {
                employeeId,
            } = req.params;

            const {
                status,
            } = req.body;

            const employee =
                await updateEmployeeStatus(
                    employeeId,
                    status
                );

            res.status(200).json({
                success: true,
                message:
                    "Employee status updated successfully.",
                data: sanitizeEmployee(
                    employee
                ),
            });
        }
    );

/*
|--------------------------------------------------------------------------
| Delete Employee
|--------------------------------------------------------------------------
*/

export const deleteEmployeeController =
    asyncHandler(
        async (
            req: Request<
                EmployeeIdParam
            >,
            res: Response
        ) => {
            const {
                employeeId,
            } = req.params;

            await deleteEmployee(
                employeeId
            );

            res.status(200).json({
                success: true,
                message:
                    "Employee deleted successfully.",
            });
        }
    );