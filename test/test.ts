import { APIRequestContext, expect, test } from "@playwright/test";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import * as path from "node:path";
import {
    MicroCommandAddinEvalResult,
    MicroCommandBody,
    MicroCommandBodyResult,
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

const defaultCodeFileDirectory = path
    .normalize(path.join(rootDirectory, "test", "data"))
    .replace(/\\/g, "/");

function getCodeFile(fileName: string) {
    return path.normalize(path.join(defaultCodeFileDirectory, fileName)).replace(/\\/g, "/");
}

const defaultCodeFilePath = getCodeFile("hello-world-excel.js");

const defaultLogFileDirectory = path
    .normalize(path.join(rootDirectory, "test"))
    .replace(/\\/g, "/");

function getDefaultLogFilePath(fileName: string = "micro-command.log") {
    const logFilePath = path
        .normalize(path.join(defaultLogFileDirectory, fileName))
        .replace(/\\/g, "/");
    if (existsSync(logFilePath)) {
        unlinkSync(logFilePath);
    }
    return logFilePath;
}

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

test("Run Micro Commands - StartLog and EndLog", async ({ request }) => {
    const logFilePath = getDefaultLogFilePath();

    const response = await request.post("/run-micro-commands", {
        data: {
            commands: [
                {
                    name: MicroCommandName.StartLog,
                    parameters: {
                        filePath: logFilePath,
                    },
                },
                {
                    name: MicroCommandName.Console,
                    parameters: {
                        message: "Hello from the log file!",
                    },
                },
                {
                    name: MicroCommandName.EndLog,
                },
            ],
        },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    const message = JSON.parse(body);
    expect(message.results).toHaveLength(3);
    for (const result of message.results) {
        expect(result.success).toBeTruthy();
    }

    const logFile = readFileSync(defaultLogFilePath, "utf-8");
    expect(logFile).toContain("Hello from the log file!");
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
    const logFilePath = getDefaultLogFilePath();
    const code = readFileSync(defaultCodeFilePath, "utf-8");

    const microCommandBody: MicroCommandBody = {
        commands: [
            {
                name: MicroCommandName.StartLog,
                parameters: {
                    filePath: logFilePath,
                },
            },
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
            {
                name: MicroCommandName.EndLog,
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

async function runStandardOpen(request: APIRequestContext) {
    const logFilePath = getDefaultLogFilePath("micro-command-open.log");
    const microCommandBody: MicroCommandBody = {
        commands: [
            {
                name: MicroCommandName.StartLog,
                parameters: {
                    filePath: logFilePath,
                },
            },
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
                name: MicroCommandName.EndLog,
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
}

async function runStandardClose(request: APIRequestContext) {
    const logFilePath = getDefaultLogFilePath("micro-command-close.log");
    const microCommandBody: MicroCommandBody = {
        commands: [
            {
                name: MicroCommandName.StartLog,
                parameters: {
                    filePath: logFilePath,
                },
            },
            {
                name: MicroCommandName.SaveExcelFile,
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
            {
                name: MicroCommandName.EndLog,
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
}

async function runStandardEval(request: APIRequestContext, code: string) {
    const logFilePath = getDefaultLogFilePath();
    const microCommandBody: MicroCommandBody = {
        commands: [
            {
                name: MicroCommandName.AddinEval,
                parameters: {
                    code,
                },
            },
        ],
    };

    const response = await request.post("/run-micro-commands", {
        data: microCommandBody,
    });

    return response;
}

test("Run Micro Commands - Open, Eval, SaveAs, Close", async ({ request }) => {
    const logFilePath = getDefaultLogFilePath();
    const code = readFileSync(defaultCodeFilePath, "utf-8");
    const microCommandBody: MicroCommandBody = {
        commands: [
            {
                name: MicroCommandName.StartLog,
                parameters: {
                    filePath: logFilePath,
                },
            },
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
            {
                name: MicroCommandName.EndLog,
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

    console.log(body);
});

test("Run Standard Eval - invalid.js", async ({ request }) => {
    const code = getCodeFile("invalid.js");
    await runStandardOpen(request);
    const result = await runStandardEval(request, code);
    await runStandardClose(request);
    const jsonBody = await result.text();
    console.log(jsonBody);
    const json = JSON.parse(jsonBody) as MicroCommandBodyResult;
    const evalResult = json.results[0] as MicroCommandAddinEvalResult;
    expect(evalResult.values.error).toContain("Invalid regular expression flags");
});
