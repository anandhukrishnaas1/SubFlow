import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@subflow/shared", "@subflow/events", "@subflow/firebase"],
};

export default nextConfig;
