/**
 * EXAMPLE: Form Component with Field-Level Error Display
 * Shows how to display validation errors on form fields
 */

import { useState } from "react";
import api from "../services/api";
import { useApiError } from "../hooks/useApiError";
import { isValidationError, getValidationErrors } from "../utils/errorHandler";

export const RegistrationFormExample = () => {
  const { showSuccess, showError } = useApiError();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    name: "",
  });

  // Store field-level errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});

    try {
      const response = await api.post("/auth/register", formData);

      showSuccess("Registration successful! Please log in.");

      // Reset form
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        name: "",
      });

      // Redirect to login
      // navigate("/login");
    } catch (error) {
      // Check if it's a validation error with field details
      if (isValidationError(error)) {
        const errors = getValidationErrors(error);
        setFieldErrors(errors);

        // Still show a toast for the main message
        const parsed = error.response?.data;
        showError(
          error,
          parsed?.message || "Please check the form fields below"
        );
      } else {
        showError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper component for form field with error display
  const FormField = ({
    label,
    name,
    type = "text",
    placeholder,
  }: {
    label: string;
    name: string;
    type?: string;
    placeholder?: string;
  }) => {
    const error = fieldErrors[name];

    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <input
          type={type}
          name={name}
          value={formData[name as keyof typeof formData] || ""}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={loading}
          className={`
            w-full px-4 py-2 border rounded-lg focus:outline-none transition
            ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }
            disabled:bg-gray-100
          `}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <span>⚠️</span> {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">Create Account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Full Name" name="name" placeholder="John Doe" />

        <FormField
          label="Email Address"
          name="email"
          type="email"
          placeholder="john@example.com"
        />

        <FormField
          label="Phone Number"
          name="phone"
          placeholder="+1 (555) 000-0000"
        />

        <FormField
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
        />

        <FormField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
        />

        <button
          type="submit"
          disabled={loading}
          className={`
            w-full py-3 rounded-lg font-medium text-white transition
            ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }
          `}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      {/* Helper text */}
      <p className="text-sm text-gray-600 text-center mt-6">
        Already have an account?{" "}
        <a href="/login" className="text-blue-600 hover:underline">
          Sign In
        </a>
      </p>
    </div>
  );
};

export default RegistrationFormExample;
