import apiClient from "./client";

import type {
    ApiResponse,
} from "@/types/api";

import type {
    Employee,
    EmployeeListParams,
    UpdateEmployeeInput,
    UpdateEmployeeStatusInput,
} from "@/features/employees/employee.types";

const EMPLOYEE_BASE_PATH = "/employees";

export const employeesApi = {
    async getAll(
        params?: EmployeeListParams,
    ): Promise<Employee[]> {
        const response = await apiClient.get<
            ApiResponse<Employee[]>
        >(EMPLOYEE_BASE_PATH, {
            params,
        });

        return response.data.data;
    },

    async getById(
        employeeId: string,
    ): Promise<Employee> {
        const response = await apiClient.get<
            ApiResponse<Employee>
        >(
            `${EMPLOYEE_BASE_PATH}/${employeeId}`,
        );

        return response.data.data;
    },

    async getMe(): Promise<Employee> {
        const response = await apiClient.get<
            ApiResponse<Employee>
        >(
            `${EMPLOYEE_BASE_PATH}/me`,
        );

        return response.data.data;
    },

    async getByUser(): Promise<Employee> {
        const response = await apiClient.get<
            ApiResponse<Employee>
        >(
            `${EMPLOYEE_BASE_PATH}/me/user`,
        );

        return response.data.data;
    },

    async updateMe(
        input: UpdateEmployeeInput,
    ): Promise<Employee> {
        const response = await apiClient.patch<
            ApiResponse<Employee>
        >(
            `${EMPLOYEE_BASE_PATH}/me`,
            input,
        );

        return response.data.data;
    },

    async update(
        employeeId: string,
        input: UpdateEmployeeInput,
    ): Promise<Employee> {
        const response = await apiClient.patch<
            ApiResponse<Employee>
        >(
            `${EMPLOYEE_BASE_PATH}/${employeeId}`,
            input,
        );

        return response.data.data;
    },

    async updateStatus(
        employeeId: string,
        input: UpdateEmployeeStatusInput,
    ): Promise<Employee> {
        const response = await apiClient.patch<
            ApiResponse<Employee>
        >(
            `${EMPLOYEE_BASE_PATH}/${employeeId}/status`,
            input,
        );

        return response.data.data;
    },

    async remove(
        employeeId: string,
    ): Promise<void> {
        await apiClient.delete<
            ApiResponse<unknown>
        >(
            `${EMPLOYEE_BASE_PATH}/${employeeId}`,
        );
    },

    async delete(
        employeeId: string,
    ): Promise<void> {
        return this.remove(employeeId);
    },
};

export const getAllEmployees =
    employeesApi.getAll;

export const getEmployee =
    employeesApi.getById;

export const getMyEmployee =
    employeesApi.getMe;

export const getEmployeeByUser =
    employeesApi.getByUser;

export const updateMyEmployee =
    employeesApi.updateMe;

export const updateEmployee =
    employeesApi.update;

export const updateEmployeeStatus =
    employeesApi.updateStatus;

export const removeEmployee =
    employeesApi.remove;

export const deleteEmployee =
    employeesApi.delete;

export default employeesApi;
