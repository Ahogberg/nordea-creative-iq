import { defineConfig } from "vitest/config";
import path from "path";

// Enhetstester för ren logik (QA-poäng, färgkontrast, patchar, statusar).
// Inga nätverks- eller AI-anrop: allt som testas här är rena funktioner.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
  },
});
