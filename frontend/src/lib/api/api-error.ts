import { isAxiosError } from "axios";
import type { ApiErrorResponse } from "@/types/api";

export interface ApiErrorDetails {
  readonly message: string;
  readonly code?: string;
  readonly status?: number;
  readonly errors?: unknown;
}

const isRecord = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value);

const getStatusMessage = (status: number): string => {
  switch (status) {
    case 400:
      return "The request contains invalid data.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "The request conflicts with the current server state.";
    case 422:
      return "The submitted data could not be processed.";
    case 429:
      return "Too many requests. Please try again later.";
    default:
      return status >= 500
        ? "A server error occurred. Please try again later."
        : "The request could not be completed.";
  }
};

export const getApiErrorDetails = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): ApiErrorDetails => {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data: unknown = error.response?.data;

    const payload = isRecord(data)
      ? (data as unknown as ApiErrorResponse)
      : undefined;

    const message =
      typeof payload?.message === "string" &&
      payload.message.trim().length > 0
        ? payload.message.trim()
        : status !== undefined
          ? getStatusMessage(status)
          : error.request
            ? "Unable to connect to the server. Check your connection and try again."
            : fallback;

    return {
      message,
      ...(typeof payload?.code === "string"
        ? { code: payload.code }
        : {}),
      ...(status !== undefined ? { status } : {}),
      ...(payload?.errors !== undefined
        ? { errors: payload.errors }
        : {}),
    };
  }

  if (error instanceof Error && error.message.trim()) {
    return { message: error.message };
  }

  return { message: fallback };
};

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string => getApiErrorDetails(error, fallback).message;

export const getApiErrorCode = (
  error: unknown,
): string | undefined => getApiErrorDetails(error).code;
