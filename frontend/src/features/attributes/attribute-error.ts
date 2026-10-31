export function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (error as {
      response?: {
        data?: {
          message?: unknown;
          errors?: unknown;
        };
      };
    }).response;

    const message = response?.data?.message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    const errors = response?.data?.errors;

    if (Array.isArray(errors)) {
      return errors
        .map((item) =>
          typeof item === "string"
            ? item
            : typeof item === "object" && item !== null && "message" in item
              ? String(item.message)
              : "",
        )
        .filter(Boolean)
        .join(", ");
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
