/\*\*

- FRONTEND ERROR HANDLING GUIDE
- Complete guide for handling user-friendly errors in React
  \*/

# /\*

                    QUICK START - 5 MINUTE SETUP

=================================================================================

1. Import the hook in your component:
   import { useApiError } from "../hooks/useApiError";

2. Use it in your component:
   const { showError, showSuccess } = useApiError();

3. In your API call:
   try {
   const response = await api.post("/users", data);
   showSuccess("User created!");
   } catch (error) {
   showError(error);
   }

Done! Errors now display as beautiful toast notifications.

=================================================================================
UTILITIES
=================================================================================

File: src/utils/errorHandler.ts

Functions:

- parseApiError(error) → Parse error and extract details
- getErrorMessage(error) → Get user-friendly message
- isErrorCode(error, code) → Check if error matches specific code
- isAuthError(error) → Check if auth-related error
- isValidationError(error) → Check if validation error
- getValidationErrors(error) → Get field-level errors as object

=================================================================================
HOOK - useApiError
=================================================================================

File: src/hooks/useApiError.ts

Methods:

- showError(error, customMessage?) → Show error toast
- showSuccess(message) → Show success toast
- showInfo(message) → Show info toast
- showWarning(message) → Show warning toast
- showValidationErrors(error) → Show validation errors
- handleValidationError(error) → Handle validation + return errors

=================================================================================
COMMON PATTERNS
=================================================================================

## PATTERN 1: Simple Error Display

const { showError, showSuccess } = useApiError();

const handleDelete = async (id: string) => {
try {
await api.delete(`/users/${id}`);
showSuccess("User deleted successfully");
} catch (error) {
showError(error);
}
};

## PATTERN 2: Validation Errors with Form Display

const { showError } = useApiError();
const [errors, setErrors] = useState<Record<string, string>>({});

const handleSubmit = async (data: any) => {
try {
await api.post("/users", data);
} catch (error) {
if (error.response?.data?.code === "VALIDATION_ERROR") {
const fieldErrors = getValidationErrors(error);
setErrors(fieldErrors); // Display on form fields
} else {
showError(error);
}
}
};

## PATTERN 3: Specific Error Handling

const { showError, showSuccess } = useApiError();

const handleEnroll = async (batchId: string) => {
try {
await api.post(`/batches/${batchId}/enroll`, {});
showSuccess("Enrolled successfully!");
} catch (error) {
if (isErrorCode(error, "ENROLLMENT_EXISTS")) {
showError(error, "You are already enrolled in this batch");
} else if (isErrorCode(error, "ENROLLMENT_NOT_ACTIVE")) {
showError(error, "This batch is not currently accepting enrollments");
} else {
showError(error);
}
}
};

## PATTERN 4: Loading States with Errors

const [loading, setLoading] = useState(false);
const { showError, showSuccess } = useApiError();

const handleSubmit = async (data: any) => {
setLoading(true);
try {
await api.post("/users", data);
showSuccess("Created successfully!");
} catch (error) {
showError(error);
} finally {
setLoading(false);
}
};

## PATTERN 5: Form Field Validation Display

import { isValidationError, getValidationErrors } from "../utils/errorHandler";

const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

const handleSubmit = async (formData: any) => {
setFieldErrors({});
try {
await api.post("/register", formData);
} catch (error) {
if (isValidationError(error)) {
const errors = getValidationErrors(error);
setFieldErrors(errors);
// errors = {
// email: "Invalid email format",
// password: "Password must be 8+ characters"
// }
}
}
};

// In JSX:
<input
className={fieldErrors.email ? "border-red-500" : "border-gray-300"}
/>
{fieldErrors.email && (

  <p className="text-red-600">{fieldErrors.email}</p>
)}

=================================================================================
ERROR CODES (Backend)
=================================================================================

Authentication Errors (401):

- "INVALID_CREDENTIALS"
- "TOKEN_EXPIRED"
- "INVALID_AUTH_TOKEN"
- "UNAUTHORIZED"
- "ACCOUNT_LOCKED"

Validation Errors (400):

