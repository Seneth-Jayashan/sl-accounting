# Frontend Error Handling System

User-friendly error messages with toast notifications, field validation display, and comprehensive error utilities.

## Quick Start (1 minute)

```typescript
import { useApiError } from "../hooks/useApiError";

export const MyComponent = () => {
  const { showError, showSuccess } = useApiError();

  const handleAction = async () => {
    try {
      await api.post("/endpoint", data);
      showSuccess("Success!");
    } catch (error) {
      showError(error); // Shows user-friendly message
    }
  };

  return <button onClick={handleAction}>Submit</button>;
};
```

## What's Included

### Utilities (`src/utils/errorHandler.ts`)

- `parseApiError()` - Parse error response
- `getErrorMessage()` - Get user-friendly message
- `isErrorCode()` - Check error type
- `isValidationError()` - Check if validation error
- `getValidationErrors()` - Get field errors object

### Hook (`src/hooks/useApiError.ts`)

- `showError()` - Display error toast
- `showSuccess()` - Display success toast
- `showInfo()` / `showWarning()` - Display other notifications
- `handleValidationError()` - Handle validation errors

### API Service (`src/services/api.ts`)

- Axios instance with interceptors
- Optional global error display (commented out)

### Examples

- `LoginExample.tsx` - Login form with error handling
- `RegistrationFormExample.tsx` - Form with field validation
- `UserManagementExample.tsx` - CRUD operations

## Common Patterns

### 1. Simple Error Display

```typescript
try {
  await api.delete(`/users/${id}`);
  showSuccess("Deleted!");
} catch (error) {
  showError(error);
}
```

### 2. Validation Errors on Form

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
{
  errors.email && <p className="text-red-600">{errors.email}</p>;
}
```

### 3. Specific Error Handling

```typescript
if (isErrorCode(error, "EMAIL_EXISTS")) {
  showError(error, "This email is already registered");
} else {
  showError(error);
}
```

## Error Response Format

```json
{
  "success": false,
  "message": "User-friendly message",
  "code": "ERROR_CODE",
  "details": [{ "field": "email", "message": "Invalid email format" }],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Error Codes

| Code                  | HTTP | Meaning                |
| --------------------- | ---- | ---------------------- |
| `INVALID_CREDENTIALS` | 401  | Wrong email/password   |
| `TOKEN_EXPIRED`       | 401  | Session expired        |
| `VALIDATION_ERROR`    | 400  | Form validation failed |
| `EMAIL_EXISTS`        | 409  | Email already in use   |
| `USER_NOT_FOUND`      | 404  | User doesn't exist     |
| `RESOURCE_IN_USE`     | 409  | Can't delete, in use   |
| `INTERNAL_ERROR`      | 500  | Server error           |

See backend `ErrorMessages.js` for complete list.

## Files Structure

```
src/
├── utils/
│   ├── errorHandler.ts       ← Error utilities
│   ├── SETUP.md              ← Setup guide
│   └── FRONTEND_ERROR_GUIDE.md ← Detailed guide
├── hooks/
│   └── useApiError.ts        ← React hook
├── services/
│   └── api.ts                ← Axios + interceptors
└── examples/
    ├── LoginExample.tsx
    ├── RegistrationFormExample.tsx
    ├── UserManagementExample.tsx
    └── MIGRATION_GUIDE.md
```

## Setup

1. ✅ Copy error utilities to `src/utils/`
2. ✅ Copy hook to `src/hooks/`
3. ✅ Update `src/services/api.ts`
4. ✅ Migrate components one by one

No additional packages needed - uses existing `react-hot-toast`.

## Next Steps

1. Read [SETUP.md](./SETUP.md) for detailed guide
2. Check [MIGRATION_GUIDE.md](../examples/MIGRATION_GUIDE.md) for before/after
3. Review examples in `src/examples/`
4. Migrate your components using the checklist

## Features

✅ User-friendly error messages
✅ Toast notifications (top-right)
✅ Field-level validation display
✅ Error code detection
✅ Loading state handling
✅ TypeScript support
✅ Works with existing code
✅ No new dependencies

## Best Practices

✅ Show field-level validation errors
✅ Display success messages
✅ Clear errors when user corrects them
✅ Disable forms during submission
✅ Use specific error codes for context
✅ Handle auth errors specially

See [FRONTEND_ERROR_GUIDE.md](./FRONTEND_ERROR_GUIDE.md) for full guidelines.

---

**Ready?** Start with [SETUP.md](./SETUP.md)
