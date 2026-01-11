"use client";

import { useEffect, useState } from "react";
import type { User } from "@/types/user";

interface AccountResponse {
  success: boolean;
  data?: User;
  error?: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchAccount();
  }, []);

  async function fetchAccount() {
    try {
      const res = await fetch("/admin/api/account");
      const data = (await res.json()) as AccountResponse;
      if (data.success && data.data) {
        setUser(data.data);
        setName(data.data.name);
        setBio(data.data.bio || "");
      }
    } catch (error) {
      console.error("Error fetching account:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    // Validate
    if (!name.trim()) {
      setMessage({ type: "error", text: "Name is required" });
      return;
    }

    if (password) {
      if (password.length < 8) {
        setMessage({ type: "error", text: "Password must be at least 8 characters" });
        return;
      }
      if (password !== confirmPassword) {
        setMessage({ type: "error", text: "Passwords do not match" });
        return;
      }
    }

    setSaving(true);
    try {
      const payload: { name: string; bio: string | null; password?: string } = {
        name: name.trim(),
        bio: bio.trim() || null,
      };

      if (password) {
        payload.password = password;
      }

      const res = await fetch("/admin/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as AccountResponse;

      if (data.success && data.data) {
        setUser(data.data);
        setPassword("");
        setConfirmPassword("");
        setMessage({ type: "success", text: "Account updated successfully" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update account" });
      }
    } catch (error) {
      console.error("Error updating account:", error);
      setMessage({ type: "error", text: "An error occurred while saving" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!user) {
    return <div className="text-center py-8 text-red-600">Failed to load account</div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Account</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
        {message && (
          <div
            className={`mb-6 p-3 rounded text-sm ${
              message.type === "success"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Read-only fields */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Account Info</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Email:</span>
              <span className="ml-2 text-gray-900">{user.email}</span>
            </div>
            <div>
              <span className="text-gray-500">Role:</span>
              <span className="ml-2 text-gray-900 capitalize">{user.role}</span>
            </div>
            <div>
              <span className="text-gray-500">Member since:</span>
              <span className="ml-2 text-gray-900">
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Editable fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="A short bio about yourself..."
            />
          </div>

          {/* Password change section */}
          <div className="pt-4 border-t border-gray-200">
            <h2 className="text-sm font-medium text-gray-700 mb-3">
              Change Password
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </h2>

            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white pr-16 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="New password (min 8 characters)"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm px-2"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-gray-900 bg-white pr-16 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    confirmPassword && password !== confirmPassword
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm px-2"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-xs">Passwords do not match</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
