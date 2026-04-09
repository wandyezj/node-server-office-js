import { defineConfig } from "@playwright/test";

import config from "../src/config.json";

const port = config.port;

export default defineConfig({
    testDir: "../test",
    testMatch: /.*\.ts/,
    fullyParallel: true,
    reporter: "list",
    use: {
        baseURL: `http://localhost:${port}`,
    },
    webServer: {
        command: "npm run start",
        url: `http://localhost:${port}`,
        timeout: 120000,
        reuseExistingServer: true,
    },
});
