"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.ok) {
          const data = (await response.json()) as { success?: boolean; user?: unknown };
          if (data.success && data.user) {
            setIsAuthenticated(true);
            return;
          }
        }

        // Not authenticated - redirect to home
        router.replace("/");
      } catch (error) {
        console.error("Auth check failed:", error);
        router.replace("/");
      }
    }

    checkAuth();
  }, [router]);

  // Show nothing while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Show children only if authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  return null;
}
