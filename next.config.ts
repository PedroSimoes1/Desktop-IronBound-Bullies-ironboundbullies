import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve AVIF where the browser accepts it, WebP otherwise; JPEG is the last resort.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
