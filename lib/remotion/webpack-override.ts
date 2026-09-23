// Remotions bundler (webpack) känner inte till tsconfig-aliaset `@/…` som
// lib/remotion använder. Samma override används av CLI:n (remotion.config.ts)
// och av den lokala renderingen (render.ts).

import path from "node:path";
import type { WebpackOverrideFn } from "@remotion/bundler";

export const withProjectAliases: WebpackOverrideFn = (config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...(config.resolve?.alias as Record<string, string> | undefined),
      "@": path.resolve(process.cwd()),
    },
  },
});
