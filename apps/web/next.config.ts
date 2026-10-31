import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@subflow/shared", "@subflow/events", "@subflow/firebase"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
