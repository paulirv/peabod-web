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
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
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
