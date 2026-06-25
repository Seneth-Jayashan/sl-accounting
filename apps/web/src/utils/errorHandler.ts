/**
 * API Error Response Type
 * Matches the backend error response format
 */

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
}

/**
 * Typed Axios Error with backend response
 */
export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
  raw: any;
}

/**
 * Parse error response from backend
 * Extracts user-friendly message and error code
 */
export const parseApiError = (error: any): ApiError => {
  // Network error
  if (!error.response) {
    return {
      status: 0,
      code: "NETWORK_ERROR",
      message:
        "Unable to connect to server. Please check your internet connection.",
      raw: error,
    };
  }

  const response = error.response;
  const data = response.data as ApiErrorResponse;

  // Handle different response formats
  if (data?.success === false && data?.message) {
    return {
      status: response.status,
      code: data.code || "UNKNOWN_ERROR",
      message: data.message,
      details: data.details,
      raw: error,
    };
  }

  // Fallback for unstructured errors
  return {
    status: response.status,
    code: `HTTP_${response.status}`,
    message:
      data?.message || `Error: ${response.statusText || "Request failed"}`,
    raw: error,
  };
};

/**
 * Get user-friendly error message
 * Handles different error types
 */
export const getErrorMessage = (error: any): string => {
  const parsed = parseApiError(error);

  // Map specific error codes to custom messages if needed
  const errorCodeMessages: Record<string, string> = {
    NETWORK_ERROR:
      "Unable to connect to server. Please check your internet connection.",
    TOKEN_EXPIRED: "Your session has expired. Please log in again.",
    INVALID_AUTH_TOKEN: "Authentication failed. Please log in again.",
    UNAUTHORIZED: "You don't have permission to perform this action.",
    VALIDATION_ERROR: "Please check your input and try again.",
  };

  return errorCodeMessages[parsed.code] || parsed.message;
};

/**
 * Check if error is a specific type
 */
export const isErrorCode = (error: any, code: string): boolean => {
  const parsed = parseApiError(error);
  return parsed.code === code;
};

/**
 * Check if error is authentication related
 */
export const isAuthError = (error: any): boolean => {
  const parsed = parseApiError(error);
  return [
    "TOKEN_EXPIRED",
    "INVALID_AUTH_TOKEN",
    "MISSING_AUTH_TOKEN",
    "UNAUTHORIZED",
  ].includes(parsed.code);
};

/**
 * Check if error is validation error
 */
export const isValidationError = (error: any): boolean => {
  const parsed = parseApiError(error);
  return parsed.code === "VALIDATION_ERROR" && !!parsed.details?.length;
};

/**
 * Get validation errors as field map
 * Useful for form validation
 */
export const getValidationErrors = (error: any): Record<string, string> => {
  const parsed = parseApiError(error);
  const errors: Record<string, string> = {};

  if (parsed.details) {
    parsed.details.forEach((err) => {
      errors[err.field] = err.message;
    });
  }

  return errors;
};
