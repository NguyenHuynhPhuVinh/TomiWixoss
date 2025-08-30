import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Bỏ qua ESLint khi build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
