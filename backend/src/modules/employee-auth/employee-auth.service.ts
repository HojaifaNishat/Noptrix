import { Employee, EMPLOYEE_STATUSES } from "../employees/employee.model";
import { User } from "../users/user.model";
import {
  loginAdmin,
  logoutAdmin,
  resendAdminLoginCode,
  refreshAdminAccessToken,
  verifyAdminLogin,
} from "../admin-auth/admin-auth.service";
import { ApiError } from "../../utils/ApiError";
import type {
  AdminAuthenticationResult,
  AdminLoginResult,
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

export type EmployeeLoginResult =
  | EmployeeAuthenticationResult
  | Extract<AdminLoginResult, { readonly verificationRequired: true }>;

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

const isLoginVerificationChallenge = (
  result: AdminLoginResult,
): result is Extract<AdminLoginResult, { readonly verificationRequired: true }> =>
  "verificationRequired" in result;

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
): Promise<EmployeeLoginResult> => {
  const email = input.email.trim().toLowerCase();
  const user = await User.findOne({ email }).select("_id").exec();

  if (!user) {
    throw ApiError.unauthorized("Invalid employee email or password.", {
      code: "INVALID_EMPLOYEE_CREDENTIALS",
    });
  }

  await requireActiveEmployee(user._id.toString());

  let result: AdminLoginResult;

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

  return isLoginVerificationChallenge(result) ? result : toEmployeeResult(result);
};

export const verifyEmployeeLogin = async (
  challengeId: string,
  code: string,
  metadata?: {
    readonly userAgent?: string;
    readonly ipAddress?: string;
    readonly deviceId?: string;
  },
): Promise<EmployeeAuthenticationResult> => {
  const result = await verifyAdminLogin(challengeId, code, {
    ...metadata,
    allowEmployee: true,
    requireEmployee: true,
  });

  return toEmployeeResult(result);
};

export const resendEmployeeLoginCode = async (challengeId: string) =>
  resendAdminLoginCode(challengeId);

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
