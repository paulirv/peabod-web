import { redirect } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { getSessionUser } from "@/lib/session";
import { getSiteName } from "@/lib/settings";

// Force dynamic rendering - auth must be checked on every request
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get user on server side and validate session
  const user = await getSessionUser();

  // If no valid session, redirect to login
  if (!user) {
    redirect("/admin/login");
  }

  const siteName = await getSiteName();

  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={user.role} siteName={siteName} />
      <main className="flex-1 bg-gray-100 p-8">{children}</main>
    </div>
  );
}
