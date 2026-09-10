import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:8080",
    browserName: "chromium",
  },
  reporter: "list",
});
