/\*\*

- MIGRATION GUIDE - Before & After
- How to update existing components to use new error handling
  \*/

# /\*

                        BEFORE (Current Pattern)

=================================================================================

❌ No error handling:

```typescript
export const MyComponent = () => {
  const fetchData = async () => {
    const response = await api.get("/users");
    setUsers(response.data);
  };

  return <button onClick={fetchData}>Load</button>;
};
```

Problems:

- No error handling
- Users don't know if it failed
- No loading state
- Silent failures

❌ Generic error handling:

```typescript
const handleSubmit = async (data: any) => {
  try {
    await api.post("/users", data);
    alert("Success!");
  } catch (error) {
    alert("Error"); // ❌ Vague
  }
};
```

Problems:

- Generic error message
- No error details
- No field validation display
- Alert() is old style

❌ Incomplete error handling:

```typescript
const handleDelete = async (id: string) => {
  try {
    await api.delete(`/users/${id}`);
  } catch (error) {
    console.error(error); // ❌ Only logs, doesn't inform user
  }
};
```

Problems:

- Only logs errors
- User doesn't see message
- No distinction between error types

=================================================================================
AFTER (New Pattern)
=================================================================================

✅ Complete error handling with useApiError:

```typescript
import { useApiError } from "../hooks/useApiError";

export const MyComponent = () => {
  const { showError, showSuccess, showInfo } = useApiError();
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/users");
      setUsers(response.data.data);
      showInfo("Users loaded");
    } catch (error) {
      showError(error); // ✅ User-friendly message
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={fetchData} disabled={loading}>
      {loading ? "Loading..." : "Load"}
    </button>
  );
};
```

Benefits:
✅ User-friendly error messages
✅ Loading state feedback
✅ Proper error display with toast
✅ Non-intrusive notifications

✅ Validation errors on form:

```typescript
import { isValidationError, getValidationErrors } from "../utils/errorHandler";
import { useApiError } from "../hooks/useApiError";

const handleSubmit = async (data: any) => {
  try {
    await api.post("/users", data);
    showSuccess("User created!");
  } catch (error) {
    if (isValidationError(error)) {
      const fieldErrors = getValidationErrors(error);
      setErrors(fieldErrors); // ✅ Display on form fields
      showError(error, "Please fix the errors below");
    } else {
      showError(error);
    }
  }
};
```

Benefits:
✅ Field-level error display
✅ User knows exactly what's wrong
✅ Professional error handling
✅ Better UX

✅ Specific error handling:

```typescript
import { isErrorCode } from "../utils/errorHandler";

const handleDelete = async (id: string) => {
  try {
    await api.delete(`/users/${id}`);
    showSuccess("User deleted");
    setUsers(users.filter((u) => u.id !== id));
  } catch (error) {
    if (isErrorCode(error, "RESOURCE_IN_USE")) {
      showError(error, "Cannot delete user with active enrollments");
    } else if (isErrorCode(error, "USER_NOT_FOUND")) {
      showError(error, "User already deleted");
    } else {
      showError(error);
    }
  }
};
```

Benefits:
✅ Different handling for different errors
✅ Context-aware error messages
✅ Professional error management
✅ Better user guidance

=================================================================================
MIGRATION CHECKLIST
=================================================================================

For each component:

[ ] Import utilities
import { useApiError } from "../hooks/useApiError";
import { isValidationError, getValidationErrors, isErrorCode } from "../utils/errorHandler";

[ ] Add state for loading and errors
const [loading, setLoading] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});

[ ] Initialize hook
const { showError, showSuccess, showWarning, showInfo } = useApiError();

[ ] Wrap API calls in try-catch
try {
// API call
} catch (error) {
// Handle error
} finally {
// Cleanup
}

[ ] Add loading state management
setLoading(true);
// ... API call ...
finally {
setLoading(false);
}

[ ] Display errors with hook
catch (error) {
showError(error);
}

[ ] Handle validation errors
if (isValidationError(error)) {
setErrors(getValidationErrors(error));
}

[ ] Display validation errors on form
className={errors.email ? "border-red-500" : ""}
{errors.email && <p className="text-red-600">{errors.email}</p>}

[ ] Show success messages
showSuccess("Action completed!");

[ ] Disable forms during submission
disabled={loading}

=================================================================================
COMPONENT MIGRATION EXAMPLE
=================================================================================

## BEFORE:

```typescript
export const UserForm = () => {
  const [data, setData] = useState({ email: "", name: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post("/users", data);
      alert("User created!");
      setData({ email: "", name: "" });
    } catch (error) {
      console.error(error);
      alert("Error creating user");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={data.email}
        onChange={(e) => setData({ ...data, email: e.target.value })}
      />
      <input
        value={data.name}
        onChange={(e) => setData({ ...data, name: e.target.value })}
      />
      <button type="submit">Create</button>
    </form>
  );
};
```

## AFTER:

```typescript
import { useApiError } from "../hooks/useApiError";
import { isValidationError, getValidationErrors } from "../utils/errorHandler";

export const UserForm = () => {
  const { showError, showSuccess } = useApiError();
  const [data, setData] = useState({ email: "", name: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await api.post("/users", data);
      showSuccess("User created successfully!");
      setData({ email: "", name: "" });
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

  const FormField = ({ label, name }: { label: string; name: string }) => {
    const error = errors[name];
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">{label}</label>
        <input
          value={data[name as keyof typeof data]}
          onChange={(e) => handleChange(name, e.target.value)}
          disabled={loading}
          className={`w-full px-3 py-2 border rounded ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        />
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md">
      <FormField label="Email" name="email" />
      <FormField label="Name" name="name" />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:bg-gray-400"
      >
        {loading ? "Creating..." : "Create"}
      </button>
    </form>
  );
};
```

IMPROVEMENTS:
✅ User-friendly error toasts
✅ Field-level error display
✅ Loading state feedback
✅ Error clearing on user input
✅ Better UX overall

=================================================================================
TIME ESTIMATE
=================================================================================

Simple component (list view): 15 minutes
Form component (with validation): 30 minutes
Complex component (multiple actions): 45 minutes

Total project migration: 2-3 hours (for small to medium project)

=================================================================================
\*/

export {};
