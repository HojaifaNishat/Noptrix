import { Employee, EMPLOYEE_STATUSES } from "../employees/employee.model";
import { User } from "../users/user.model";
import {
  loginAdmin,
  logoutAdmin,
  refreshAdminAccessToken,
} from "../admin-auth/admin-auth.service";
import { ApiError } from "../../utils/ApiError";
import type {
  AdminAuthenticationResult,
  AdminRefreshResult,
} from "../admin-auth/admin-auth.types";
import type { EmployeeLoginInput } from "./employee-auth.validator";

type EmployeeAuthUser = Omit<
  AdminAuthenticationResult["user"],
  "accountType"
> & {
  readonly accountType: "EMPLOYEE";
};

export type EmployeeAuthenticationResult = Omit<
  AdminAuthenticationResult,
  "user"
> & {
  readonly user: EmployeeAuthUser;
};

export type EmployeeRefreshResult = Omit<AdminRefreshResult, "user"> & {
  readonly user: EmployeeAuthUser;
};

const toEmployeeResult = <
  T extends {
    readonly user: AdminAuthenticationResult["user"];
  },
>(
  result: T,
): Omit<T, "user"> & { readonly user: EmployeeAuthUser } => ({
  ...result,
  user: {
    ...result.user,
    accountType: "EMPLOYEE",
  },
});

const requireActiveEmployee = async (userId: string): Promise<void> => {
  const employee = await Employee.findOne({ userId }).select("status").exec();

  if (!employee) {
    throw ApiError.unauthorized("Invalid employee email or password.", {
      code: "INVALID_EMPLOYEE_CREDENTIALS",
    });
  }

  if (employee.status !== EMPLOYEE_STATUSES.ACTIVE) {
    throw ApiError.forbidden(
      `Employee account is ${employee.status.toLowerCase()}.`,
      {
        code: "EMPLOYEE_ACCOUNT_INACTIVE",
        details: {
          status: employee.status,
        },
      },
    );
  }
};

export const loginEmployee = async (
  input: EmployeeLoginInput,
  metadata?: {
    readonly userAgent?: string;
    readonly ipAddress?: string;
    readonly deviceId?: string;
  },
): Promise<EmployeeAuthenticationResult> => {
  const email = input.email.trim().toLowerCase();
  const user = await User.findOne({ email }).select("_id").exec();

  if (!user) {
    throw ApiError.unauthorized("Invalid employee email or password.", {
      code: "INVALID_EMPLOYEE_CREDENTIALS",
    });
  }

  await requireActiveEmployee(user._id.toString());

  let result: AdminAuthenticationResult;

  try {
    result = await loginAdmin(input, {
      ...metadata,
      allowEmployee: true,
    });
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.code === "INVALID_ADMIN_CREDENTIALS"
    ) {
      throw ApiError.unauthorized("Invalid employee email or password.", {
        code: "INVALID_EMPLOYEE_CREDENTIALS",
      });
    }

    throw error;
  }

  return toEmployeeResult(result);
};

export const refreshEmployeeAccessToken = async (
  refreshToken: string,
): Promise<EmployeeRefreshResult> => {
  const result = await refreshAdminAccessToken(refreshToken);

  await requireActiveEmployee(result.userId);

  return toEmployeeResult(result);
};

export const logoutEmployee = async (
  adminId: string,
  sessionId: string,
): Promise<void> => {
  await logoutAdmin(adminId, sessionId);
};
