import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getPublicSettings } from "@/lib/settings";
import { getImageUrl } from "@/lib/image";

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

  // Add site icon if configured - generate multiple sizes for best browser support
  if (settings?.site_icon_path) {
    metadata.icons = {
      icon: [
        {
          url: getImageUrl(settings.site_icon_path, { width: 32, height: 32, fit: 'cover' }),
          sizes: '32x32',
          type: 'image/png',
        },
        {
          url: getImageUrl(settings.site_icon_path, { width: 16, height: 16, fit: 'cover' }),
          sizes: '16x16',
          type: 'image/png',
        },
        {
          url: getImageUrl(settings.site_icon_path, { width: 192, height: 192, fit: 'cover' }),
          sizes: '192x192',
          type: 'image/png',
        },
        {
          url: getImageUrl(settings.site_icon_path, { width: 512, height: 512, fit: 'cover' }),
          sizes: '512x512',
          type: 'image/png',
        },
      ],
      apple: [
        {
          url: getImageUrl(settings.site_icon_path, { width: 180, height: 180, fit: 'cover' }),
          sizes: '180x180',
          type: 'image/png',
        },
      ],
      shortcut: getImageUrl(settings.site_icon_path, { width: 32, height: 32, fit: 'cover' }),
    };
  }

  // Add default OG image if configured
  if (settings?.default_og_image_path) {
    const ogImageUrl = getImageUrl(settings.default_og_image_path, {
      width: 1200,
      height: 630,
      fit: 'cover',
      quality: 80,
    });
    metadata.openGraph = {
      ...metadata.openGraph,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    };
    metadata.twitter = {
      ...metadata.twitter,
      images: [ogImageUrl],
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
