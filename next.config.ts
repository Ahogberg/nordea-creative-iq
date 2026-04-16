import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Packages that ship native binaries or have their own webpack pipeline
  // and must not be bundled by Turbopack. Loaded at runtime via Node require.
  serverExternalPackages: [
    "esbuild",
    "@remotion/bundler",
    "@remotion/renderer",
  ],
};

export default nextConfig;
