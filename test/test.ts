import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import * as path from "node:path";

test("GET / ping", async ({ request }) => {
    const response = await request.get("/ping");
    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    expect(body).toContain("pong");
});

const rootDirectory = path.join(__dirname, "..");

const defaultFilePath = path
    .normalize(path.join(rootDirectory, "test", "test.xlsx"))
    .replace(/\\/g, "/");

const defaultFileOutPath = path
    .normalize(path.join(rootDirectory, "test", "test-out.xlsx"))
    .replace(/\\/g, "/");

const defaultCodeFilePath = path
    .normalize(path.join(rootDirectory, "test", "data", "hello-world-excel.js"))
    .replace(/\\/g, "/");

test("Run Micro Command - Console", async ({ request }) => {
    const response = await request.post("/run-micro-commands", {
        data: {
            commands: [
                {
                    name: "Console",
                    parameters: {
                        message: "Hello, World!",
                    },
                },
            ],
        },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    const message = JSON.parse(body);
    expect(message.results[0].success).toBeTruthy();
});

test("Run Micro Command - Open Excel File", async ({ request }) => {
    const response = await request.post("/run-micro-commands", {
        data: {
            commands: [
                {
                    name: "OpenExcelFile",
                    parameters: {
                        filePath: defaultFilePath,
                    },
                },
            ],
        },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    const message = JSON.parse(body);
    expect(message.results[0].success).toBeTruthy();
});

test("Run Micro Command - Eval", async ({ request }) => {
    const code = readFileSync(defaultCodeFilePath, "utf-8");
    const response = await request.post("/run-micro-commands", {
        data: {
            commands: [
                {
                    name: "AddinEval",
                    parameters: {
                        code,
                    },
                },
            ],
        },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    const message = JSON.parse(body);
    expect(message.results[0].success).toBeTruthy();
});

test("Run Micro Command - Save Excel File", async ({ request }) => {
    const response = await request.post("/run-micro-commands", {
        data: {
            commands: [
                {
                    name: "SaveExcelFile",
                    parameters: {
                        filePath: defaultFileOutPath,
                    },
                },
            ],
        },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    const message = JSON.parse(body);
    expect(message.results[0].success).toBeTruthy();
});

test("Run Micro Command - Close Excel File", async ({ request }) => {
    const response = await request.post("/run-micro-commands", {
        data: {
            commands: [
                {
                    name: "CloseExcelFile",
                    parameters: {
                        filePath: defaultFilePath,
                    },
                },
            ],
        },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    const message = JSON.parse(body);
    expect(message.results[0].success).toBeTruthy();
});

test("Run Micro Commands - Open, Eval, Save, Close", async ({ request }) => {
    const code = readFileSync(defaultCodeFilePath, "utf-8");
    const response = await request.post("/run-micro-commands", {
        data: {
            commands: [
                {
                    name: "OpenExcelFile",
                    parameters: {
                        filePath: defaultFilePath,
                    },
                },
                {
                    name: "AddinEval",
                    parameters: {
                        code,
                    },
                },
                {
                    name: "SaveExcelFile",
                    parameters: {
                        filePath: defaultFileOutPath,
                    },
                },
                {
                    name: "CloseExcelFile",
                    parameters: {
                        filePath: defaultFilePath,
                    },
                },
            ],
        },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    const message = JSON.parse(body);
    expect(message.results).toHaveLength(4);
    for (const result of message.results) {
        expect(result.success).toBeTruthy();
    }
});
