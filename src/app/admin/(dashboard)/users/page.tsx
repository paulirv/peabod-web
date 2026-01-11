"use client";

import { useEffect, useState, useCallback } from "react";
import type { User, UserRole } from "@/types/user";

interface UsersResponse {
  success: boolean;
  data?: {
    items: User[];
    total: number;
    pending_count: number;
    limit: number;
    offset: number;
  };
  error?: string;
}

type StatusFilter = "all" | "pending" | "approved" | "inactive";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    role: "author" as UserRole,
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewConfirmPassword, setShowNewConfirmPassword] = useState(false);
  const [editPassword, setEditPassword] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (search) {
        params.set("search", search);
      }
      const res = await fetch(`/admin/api/users?${params.toString()}`);
      const data = (await res.json()) as UsersResponse;
      if (data.success && data.data) {
        setUsers(data.data.items);
        setPendingCount(data.data.pending_count);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleApprove = async (user: User) => {
    try {
      const res = await fetch(`/admin/api/users/${user.id}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = (await res.json()) as { error?: string };
        alert(data.error || "Failed to approve user");
      }
    } catch (error) {
      console.error("Error approving user:", error);
    }
  };

  const handleReject = async (user: User) => {
    if (!confirm(`Reject ${user.name}'s registration? They will be deleted.`)) {
      return;
    }
    try {
      const res = await fetch(`/admin/api/users/${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
    }
  };

  const handleRevokeApproval = async (user: User) => {
    if (!confirm(`Revoke ${user.name}'s approval? They will be logged out.`)) {
      return;
    }
    try {
      const res = await fetch(`/admin/api/users/${user.id}/approve`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error revoking approval:", error);
    }
  };

  const handleToggleActive = async (user: User) => {
    const action = user.is_active ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${action} ${user.name}?`)) {
      return;
    }
    try {
      const res = await fetch(`/admin/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = (await res.json()) as { error?: string };
        alert(data.error || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  };

  const handleRoleChange = async (user: User, newRole: UserRole) => {
    try {
      const res = await fetch(`/admin/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = (await res.json()) as { error?: string };
        alert(data.error || "Failed to change role");
      }
    } catch (error) {
      console.error("Error changing role:", error);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name}? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/admin/api/users/${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = (await res.json()) as { error?: string };
        alert(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    // Validate password if being changed
    if (editPassword.password) {
      if (editPassword.password.length < 8) {
        alert("Password must be at least 8 characters");
        return;
      }
      if (editPassword.password !== editPassword.confirmPassword) {
        alert("Passwords do not match");
        return;
      }
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: editingUser.name,
        bio: editingUser.bio,
        role: editingUser.role,
      };

      if (editPassword.password) {
        payload.password = editPassword.password;
      }

      const res = await fetch(`/admin/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setEditingUser(null);
        setEditPassword({ password: "", confirmPassword: "" });
        setShowEditPassword(false);
        setShowEditConfirmPassword(false);
        fetchUsers();
      } else {
        const data = (await res.json()) as { error?: string };
        alert(data.error || "Failed to save changes");
      }
    } catch (error) {
      console.error("Error saving user:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      alert("Please fill in all required fields");
      return;
    }
    if (newUser.password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }
    if (newUser.password !== newUser.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/admin/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        setShowNewUserModal(false);
        setNewUser({ email: "", password: "", confirmPassword: "", name: "", role: "author" });
        setShowNewPassword(false);
        setShowNewConfirmPassword(false);
        fetchUsers();
      } else {
        const data = (await res.json()) as { error?: string };
        alert(data.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (user: User) => {
    if (!user.is_active) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
          Inactive
        </span>
      );
    }
    if (!user.is_approved) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          Pending
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        Active
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              {pendingCount} pending approval
            </span>
          )}
          <button
            onClick={() => setShowNewUserModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6 flex gap-4 flex-wrap">
        <div className="flex gap-2">
          {(["all", "pending", "approved", "inactive"] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === "pending" && pendingCount > 0 && ` (${pendingCount})`}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.id === 1 ? (
                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded" title="Superuser role is locked">
                        Admin (locked)
                      </span>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900"
                      >
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="author">Author</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(user)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm space-x-2">
                    {!user.is_approved && user.is_active && (
                      <>
                        <button
                          onClick={() => handleApprove(user)}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(user)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {user.is_approved && user.is_active && (
                      <>
                        <button
                          onClick={() => setEditingUser(user)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        {user.id !== 1 && (
                          <>
                            <button
                              onClick={() => handleRevokeApproval(user)}
                              className="text-yellow-600 hover:text-yellow-800"
                            >
                              Revoke
                            </button>
                            <button
                              onClick={() => handleToggleActive(user)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              Deactivate
                            </button>
                          </>
                        )}
                      </>
                    )}
                    {!user.is_active && user.id !== 1 && (
                      <>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className="text-green-600 hover:text-green-800"
                        >
                          Activate
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Edit User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={editingUser.bio || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                {editingUser.id === 1 ? (
                  <div className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-600 bg-gray-100">
                    Admin (locked)
                  </div>
                ) : (
                  <select
                    value={editingUser.role}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, role: e.target.value as UserRole })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="author">Author</option>
                  </select>
                )}
              </div>

              {/* Password Change Section */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Change Password
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type={showEditPassword ? "text" : "password"}
                      value={editPassword.password}
                      onChange={(e) => setEditPassword({ ...editPassword, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white pr-10"
                      placeholder="New password (min 8 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                    >
                      {showEditPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showEditConfirmPassword ? "text" : "password"}
                      value={editPassword.confirmPassword}
                      onChange={(e) => setEditPassword({ ...editPassword, confirmPassword: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg text-gray-900 bg-white pr-10 ${
                        editPassword.confirmPassword && editPassword.password !== editPassword.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditConfirmPassword(!showEditConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                    >
                      {showEditConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {editPassword.confirmPassword && editPassword.password !== editPassword.confirmPassword && (
                    <p className="text-red-500 text-xs">Passwords do not match</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setEditingUser(null);
                  setEditPassword({ password: "", confirmPassword: "" });
                  setShowEditPassword(false);
                  setShowEditConfirmPassword(false);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New User Modal */}
      {showNewUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">New User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white pr-10"
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                  >
                    {showNewPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewConfirmPassword ? "text" : "password"}
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg text-gray-900 bg-white pr-10 ${
                      newUser.confirmPassword && newUser.password !== newUser.confirmPassword
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewConfirmPassword(!showNewConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                  >
                    {showNewConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {newUser.confirmPassword && newUser.password !== newUser.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                >
                  <option value="author">Author</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewUserModal(false);
                  setNewUser({ email: "", password: "", confirmPassword: "", name: "", role: "author" });
                  setShowNewPassword(false);
                  setShowNewConfirmPassword(false);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
