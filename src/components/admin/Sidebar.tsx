"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/types/user";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "H" },
  { href: "/admin/articles", label: "Articles", icon: "A" },
  { href: "/admin/pages", label: "Pages", icon: "P" },
  { href: "/admin/media", label: "Media", icon: "M" },
  { href: "/admin/tags", label: "Tags", icon: "T" },
  { href: "/admin/users", label: "Users", icon: "U", adminOnly: true },
];

interface SidebarProps {
  userRole?: UserRole;
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || userRole === "admin"
  );

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4 relative">
      <Link
        href="/"
        target="_blank"
        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        title="View live site"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </Link>
      <div className="mb-8">
        <h1 className="text-xl font-bold">Peabod CMS</h1>
        <p className="text-gray-400 text-sm">Content Management</p>
      </div>
      <nav>
        <ul className="space-y-2">
          {visibleItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  <span className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded text-sm">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {userRole && (
        <div className="mt-8 px-4 py-2 text-xs text-gray-500">
          Logged in as {userRole}
        </div>
      )}
    </aside>
  );
}