- "VALIDATION_ERROR"
- "INVALID_EMAIL"
- "INVALID_PHONE"

Resource Errors (404):

- "USER_NOT_FOUND"
- "CLASS_NOT_FOUND"
- "BATCH_NOT_FOUND"
- "QUIZ_NOT_FOUND"

Conflict Errors (409):

- "EMAIL_EXISTS"
- "PHONE_EXISTS"
- "ENROLLMENT_EXISTS"
- "RESOURCE_IN_USE"

Server Errors (500):

- "EMAIL_FAILED"
- "SMS_FAILED"
- "DB_ERROR"
- "INTERNAL_ERROR"

See: ErrorMessages.js in backend for complete list

=================================================================================
TYPESCRIPT TYPES
=================================================================================

interface ApiErrorResponse {
success: false;
message: string;
code: string;
details?: Array<{ field: string; message: string }>;
timestamp: string;
}

interface ApiError {
status: number;
code: string;
message: string;
details?: Array<{ field: string; message: string }>;
}

=================================================================================
API INTERCEPTOR (Optional)
=================================================================================

File: src/services/api.ts

To enable AUTOMATIC error display globally, uncomment the error interceptor:

api.interceptors.response.use(
(response) => response,
(error) => {
// Show error automatically for ALL requests
if (error.response?.data?.message) {
toast.error(error.response.data.message);
}
return Promise.reject(error);
}
);

Skip for specific requests:
await api.post("/endpoint", data, {
skipErrorDisplay: true // Don't show automatic error
});

Then handle manually:
try {
await api.post("/endpoint", data, { skipErrorDisplay: true });
} catch (error) {
// Handle here
}

=================================================================================
COMPONENT EXAMPLE
=================================================================================

import { useState } from "react";
import api from "../services/api";
import { useApiError } from "../hooks/useApiError";
import { isValidationError, getValidationErrors } from "../utils/errorHandler";

export const MyForm = () => {
const { showError, showSuccess } = useApiError();
const [loading, setLoading] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});
const [form, setForm] = useState({ email: "", name: "" });

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
setLoading(true);
setErrors({});

    try {
      const response = await api.post("/users", form);
      showSuccess("User created successfully!");
      setForm({ email: "", name: "" });
    } catch (error) {
      if (isValidationError(error)) {
        const fieldErrors = getValidationErrors(error);
        setErrors(fieldErrors);
      } else {
        showError(error);
      }
    } finally {
      setLoading(false);
    }

};

return (
<form onSubmit={handleSubmit} className="space-y-4">
<div>
<label>Name:</label>
<input
value={form.name}
onChange={(e) => setForm({ ...form, name: e.target.value })}
className={errors.name ? "border-red-500" : ""}
/>
{errors.name && <p className="text-red-600">{errors.name}</p>}
</div>

      <div>
        <label>Email:</label>
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && <p className="text-red-600">{errors.email}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? "Submitting..." : "Submit"}
      </button>
    </form>

);
};

=================================================================================
FILES REFERENCE
=================================================================================

Core Files:
✓ src/utils/errorHandler.ts - Error parsing utilities
✓ src/hooks/useApiError.ts - React hook for displaying errors
✓ src/services/api.ts - Axios instance with interceptors

Examples:
✓ src/examples/LoginExample.tsx - Login form with error handling
✓ src/examples/RegistrationFormExample.tsx - Registration with field errors
✓ src/examples/UserManagementExample.tsx - CRUD operations with error handling

=================================================================================
BEST PRACTICES
=================================================================================

✅ DO:

- Use try-catch around api calls
- Show specific error messages for validation errors
- Display field-level errors on forms
- Use error codes to handle specific scenarios
- Clear field errors when user starts typing
- Show success messages after actions
- Disable forms during submission

❌ DON'T:

- Show generic "Error occurred" messages
- Ignore validation errors
- Display server stack traces to users
- Make users guess what went wrong
- Show multiple error toasts for same request
- Forget to clear loading states in finally

=================================================================================
\*/

// This file is just documentation. No exports here.
export {};
