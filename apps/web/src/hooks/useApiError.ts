/**
 * useApiError Hook
 * Display API errors with react-hot-toast
 */

import toast from "react-hot-toast";
import {
  parseApiError,
  getErrorMessage,
  getValidationErrors,
} from "../utils/errorHandler";

export const useApiError = () => {
  /**
   * Show error message
   * Auto-detects error type and displays appropriately
   */
  const showError = (error: any, customMessage?: string) => {
    const message = customMessage || getErrorMessage(error);

    toast.error(message, {
      duration: 4000,
      position: "top-right",
      style: {
        background: "#ef4444",
        color: "#fff",
        padding: "16px",
        borderRadius: "8px",
        fontSize: "14px",
      },
    });
  };

  /**
   * Show validation errors
   */
  const showValidationErrors = (error: any) => {
    const errors = getValidationErrors(error);
    const errorCount = Object.keys(errors).length;

    if (errorCount === 0) {
      showError(error);
      return;
    }

    const message =
      errorCount === 1
        ? Object.values(errors)[0]
        : `Please fix ${errorCount} errors in your form`;

    toast.error(message, {
      duration: 4000,
      position: "top-right",
    });
  };

  /**
   * Show success message
   */
  const showSuccess = (message: string) => {
    toast.success(message, {
      duration: 3000,
      position: "top-right",
      style: {
        background: "#10b981",
        color: "#fff",
      },
    });
  };

  /**
   * Show info message
   */
  const showInfo = (message: string) => {
    toast(message, {
      duration: 3000,
      position: "top-right",
      icon: "ℹ️",
    });
  };

  /**
   * Show warning message
   */
  const showWarning = (message: string) => {
    toast(message, {
      duration: 3000,
      position: "top-right",
      icon: "⚠️",
    });
  };

  /**
   * Handle error and return validation errors (for forms)
   */
  const handleValidationError = (error: any) => {
    const errors = getValidationErrors(error);
    if (Object.keys(errors).length > 0) {
      const parsed = parseApiError(error);
      toast.error(parsed.message || "Please check your input", {
        duration: 4000,
      });
      return errors;
    }
    return {};
  };

  return {
    showError,
    showValidationErrors,
    showSuccess,
    showInfo,
    showWarning,
    handleValidationError,
  };
};
