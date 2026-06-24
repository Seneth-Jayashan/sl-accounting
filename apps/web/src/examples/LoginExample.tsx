/**
 * EXAMPLE: Login Component with Error Handling
 * Shows how to handle API errors in a real component
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useApiError } from "../hooks/useApiError";
import { isValidationError, getValidationErrors } from "../utils/errorHandler";

export const LoginExample = () => {
  const navigate = useNavigate();
  const { showError, showSuccess, handleValidationError } = useApiError();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await api.post("/auth/login", formData);

      showSuccess("Login successful!");
      // Store token and redirect
      localStorage.setItem("token", response.data.token);
      navigate("/dashboard");
    } catch (error) {
      // Handle validation errors specifically
      if (isValidationError(error)) {
        const validationErrors = getValidationErrors(error);
        setErrors(validationErrors);
      } else {
        // Show general error
        showError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <h1 className="text-center text-3xl font-bold">Sign In</h1>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className={`mt-1 w-full px-4 py-2 border rounded-lg ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              disabled={loading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className={`mt-1 w-full px-4 py-2 border rounded-lg ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              disabled={loading}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginExample;
