import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Each test file gets its own in-memory SQLite db; no real network/API keys.
    env: {
      DB_FILE_NAME: ":memory:",
      INNGEST_DEV: "1",
    },
  },
});
