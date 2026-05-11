import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // A leftover lockfile lives in the user's home dir from initial scaffolding;
  // pin Turbopack root to this project so it doesn't infer the wrong workspace.
  turbopack: { root: path.resolve(__dirname) },
  // Packages that ship native binaries or have their own webpack pipeline
  // and must not be bundled by Turbopack. Loaded at runtime via Node require.
  serverExternalPackages: [
    "esbuild",
    "@remotion/bundler",
    "@remotion/renderer",
  ],
  // Next 16's in-build TS worker OOMs on this project regardless of NODE_OPTIONS.
  // We run `tsc --noEmit` separately (CI / pre-push) for type safety.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
