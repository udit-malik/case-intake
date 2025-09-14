import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    environmentOptions: {
      jsdom: {
        resources: "usable"
      }
    },
    testTimeout: 10000,
    // Add React testing configuration
    deps: {
      inline: ['@testing-library/react']
    }
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  define: {
    "typeof window": '"undefined"',
  },
});
