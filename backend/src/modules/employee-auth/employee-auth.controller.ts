import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { getAuthenticatedAdminId } from "../../middlewares/adminAuth.middleware";
import {
  loginEmployee,
  logoutEmployee,
  refreshEmployeeAccessToken,
} from "./employee-auth.service";

const EMPLOYEE_REFRESH_COOKIE = "noptrix_employee_rt";
const EMPLOYEE_REFRESH_COOKIE_PATH = "/api/employee-auth";

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
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

    const refreshToken = result.tokens.refreshToken;

    if (!refreshToken) {
      throw ApiError.internal("Employee refresh token was not generated.", {
        code: "EMPLOYEE_REFRESH_TOKEN_MISSING",
      });
    }

    setRefreshCookie(res, refreshToken);

    const { refreshToken: _refreshToken, ...tokens } = result.tokens;

    res.status(200).json({
      success: true,
      message: "Employee login successful.",
      data: {
        ...result,
        tokens,
      },
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

    const { refreshToken: _refreshToken, ...safeResult } = result;

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
