import { APIRequestContext, expect, test } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync, unlinkSync } from "node:fs";
import * as path from "node:path";
import {
    MicroCommand,
    MicroCommandAddinEvalResult,
    MicroCommandBody,
    MicroCommandBodyResult,
    MicroCommandMetadataNodeVersionResult,
    MicroCommandMetadataServerVersionResult,
    MicroCommandName,
    MicroCommandReadFileContentsResult,
} from "../src/server/handlers/microCommand/MicroCommand";
import packageJson from "../package.json";

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

const defaultCodeFileDirectory = path
    .normalize(path.join(rootDirectory, "test", "data"))
    .replace(/\\/g, "/");

const defaultPathOutDirectory = path
    .normalize(path.join(rootDirectory, "test", "out"))
    .replace(/\\/g, "/");

const defaultFileOutPath = path
    .normalize(path.join(defaultPathOutDirectory, "test-out.xlsx"))
    .replace(/\\/g, "/");

function getCodeFile(fileName: string) {
    return path.normalize(path.join(defaultCodeFileDirectory, fileName)).replace(/\\/g, "/");
}

const defaultCodeFilePath = getCodeFile("hello-world-excel.js");

const defaultLogFileDirectory = defaultPathOutDirectory;

function getDefaultLogFilePath(fileName: string = "micro-command.log") {
    const logFilePath = path
        .normalize(path.join(defaultLogFileDirectory, fileName))
        .replace(/\\/g, "/");
    if (existsSync(logFilePath)) {
        unlinkSync(logFilePath);
    }
    return logFilePath;
}

function cleanOutDirectory() {
    if (existsSync(defaultFileOutPath)) {
        unlinkSync(defaultFileOutPath);
    }
    mkdirSync(defaultPathOutDirectory, { recursive: true });
}

async function runMicroCommandsBase(
    request: APIRequestContext,
    commands: unknown[],
): Promise<MicroCommandBodyResult> {
    const response = await request.post("/run-micro-commands", {
        data: { commands },
    });
    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    const message = JSON.parse(body) as MicroCommandBodyResult;
    return message;
}

async function runMicroCommands(
    request: APIRequestContext,
    commands: MicroCommand[],
): Promise<MicroCommandBodyResult> {
    const message = await runMicroCommandsBase(request, commands);
    expect(message.success).toBe(true);
    expect(message.results).toHaveLength(commands.length);
    for (const result of message.results) {
        expect(result.success).toBe(true);
    }

    return message;
}

test("Run Micro Command - Console", async ({ request }) => {
    await runMicroCommands(request, [
        {
            name: MicroCommandName.Console,
            parameters: {
                message: "Hello, World!",
            },
        },
    ]);
});

test("Run Micro Commands - StartLog and EndLog", async ({ request }) => {
    const logFilePath = getDefaultLogFilePath();

    await runMicroCommands(request, [
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
    ]);

    const logFile = readFileSync(logFilePath, "utf-8");
    expect(logFile).toContain("Hello from the log file!");
});

test("Run Micro Commands - StartConsole and EndConsole", async ({ request }) => {
    const logFilePath = getDefaultLogFilePath("micro-command-console.log");
    const message = "Hello while console output is disabled!";

    await runMicroCommands(request, [
        {
            name: MicroCommandName.EndConsole,
        },
        {
            name: MicroCommandName.StartLog,
            parameters: {
                filePath: logFilePath,
            },
        },
        {
            name: MicroCommandName.Console,
            parameters: {
                message,
            },
        },
        {
            name: MicroCommandName.EndLog,
        },
        {
            name: MicroCommandName.StartConsole,
        },
    ]);

    const logFile = readFileSync(logFilePath, "utf-8");
    expect(logFile).toContain(message);
});

test("Run Micro Command - Open Excel File", async ({ request }) => {
    await runMicroCommands(request, [
        {
            name: MicroCommandName.OpenExcelFile,
            parameters: {
                filePath: defaultFilePath,
            },
        },
    ]);
});

test("Run Micro Command - Eval", async ({ request }) => {
    const code = readFileSync(defaultCodeFilePath, "utf-8");
    await runMicroCommands(request, [
        {
            name: MicroCommandName.AddinEval,
            parameters: {
                code,
            },
        },
    ]);
});

test("Run Micro Command - Save Excel File", async ({ request }) => {
    await runMicroCommands(request, [
        {
            name: MicroCommandName.SaveExcelFile,
            parameters: {
                filePath: defaultFileOutPath,
            },
        },
    ]);
});

test("Run Micro Command - Close Excel File", async ({ request }) => {
    await runMicroCommands(request, [
        {
            name: MicroCommandName.CloseExcelFile,
            parameters: {
                filePath: defaultFilePath,
            },
        },
    ]);
});

test("Run Micro Commands - Open, Eval, Save, Close", async ({ request }) => {
    cleanOutDirectory();
    const code = readFileSync(defaultCodeFilePath, "utf-8");
    await runMicroCommands(request, [
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
    ]);
});

test("Run Micro Commands - Open, Eval, Save, Close (PowerShell)", async ({ request }) => {
    cleanOutDirectory();
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
                name: MicroCommandName.PowerShellSaveActiveWorkbookAs,
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
    await runMicroCommands(request, microCommandBody.commands);
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
    await runMicroCommands(request, microCommandBody.commands);
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
    await runMicroCommands(request, microCommandBody.commands);
}

async function runStandardEval(request: APIRequestContext, code: string) {
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
    cleanOutDirectory();
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

    const message = await runMicroCommands(request, microCommandBody.commands);

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

    console.log(JSON.stringify(message));
});

test("Run Micro Command - ReadFileContents", async ({ request }) => {
    cleanOutDirectory();
    const filePath = getCodeFile("hello-world.js");
    const expectedContents = readFileSync(filePath, "utf-8");
    const message = await runMicroCommands(request, [
        {
            name: MicroCommandName.ReadFileContents,
            parameters: { filePath },
        },
    ]);
    const result = message.results[0] as MicroCommandReadFileContentsResult;
    expect(result.values.contents).toBe(expectedContents);
});

test("Run Micro Command - MetadataNodeVersion", async ({ request }) => {
    const message = await runMicroCommands(request, [
        {
            name: MicroCommandName.MetadataNodeVersion,
        },
    ]);
    const result = message.results[0] as MicroCommandMetadataNodeVersionResult;
    expect(result.values.version).toBe(process.versions.node);
});

test("Run Micro Command - MetadataServerVersion", async ({ request }) => {
    const message = await runMicroCommands(request, [
        {
            name: MicroCommandName.MetadataServerVersion,
        },
    ]);
    const result = message.results[0] as MicroCommandMetadataServerVersionResult;
    expect(result.values.version).toBe(packageJson.version);
});

test("Run Micro Commands - reports aggregate failure", async ({ request }) => {
    const message = await runMicroCommandsBase(request, [
        {
            name: "UnknownCommand",
        },
    ]);

    expect(message.success).toBe(false);
    expect(message.results).toHaveLength(1);
    expect(message.results[0].success).toBe(false);
});

test("Run Standard Eval - invalid.js", async ({ request }) => {
    const code = `console.log("Syntax Error");
function test() {
    console.log("This is a test function")
`;
    await runStandardOpen(request);
    const result = await runStandardEval(request, code);
    await runStandardClose(request);
    const jsonBody = await result.text();
    console.log(jsonBody);
    const json = JSON.parse(jsonBody) as MicroCommandBodyResult;
    const evalResult = json.results[0] as MicroCommandAddinEvalResult;
    expect(evalResult.values.error).toContain("Invalid regular expression flags");
});
