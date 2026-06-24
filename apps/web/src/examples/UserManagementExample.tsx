/**
 * EXAMPLE: User Management Component with Error Handling
 * Shows how to handle errors in CRUD operations
 */

import { useEffect, useState } from "react";
import api from "../services/api";
import { useApiError } from "../hooks/useApiError";
import { isErrorCode } from "../utils/errorHandler";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const UserManagementExample = () => {
  const { showError, showSuccess, showValidationErrors } = useApiError();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/users");
      setUsers(response.data.data);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    setDeleting(userId);
    try {
      await api.delete(`/users/${userId}`);

      showSuccess("User deleted successfully");

      // Refresh list
      setUsers(users.filter((u) => u.id !== userId));
    } catch (error) {
      // Handle specific error: resource in use
      if (isErrorCode(error, "RESOURCE_IN_USE")) {
        showError(
          error,
          "Cannot delete this user. They have active enrollments."
        );
      } else {
        showError(error);
      }
    } finally {
      setDeleting(null);
    }
  };

  const updateUser = async (userId: string, data: any) => {
    try {
      const response = await api.put(`/users/${userId}`, data);

      showSuccess("User updated successfully");

      // Update local state
      setUsers(users.map((u) => (u.id === userId ? response.data.data : u)));
    } catch (error) {
      // Handle validation errors
      if (error.response?.data?.code === "VALIDATION_ERROR") {
        showValidationErrors(error);
      } else {
        showError(error);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>

      <button
        onClick={fetchUsers}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Refresh
      </button>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{user.name}</td>
                <td className="px-4 py-2">{user.role}</td>
                <td className="px-4 py-2 text-center space-x-2">
                  <button
                    onClick={() => updateUser(user.id, { name: "Updated" })}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    disabled={deleting === user.id}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
                  >
                    {deleting === user.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">No users found</div>
      )}
    </div>
  );
};

export default UserManagementExample;
