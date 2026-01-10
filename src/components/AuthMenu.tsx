"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "editor" | "author";
  is_superadmin: boolean;
  avatar_path?: string | null;
}

export default function AuthMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = (await res.json()) as {
          success: boolean;
          data?: User;
        };
        if (data.success && data.data) {
          setUser(data.data);
        }
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setShowDropdown(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }

  if (loading) {
    return (
      <div
        className="w-8 h-8 rounded-full animate-pulse"
        style={{ backgroundColor: "var(--muted)" }}
      />
    );
  }

  if (user) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 transition-colors"
          style={{ color: "var(--muted-foreground)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--foreground)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--muted-foreground)")
          }
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--accent-foreground)",
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        </button>

        {showDropdown && (
          <div
            className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="px-4 py-2 text-sm border-b"
              style={{
                color: "var(--foreground)",
                borderColor: "var(--border)",
              }}
            >
              {user.name}
              {user.is_superadmin && (
                <span
                  className="ml-2 text-xs px-1 py-0.5 rounded"
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "var(--accent-foreground)",
                  }}
                >
                  Admin
                </span>
              )}
            </div>
            <Link
              href={`/user/${user.id}`}
              className="block px-4 py-2 text-sm transition-colors"
              style={{ color: "var(--muted-foreground)" }}
              onClick={() => setShowDropdown(false)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--accent)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              Profile
            </Link>
            <Link
              href="/account"
              className="block px-4 py-2 text-sm transition-colors"
              style={{ color: "var(--muted-foreground)" }}
              onClick={() => setShowDropdown(false)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--accent)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              Settings
            </Link>
            {(user.role === "admin" || user.role === "editor") && (
              <Link
                href="/admin"
                className="block px-4 py-2 text-sm transition-colors"
                style={{ color: "var(--muted-foreground)" }}
                onClick={() => setShowDropdown(false)}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--accent)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                Admin
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm transition-colors"
              style={{ color: "var(--muted-foreground)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--accent)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowLoginModal(true)}
        className="transition-colors"
        style={{ color: "var(--muted-foreground)" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "var(--foreground)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--muted-foreground)")
        }
      >
        Sign in
      </button>

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={(u) => {
            setUser(u);
            setShowLoginModal(false);
          }}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
        />
      )}

      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onSuccess={(u) => {
            setUser(u);
            setShowRegisterModal(false);
          }}
          onSwitchToLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
        />
      )}
    </>
  );
}

function LoginModal({
  onClose,
  onSuccess,
  onSwitchToRegister,
}: {
  onClose: () => void;
  onSuccess: (user: User) => void;
  onSwitchToRegister: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json()) as {
        success: boolean;
        data?: User;
        error?: string;
      };

      if (data.success && data.data) {
        onSuccess(data.data);
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg p-6"
        style={{ backgroundColor: "var(--card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-xl font-bold mb-4"
          style={{ color: "var(--foreground)" }}
        >
          Sign in
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="p-3 rounded text-sm"
              style={{
                backgroundColor: "var(--destructive)",
                color: "var(--destructive-foreground)",
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              className="block text-sm mb-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded border text-foreground"
              style={{
                backgroundColor: "var(--background)",
                borderColor: "var(--border)",
              }}
              required
            />
          </div>

          <div>
            <label
              className="block text-sm mb-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded border text-foreground"
              style={{
                backgroundColor: "var(--background)",
                borderColor: "var(--border)",
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p
          className="mt-4 text-center text-sm"
          style={{ color: "var(--muted-foreground)" }}
        >
          Don&apos;t have an account?{" "}
          <button
            onClick={onSwitchToRegister}
            className="underline"
            style={{ color: "var(--foreground)" }}
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
}

function RegisterModal({
  onClose,
  onSuccess,
  onSwitchToLogin,
}: {
  onClose: () => void;
  onSuccess: (user: User) => void;
  onSwitchToLogin: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = (await res.json()) as {
        success: boolean;
        data?: User;
        error?: string;
      };

      if (data.success && data.data) {
        onSuccess(data.data);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg p-6"
        style={{ backgroundColor: "var(--card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-xl font-bold mb-4"
          style={{ color: "var(--foreground)" }}
        >
          Create account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="p-3 rounded text-sm"
              style={{
                backgroundColor: "var(--destructive)",
                color: "var(--destructive-foreground)",
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              className="block text-sm mb-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded border text-foreground"
              style={{
                backgroundColor: "var(--background)",
                borderColor: "var(--border)",
              }}
              required
            />
          </div>

          <div>
            <label
              className="block text-sm mb-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded border text-foreground"
              style={{
                backgroundColor: "var(--background)",
                borderColor: "var(--border)",
              }}
              required
            />
          </div>

          <div>
            <label
              className="block text-sm mb-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded border text-foreground"
              style={{
                backgroundColor: "var(--background)",
                borderColor: "var(--border)",
              }}
              minLength={8}
              required
            />
            <p
              className="text-xs mt-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              At least 8 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p
          className="mt-4 text-center text-sm"
          style={{ color: "var(--muted-foreground)" }}
        >
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="underline"
            style={{ color: "var(--foreground)" }}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
