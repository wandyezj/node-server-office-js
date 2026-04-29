import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import {
    MicroCommandBody,
    MicroCommandName,
} from "../src/server/handlers/microCommand/MicroCommand";

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

test("Run Micro Commands - Open, Eval, Save, Close (PowerShell)", async ({ request }) => {
    const code = readFileSync(defaultCodeFilePath, "utf-8");

    const microCommandBody: MicroCommandBody = {
        commands: [
            {
                name: MicroCommandName.PowerShellOpenExcelFile,
                parameters: {
                    filePath: defaultFilePath,
                },
            },
            {
                name: MicroCommandName.AddinEval,
                parameters: {
                    code,
                },
            },
            {
                name: MicroCommandName.PowerShellSaveExcelFile,
                parameters: {
                    filePath: defaultFileOutPath,
                },
            },
            {
                name: MicroCommandName.PowerShellCloseExcelFile,
            },
        ],
    };
    const response = await request.post("/run-micro-commands", { data: microCommandBody });
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    const message = JSON.parse(body);
    expect(message.results).toHaveLength(microCommandBody.commands.length);
    for (const result of message.results) {
        expect(result.success).toBeTruthy();
    }
});

test("Run Micro Commands - Open, Eval, SaveAs, Close", async ({ request }) => {
    const code = readFileSync(defaultCodeFilePath, "utf-8");
    const microCommandBody: MicroCommandBody = {
        commands: [
            {
                name: MicroCommandName.ForceCloseExcel,
            },
            {
                name: MicroCommandName.OpenExcelFile,
                parameters: {
                    filePath: defaultFilePath,
                },
            },
            {
                name: MicroCommandName.AddinEval,
                parameters: {
                    code,
                },
            },
            {
                name: MicroCommandName.PowerShellSaveActiveWorkbookAs,
                parameters: {
                    filePath: defaultFileOutPath,
                },
            },
            {
                name: MicroCommandName.CloseExcelFile,
                parameters: {
                    filePath: defaultFilePath,
                },
            },
        ],
    };

    const response = await request.post("/run-micro-commands", {
        data: microCommandBody,
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    const message = JSON.parse(body) as { results: { success: boolean }[] };

    // Check each command for success
    message.results.forEach((value, index) => {
        const joined = {
            result: value,
            command: microCommandBody.commands[index],
        };
        expect(joined).toEqual(
            expect.objectContaining({
                result: expect.objectContaining({
                    success: true,
                }),
            }),
        );
    });

    // Every command has a result
    expect(message.results).toHaveLength(microCommandBody.commands.length);
    for (const result of message.results) {
        expect(result.success).toBeTruthy();
    }
});
