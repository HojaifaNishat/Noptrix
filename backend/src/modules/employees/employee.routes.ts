import { Router } from "express";

import {
    userAuth,
} from "../../middlewares/userAuth.middleware";

import {
    adminAuth,
    adminSecretVerified,
} from "../../middlewares/adminAuth.middleware";

import {
    requireEmployeePermission,
} from "./employee-authorization.middleware";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    getAllEmployeesController,
    getMyEmployeeController,
    getEmployeeByUserController,
    getEmployeeController,
    updateMyEmployeeController,
    updateEmployeeController,
    updateEmployeeStatusController,
    deleteEmployeeController,
} from "./employee.controller";

import {
    updateEmployeeSchema,
    updateOwnEmployeeSchema,
    updateEmployeeStatusSchema,
    employeeIdParamSchema,
} from "./employee.validator";

const router = Router();

/*
|--------------------------------------------------------------------------
| Create Employee
|--------------------------------------------------------------------------
|
| POST /api/employees
|
| Admin-only employee management.
|
*/

/*
|--------------------------------------------------------------------------
| Get All Employees
|--------------------------------------------------------------------------
|
| GET /api/employees
|
| Admin-only employee management.
|
*/

router.get(
    "/",
    adminAuth,
    adminSecretVerified,
    requireEmployeePermission(
        "employees.read"
    ),
    getAllEmployeesController
);

/*
|--------------------------------------------------------------------------
| Get My Employee Profile
|--------------------------------------------------------------------------
|
| GET /api/employees/me
|
| Employee can access their own profile.
|
*/

router.get(
    "/me",
    userAuth,
    getMyEmployeeController
);

/*
|--------------------------------------------------------------------------
| Get My Employee By User
|--------------------------------------------------------------------------
|
| GET /api/employees/me/user
|
| Employee can access their own employee
| record through the authenticated user.
|
*/

router.get(
    "/me/user",
    userAuth,
    getEmployeeByUserController
);

/*
|--------------------------------------------------------------------------
| Update My Employee Profile
|--------------------------------------------------------------------------
|
| PATCH /api/employees/me
|
| Employee can update their own profile.
|
*/

router.patch(
    "/me",
    userAuth,
    validate(
        updateOwnEmployeeSchema,
        "body"
    ),
    updateMyEmployeeController
);

/*
|--------------------------------------------------------------------------
| Get Employee By ID
|--------------------------------------------------------------------------
|
| GET /api/employees/:employeeId
|
| Admin-only employee management.
|
*/

router.get(
    "/:employeeId",
    adminAuth,
    adminSecretVerified,
    requireEmployeePermission(
        "employees.read"
    ),
    validate(
        employeeIdParamSchema,
        "params"
    ),
    getEmployeeController
);

/*
|--------------------------------------------------------------------------
| Update Employee
|--------------------------------------------------------------------------
|
| PATCH /api/employees/:employeeId
|
| Admin-only employee management.
|
*/

router.patch(
    "/:employeeId",
    adminAuth,
    adminSecretVerified,
    requireEmployeePermission(
        "employees.update"
    ),
    validate(
        employeeIdParamSchema,
        "params"
    ),
    validate(
        updateEmployeeSchema,
        "body"
    ),
    updateEmployeeController
);

/*
|--------------------------------------------------------------------------
| Update Employee Status
|--------------------------------------------------------------------------
|
| PATCH /api/employees/:employeeId/status
|
| Admin-only employee management.
|
*/

router.patch(
    "/:employeeId/status",
    adminAuth,
    adminSecretVerified,
    requireEmployeePermission(
        "employees.update"
    ),
    validate(
        employeeIdParamSchema,
        "params"
    ),
    validate(
        updateEmployeeStatusSchema,
        "body"
    ),
    updateEmployeeStatusController
);

/*
|--------------------------------------------------------------------------
| Delete Employee
|--------------------------------------------------------------------------
|
| DELETE /api/employees/:employeeId
|
| Admin-only employee management.
|
*/

router.delete(
    "/:employeeId",
    adminAuth,
    adminSecretVerified,
    requireEmployeePermission(
        "employees.delete"
    ),
    validate(
        employeeIdParamSchema,
        "params"
    ),
    deleteEmployeeController
);

export default router;