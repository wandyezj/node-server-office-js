import { defineConfig } from "@playwright/test";
import path from "path";

const testDir = path.resolve("test");


import config from "../src/server/config.json";

const port = config.http.port;

export default defineConfig({
    testDir,
    testMatch: /.*\.ts/,
    fullyParallel: false,
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
