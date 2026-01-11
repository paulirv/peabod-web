import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getPublicSettings } from "@/lib/settings";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getPublicSettings();
  const siteName = settings?.site_name || "Site Name";
  const logoPath = settings?.logo_path || null;
  const logoTextDisplay = settings?.logo_text_display || "none";

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <Header siteName={siteName} logoPath={logoPath} logoTextDisplay={logoTextDisplay} />
        <main className="flex-1">{children}</main>
        <Footer siteName={siteName} />
      </div>
    </ThemeProvider>
  );
}
