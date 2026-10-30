import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { getAuthenticatedAdminId } from "../../middlewares/adminAuth.middleware";
import {
  loginEmployee,
  logoutEmployee,
  resendEmployeeLoginCode,
  refreshEmployeeAccessToken,
  verifyEmployeeLogin,
  type EmployeeAuthenticationResult,
} from "./employee-auth.service";
import {
  employeeLoginVerificationSchema,
  resendEmployeeLoginVerificationSchema,
} from "./employee-auth.validator";
import { env } from "../../config/env";

const EMPLOYEE_REFRESH_COOKIE = "noptrix_employee_rt";
const EMPLOYEE_REFRESH_COOKIE_PATH = "/api/employee-auth";

const getCookieOptions = () => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: "strict" as const,
  path: EMPLOYEE_REFRESH_COOKIE_PATH,
});

const setRefreshCookie = (res: Response, token: string): void => {
  res.cookie(EMPLOYEE_REFRESH_COOKIE, token, {
    ...getCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearRefreshCookie = (res: Response): void => {
  res.clearCookie(EMPLOYEE_REFRESH_COOKIE, getCookieOptions());
};

const getSessionId = (req: Request): string => {
  const sessionId = req.adminAuth?.claims?.sessionId;

  if (typeof sessionId !== "string" || !sessionId.trim()) {
    throw ApiError.unauthorized("Employee session information is missing.", {
      code: "EMPLOYEE_SESSION_ID_MISSING",
    });
  }

  return sessionId.trim();
};

const sendEmployeeLoginSuccess = (
  res: Response,
  result: EmployeeAuthenticationResult,
): void => {
  const refreshToken = result.tokens.refreshToken;

  if (!refreshToken) {
    throw ApiError.internal("Employee refresh token was not generated.", {
      code: "EMPLOYEE_REFRESH_TOKEN_MISSING",
    });
  }

  setRefreshCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    message: "Employee login successful.",
    data: {
      ...result,
      tokens: {
        accessToken: result.tokens.accessToken,
      },
    },
  });
};

export const loginEmployeeController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await loginEmployee(
      {
        email: req.body.email,
        password: req.body.password,
      },
      {
        userAgent: req.get("user-agent"),
        ipAddress: req.ip,
        deviceId:
          typeof req.body.deviceId === "string" ? req.body.deviceId : undefined,
      },
    );

    if ("verificationRequired" in result) {
      res.status(200).json({
        success: true,
        message: "A login verification code was sent to your email.",
        data: result,
      });
      return;
    }

    sendEmployeeLoginSuccess(res, result);
  },
);

export const verifyEmployeeLoginController = asyncHandler(
  async (req: Request, res: Response) => {
    const input = employeeLoginVerificationSchema.parse(req.body);
    const result = await verifyEmployeeLogin(input.challengeId, input.code, {
      userAgent: req.get("user-agent"),
      ipAddress: req.ip,
      deviceId:
        typeof req.body.deviceId === "string" ? req.body.deviceId : undefined,
    });

    sendEmployeeLoginSuccess(res, result);
  },
);

export const resendEmployeeLoginCodeController = asyncHandler(
  async (req: Request, res: Response) => {
    const { challengeId } = resendEmployeeLoginVerificationSchema.parse(
      req.body,
    );
    const result = await resendEmployeeLoginCode(challengeId);

    res.status(200).json({
      success: true,
      message: "A new login verification code was sent.",
      data: result,
    });
  },
);

export const refreshEmployeeTokenController = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[EMPLOYEE_REFRESH_COOKIE];

    if (typeof refreshToken !== "string" || !refreshToken.trim()) {
      throw ApiError.unauthorized("Employee refresh session is missing.", {
        code: "EMPLOYEE_REFRESH_COOKIE_MISSING",
      });
    }

    const result = await refreshEmployeeAccessToken(refreshToken);

    setRefreshCookie(res, result.refreshToken);

    const safeResult = { ...result, refreshToken: undefined };

    res.status(200).json({
      success: true,
      message: "Employee access token refreshed successfully.",
      data: safeResult,
    });
  },
);

export const logoutEmployeeController = asyncHandler(
  async (req: Request, res: Response) => {
    await logoutEmployee(getAuthenticatedAdminId(req), getSessionId(req));

    clearRefreshCookie(res);

    res.status(200).json({
      success: true,
      message: "Employee logout successful.",
    });
  },
);
