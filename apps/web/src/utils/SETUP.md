# Frontend Error Handling - Setup Guide

## Overview

User-friendly error handling system for React frontend that works seamlessly with the backend error system.

## What's Included

### Core Files

1. **errorHandler.ts** - Error parsing utilities

   - Parse API errors and extract user-friendly messages
   - Check error types (validation, auth, etc.)
   - Get field-level validation errors

2. **useApiError Hook** - React hook for displaying errors

   - `showError()` - Display error toasts
   - `showSuccess()` - Display success toasts
   - `showValidationErrors()` - Display validation errors
   - `handleValidationError()` - Handle validation + return errors for forms

3. **api.ts** - Updated Axios instance
   - Optional automatic error display interceptor (commented out)
   - All errors structured and ready for handling

### Examples

1. **LoginExample.tsx** - Login form with error handling
2. **RegistrationFormExample.tsx** - Form with field-level validation errors
3. **UserManagementExample.tsx** - CRUD operations with error handling

## Quick Start (1 minute)

### 1. Import the hook

```typescript
import { useApiError } from "../hooks/useApiError";
```

### 2. Use in your component

```typescript
const { showError, showSuccess } = useApiError();

const handleAction = async () => {
  try {
    await api.post("/endpoint", data);
    showSuccess("Success!");
  } catch (error) {
    showError(error);
  }
};
```

That's it! Errors now display as user-friendly toast notifications.

## Error Response Format

All errors from backend now include:

```json
{
  "success": false,
  "message": "User-friendly message here",
  "code": "ERROR_CODE",
  "details": [{ "field": "email", "message": "Invalid email format" }],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Common Usage Patterns

### Pattern 1: Simple Error Display

```typescript
try {
  await api.delete(`/users/${id}`);
  showSuccess("Deleted!");
} catch (error) {
  showError(error);
}
```

### Pattern 2: Validation Errors on Form

```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

try {
  await api.post("/register", formData);
} catch (error) {
  if (error.response?.data?.code === "VALIDATION_ERROR") {
    setErrors(getValidationErrors(error));
  }
}

// In JSX:
<input className={errors.email ? "border-red-500" : ""} />;
{
  errors.email && <p className="text-red-600">{errors.email}</p>;
}
```

### Pattern 3: Specific Error Handling

```typescript
import { isErrorCode } from "../utils/errorHandler";

try {
  await api.post("/enroll", { batchId });
} catch (error) {
  if (isErrorCode(error, "ENROLLMENT_EXISTS")) {
    showError(error, "Already enrolled in this batch");
  } else {
    showError(error);
  }
}
```

## Utility Functions

### parseApiError(error)

Parse error and get structured details:

```typescript
const parsed = parseApiError(error);
// { status: 400, code: "VALIDATION_ERROR", message: "...", details: [...] }
```

### getErrorMessage(error)

Get user-friendly message:

```typescript
const message = getErrorMessage(error);
// "Your session has expired. Please log in again."
```

### isErrorCode(error, code)

Check if error matches specific code:

```typescript
if (isErrorCode(error, "EMAIL_EXISTS")) {
  // Handle duplicate email
}
```

### isValidationError(error)

Check if validation error:

```typescript
if (isValidationError(error)) {
  const fieldErrors = getValidationErrors(error);
  // { email: "Invalid format", password: "Too short" }
}
```

### isAuthError(error)

Check if authentication error:

```typescript
if (isAuthError(error)) {
  // Redirect to login
}
```

## Hook Methods

### useApiError()

```typescript
const {
  showError, // Show error toast
  showSuccess, // Show success toast
  showInfo, // Show info toast
  showWarning, // Show warning toast
  showValidationErrors, // Show validation errors
  handleValidationError, // Handle validation + return errors
} = useApiError();
```

## Error Codes

### Authentication

- `INVALID_CREDENTIALS` - Wrong email/password
- `TOKEN_EXPIRED` - Session expired
- `ACCOUNT_LOCKED` - Account is locked

### Validation

- `VALIDATION_ERROR` - Form validation failed
- `INVALID_EMAIL` - Invalid email format
- `INVALID_PHONE` - Invalid phone format

### Resources

- `USER_NOT_FOUND` - User doesn't exist
- `RESOURCE_NOT_FOUND` - Resource not found
- `RESOURCE_IN_USE` - Can't delete, resource in use

### Conflicts

- `EMAIL_EXISTS` - Email already registered
- `PHONE_EXISTS` - Phone already registered
- `ENROLLMENT_EXISTS` - Already enrolled

### Server

- `INTERNAL_ERROR` - Server error
- `DB_ERROR` - Database error
- `EMAIL_FAILED` - Email sending failed

See backend ErrorMessages.js for complete list.

## Examples

See example files:

- `LoginExample.tsx` - Basic login form
- `RegistrationFormExample.tsx` - Form with field validation display
- `UserManagementExample.tsx` - CRUD operations

## Optional: Global Error Interceptor

To show errors automatically for ALL requests, uncomment in `api.ts`:

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    import("react-hot-toast").then(({ default: toast }) => {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      }
    });
    return Promise.reject(error);
  }
);
```

Then skip for specific requests:

```typescript
await api.post("/endpoint", data, { skipErrorDisplay: true });
```

## Best Practices

✅ **DO:**

- Use try-catch for API calls
- Show field-level validation errors
- Display success messages
- Clear errors when user corrects them
- Use specific error codes for different scenarios
- Disable forms during submission

❌ **DON'T:**

- Show generic error messages
- Ignore validation errors
- Show technical error details to users
- Make users guess what went wrong

## Migration Checklist

For each component using API:

- [ ] Import `useApiError` hook
- [ ] Add try-catch around API calls
- [ ] Show errors with `showError()`
- [ ] Show success with `showSuccess()`
- [ ] Handle validation errors with `getValidationErrors()`
- [ ] Display field-level errors on forms
- [ ] Test error scenarios in Postman

## File Structure

```
src/
├── utils/
│   ├── errorHandler.ts           ← Error parsing utilities
│   └── FRONTEND_ERROR_GUIDE.md   ← This guide
├── hooks/
│   └── useApiError.ts            ← React hook
├── services/
│   └── api.ts                    ← Updated with interceptors
└── examples/
    ├── LoginExample.tsx
    ├── RegistrationFormExample.tsx
    └── UserManagementExample.tsx
```

## Support

- Check `FRONTEND_ERROR_GUIDE.md` for detailed patterns
- Review examples for implementation reference
- All error codes match backend ErrorMessages.js

---

**Ready to implement?** Start with the Quick Start section above!
