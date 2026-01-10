import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: {
    default: "Peabod",
    template: "%s | Peabod",
  },
  description: "Thoughts, ideas, and stories from my corner of the internet.",
  metadataBase: new URL("https://peabod.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://peabod.com",
    siteName: "Peabod",
    title: "Peabod",
    description: "Thoughts, ideas, and stories from my corner of the internet.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Peabod",
    description: "Thoughts, ideas, and stories from my corner of the internet.",
  },
};

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
