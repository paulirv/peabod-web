"use client";

import Link from "next/link";
import ThemeSwitcher from "./ThemeSwitcher";
import AuthMenu from "./AuthMenu";

export default function Header() {
  return (
    <header
      className="border-b"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold"
            style={{ color: "var(--foreground)" }}
          >
            Peabod
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="transition-colors"
              style={{ color: "var(--muted-foreground)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}
            >
              Blog
            </Link>
            <Link
              href="/about"
              className="transition-colors"
              style={{ color: "var(--muted-foreground)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}
            >
              About
            </Link>
            <ThemeSwitcher />
            <AuthMenu />
          </div>
        </nav>
      </div>
    </header>
  );
}
