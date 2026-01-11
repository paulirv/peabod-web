"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";

interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "editor" | "author";
  is_superadmin: boolean;
}

interface HeaderProps {
  siteName?: string;
}

export default function Header({ siteName }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { theme, setTheme, themes } = useTheme();
  const lightThemes = themes.filter((t) => !t.isDark);
  const darkThemes = themes.filter((t) => t.isDark);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = (await res.json()) as { success: boolean; data?: User };
        if (data.success && data.data) {
          setUser(data.data);
        }
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    } finally {
      setUserLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }

  function handleLoginSuccess(u: User) {
    setUser(u);
    setShowLoginModal(false);
    setIsMenuOpen(false);
  }

  return (
    <>
      <header
        className="border-b"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
        }}
      >
        <div className="max-w-4xl mx-auto px-2 py-4">
          <nav className="flex items-center justify-between">
            <Link
              href="/"
              className="text-2xl font-bold"
              style={{ color: "var(--foreground)" }}
            >
              {siteName || "Site Name"}
            </Link>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
                style={{
                  backgroundColor: "var(--secondary)",
                  color: "var(--secondary-foreground)",
                }}
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              {isMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 rounded-lg shadow-lg z-50 overflow-hidden"
                  style={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {/* Navigation Links */}
                  <div className="p-2">
                    <Link
                      href="/"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-md transition-colors"
                      style={{ color: "var(--foreground)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Home
                    </Link>
                    <Link
                      href="/"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-md transition-colors"
                      style={{ color: "var(--foreground)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                      Blog
                    </Link>
                    <Link
                      href="/about"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-md transition-colors"
                      style={{ color: "var(--foreground)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      About
                    </Link>
                  </div>

                  {/* Divider */}
                  <div style={{ borderTop: "1px solid var(--border)" }} />

                  {/* Theme Picker */}
                  <div className="p-4">
                    <h3
                      className="text-xs font-semibold uppercase tracking-wider mb-3"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Theme
                    </h3>

                    <div className="mb-3">
                      <h4
                        className="text-xs font-medium mb-2"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Light
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {lightThemes.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setTheme(t.id);
                            }}
                            className="flex items-center gap-2 p-2 rounded-md transition-all"
                            style={{
                              backgroundColor: t.colors.secondary,
                              color: t.colors.secondaryForeground,
                              outline: theme.id === t.id ? `2px solid ${t.colors.primary}` : "none",
                              outlineOffset: "1px",
                            }}
                          >
                            <div className="flex -space-x-1">
                              <span
                                className="w-3 h-3 rounded-full border"
                                style={{
                                  backgroundColor: t.colors.background,
                                  borderColor: t.colors.border,
                                }}
                              />
                              <span
                                className="w-3 h-3 rounded-full border"
                                style={{
                                  backgroundColor: t.colors.primary,
                                  borderColor: t.colors.border,
                                }}
                              />
                              <span
                                className="w-3 h-3 rounded-full border"
                                style={{
                                  backgroundColor: t.colors.accent,
                                  borderColor: t.colors.border,
                                }}
                              />
                            </div>
                            <span className="text-xs font-medium">{t.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4
                        className="text-xs font-medium mb-2"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Dark
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {darkThemes.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setTheme(t.id);
                            }}
                            className="flex items-center gap-2 p-2 rounded-md transition-all"
                            style={{
                              backgroundColor: t.colors.secondary,
                              color: t.colors.secondaryForeground,
                              outline: theme.id === t.id ? `2px solid ${t.colors.primary}` : "none",
                              outlineOffset: "1px",
                            }}
                          >
                            <div className="flex -space-x-1">
                              <span
                                className="w-3 h-3 rounded-full border"
                                style={{
                                  backgroundColor: t.colors.background,
                                  borderColor: t.colors.border,
                                }}
                              />
                              <span
                                className="w-3 h-3 rounded-full border"
                                style={{
                                  backgroundColor: t.colors.primary,
                                  borderColor: t.colors.border,
                                }}
                              />
                              <span
                                className="w-3 h-3 rounded-full border"
                                style={{
                                  backgroundColor: t.colors.accent,
                                  borderColor: t.colors.border,
                                }}
                              />
                            </div>
                            <span className="text-xs font-medium">{t.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ borderTop: "1px solid var(--border)" }} />

                  {/* User/Login Section */}
                  <div className="p-2">
                    {userLoading ? (
                      <div
                        className="h-12 rounded-md animate-pulse"
                        style={{ backgroundColor: "var(--muted)" }}
                      />
                    ) : user ? (
                      <>
                        <div
                          className="px-4 py-2 mb-1 text-sm"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          Signed in as <span style={{ color: "var(--foreground)" }}>{user.name}</span>
                        </div>
                        <Link
                          href={`/user/${user.id}`}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-md transition-colors"
                          style={{ color: "var(--foreground)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </Link>
                        <Link
                          href="/account"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-md transition-colors"
                          style={{ color: "var(--foreground)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Settings
                        </Link>
                        {(user.role === "admin" || user.role === "editor") && (
                          <Link
                            href="/admin"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-md transition-colors"
                            style={{ color: "var(--foreground)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Admin
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-3 rounded-md transition-colors"
                          style={{ color: "var(--foreground)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign out
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            setShowLoginModal(true);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 rounded-md transition-colors"
                          style={{ color: "var(--foreground)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Sign in
                        </button>
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            setShowRegisterModal(true);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 rounded-md transition-colors"
                          style={{ color: "var(--foreground)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          Create account
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
        />
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onSuccess={handleLoginSuccess}
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
              autoComplete="email"
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
              autoComplete="current-password"
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
              autoComplete="name"
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
              autoComplete="email"
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
              autoComplete="new-password"
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
