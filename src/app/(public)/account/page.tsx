"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  name: string;
  bio: string | null;
  avatar_media_id: number | null;
  avatar_path: string | null;
  is_superadmin: boolean;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = (await res.json()) as {
          success: boolean;
          data?: User;
          error?: string;
        };
        if (data.success && data.data) {
          setUser(data.data);
          setName(data.data.name);
          setBio(data.data.bio || "");
        } else {
          router.push("/");
        }
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio: bio || null }),
      });

      const data = (await res.json()) as {
        success: boolean;
        data?: Partial<User>;
        error?: string;
      };

      if (data.success && data.data) {
        setSuccess("Profile updated successfully");
        setUser({ ...user!, ...data.data });
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div
          className="h-8 w-48 rounded animate-pulse mb-8"
          style={{ backgroundColor: "var(--muted)" }}
        />
        <div
          className="h-64 rounded animate-pulse"
          style={{ backgroundColor: "var(--muted)" }}
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1
        className="text-3xl font-bold mb-8"
        style={{ color: "var(--foreground)" }}
      >
        Account Settings
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div
            className="p-4 rounded"
            style={{
              backgroundColor: "var(--destructive)",
              color: "var(--destructive-foreground)",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="p-4 rounded"
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--accent-foreground)",
            }}
          >
            {success}
          </div>
        )}

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--foreground)" }}
          >
            Email
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-4 py-2 rounded border text-muted-foreground"
            style={{
              backgroundColor: "var(--muted)",
              borderColor: "var(--border)",
            }}
            autoComplete="off"
          />
          <p
            className="text-xs mt-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            Email cannot be changed
          </p>
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--foreground)" }}
          >
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded border text-foreground"
            style={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
            }}
            autoComplete="name"
            required
            minLength={2}
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--foreground)" }}
          >
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 rounded border text-foreground"
            style={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
            }}
            placeholder="Tell us about yourself..."
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => router.push(`/user/${user.id}`)}
            className="px-6 py-2 rounded font-medium transition-colors"
            style={{
              backgroundColor: "var(--secondary)",
              color: "var(--secondary-foreground)",
            }}
          >
            View Profile
          </button>
        </div>
      </form>
    </div>
  );
}
