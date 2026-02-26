import "@tandem-docs/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  transpilePackages: ["shiki"],
  serverExternalPackages: ["pg"],
};

export default nextConfig;
