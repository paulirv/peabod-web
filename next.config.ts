import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // Optimize for modern browsers only
  experimental: {
    optimizePackageImports: ["react", "react-dom"],
  },
  // Disable x-powered-by header
  poweredByHeader: false,
  // Compress responses
  compress: true,
};

export default nextConfig;
