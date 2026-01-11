import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getPublicSettings } from "@/lib/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  const siteName = settings?.site_name || "Peabod";
  const siteDescription = settings?.site_description || "Thoughts, ideas, and stories from my corner of the internet.";
  const siteUrl = settings?.site_url || "https://peabod.com";
  const titleSuffix = settings?.meta_title_suffix || ` | ${siteName}`;

  const metadata: Metadata = {
    title: {
      default: siteName,
      template: `%s${titleSuffix}`,
    },
    description: siteDescription,
    metadataBase: new URL(siteUrl),
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteUrl,
      siteName: siteName,
      title: siteName,
      description: siteDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: siteDescription,
    },
  };

  // Add site icon if configured
  if (settings?.site_icon_path) {
    metadata.icons = {
      icon: `/api/media/${settings.site_icon_path}`,
      apple: `/api/media/${settings.site_icon_path}`,
    };
  }

  return metadata;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
