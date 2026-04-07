import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "../test",
  testMatch: /.*\.ts/,
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000"
  },
  webServer: {
    command: "npm run build && npm start",
    url: "http://localhost:3000",
    timeout: 120000,
    reuseExistingServer: !process.env.CI
  }
});
