import { APIRequestContext, expect, test } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync, unlinkSync } from "node:fs";
import * as net from "node:net";
import * as path from "node:path";
import { WebSocket } from "ws";
import {
    MicroCommand,
    MicroCommandAddinEvalResult,
    MicroCommandBody,
    MicroCommandBodyResult,
    MicroCommandMetadataNodeVersionResult,
    MicroCommandMetadataServerVersionResult,
    MicroCommandName,
    MicroCommandReadFileContentsResult,
    MicroCommandResult,
    MicroCommandResultWithMetadata,
    MicroCommandWebsocketServerTakeMessagesResult,
} from "../src/server/handlers/microCommand/MicroCommand";
import packageJson from "../package.json";
import assert from "node:assert";

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

function getCodeFromFile(filePath: string) {
    return readFileSync(getCodeFile(filePath), "utf-8");
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

function getResultByCommandId(message: MicroCommandBodyResult, id: string): MicroCommandResult {
    const result = message.results.find((r) => r.id === id);
    if (!result) {
        throw new Error(`No result found for command ID: ${id}`);
    }
    return result;
}

async function getAvailablePort(): Promise<number> {
    const server = net.createServer();
    const listening = Promise.withResolvers<void>();
    server.listen(0, listening.resolve);
    await listening.promise;
    const address = server.address();
    const closed = Promise.withResolvers<void>();
    server.close((error) => {
        if (error) {
            closed.reject(error);
            return;
        }
        closed.resolve();
    });
    await closed.promise;

    if (!address || typeof address === "string") {
        throw new Error("Failed to find an available port.");
    }

    return address.port;
}

function connectWebsocket(
    port: number,
    timeoutMs: number = 5000,
): Promise<{
    socket: WebSocket;
    receivedMessage: Promise<string>;
}> {
    const deadline = Date.now() + timeoutMs;
    const connection = Promise.withResolvers<{
        socket: WebSocket;
        receivedMessage: Promise<string>;
    }>();

    function attemptConnection(): void {
        const socket = new WebSocket(`ws://127.0.0.1:${port}`);
        const receivedMessage = Promise.withResolvers<string>();
        const retryTimeoutMs = 25;

        socket.once("message", (data) => receivedMessage.resolve(`${data}`));
        socket.once("open", () => {
            socket.off("error", handleConnectionError);
            socket.once("error", receivedMessage.reject);
            connection.resolve({ socket, receivedMessage: receivedMessage.promise });
        });

        function handleConnectionError(error: Error): void {
            socket.close();
            if (Date.now() >= deadline) {
                connection.reject(error);
                return;
            }
            setTimeout(attemptConnection, retryTimeoutMs);
        }

        socket.once("error", handleConnectionError);
    }

    attemptConnection();
    return connection.promise;
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

test("Run Micro Commands - Eval return value", async ({ request }) => {
    cleanOutDirectory();
    const logFilePath = getDefaultLogFilePath();

    const code1Id = "code1";
    const code2Id = "code2";
    const code1 = getCodeFromFile("excel-set-a1.js");
    const code2 = getCodeFromFile("excel-get-a1.js");

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
                id: code1Id,
                name: MicroCommandName.AddinEval,
                parameters: {
                    code: code1,
                },
            },
            {
                id: code2Id,
                name: MicroCommandName.AddinEval,
                parameters: {
                    code: code2,
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

    const code1Result = getResultByCommandId(message, code1Id) as MicroCommandAddinEvalResult;
    const code2Result = getResultByCommandId(message, code2Id) as MicroCommandAddinEvalResult;

    const code1ResultValue = code1Result.values.result;
    const code2ResultValue = code2Result.values.result;

    expect(code1Result.values.error).toBe(undefined);
    expect(code2Result.values.error).toBe(undefined);

    expect(code1ResultValue).toBe(undefined);
    expect(code2ResultValue).toBe(5);

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

test("Run Micro Commands - Websocket", async ({ request }) => {
    const port = await getAvailablePort();
    let socket: WebSocket | undefined;

    try {
        const microCommands = runMicroCommands(request, [
            {
                name: MicroCommandName.WebsocketServerOpen,
                parameters: { port },
            },
            {
                name: MicroCommandName.WebsocketServerAwaitConnection,
                parameters: { port, timeoutMs: 5000 },
            },
            {
                name: MicroCommandName.WebsocketServerSendMessage,
                parameters: { port, message: "hello client" },
            },
            {
                name: MicroCommandName.WebsocketServerAwaitMessage,
                parameters: { port, timeoutMs: 5000 },
            },
            {
                name: MicroCommandName.WebsocketServerTakeMessages,
                parameters: { port },
            },
            {
                name: MicroCommandName.WebsocketServerClose,
                parameters: { port },
            },
        ]);

        const connection = await connectWebsocket(port);
        socket = connection.socket;

        expect(await connection.receivedMessage).toBe("hello client");
        socket.send("hello server");

        const message = await microCommands;

        const takeResult = message.results[4] as MicroCommandWebsocketServerTakeMessagesResult;
        expect(takeResult.values.messages).toEqual(["hello server"]);
    } finally {
        socket?.close();
    }
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

function getErrorObject(evalResult: MicroCommandAddinEvalResult): {
    name: string;
    message: string;
    stack: string;
} {
    const error = evalResult.values.error;
    expect(typeof error).toBe("string");
    assert(typeof error === "string");
    const errorObject = JSON.parse(error);
    return errorObject;
}
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
    const errorObject = getErrorObject(evalResult);
    expect(errorObject.name).toBe("SyntaxError");
    expect(errorObject.message).toBe("Unexpected end of input");
    expect(errorObject.stack).toBeDefined();
});

test("Run Standard Eval - invalid.js 2", async ({ request }) => {
    const code = `
(async () => {
    throw new Error("Test error");
})();
`;
    await runStandardOpen(request);
    const result = await runStandardEval(request, code);
    await runStandardClose(request);
    const jsonBody = await result.text();
    console.log(jsonBody);
    const json = JSON.parse(jsonBody) as MicroCommandBodyResult;
    const evalResult = json.results[0] as MicroCommandAddinEvalResult;
    expect(evalResult.values.error).toBeDefined();
    assert(typeof evalResult.values.error === "string");
    const errorObject = JSON.parse(evalResult.values.error);
    expect(errorObject.name).toBe("Error");
    expect(errorObject.message).toBe("Test error");
    expect(errorObject.stack).toBeDefined();
});

test("Run Standard Eval - return object", async ({ request }) => {
    const filePath = getCodeFile("return-object.js");
    const code = readFileSync(filePath, "utf-8");

    await runStandardOpen(request);
    const result = await runStandardEval(request, code);
    await runStandardClose(request);
    const jsonBody = await result.text();
    console.log(jsonBody);
    const json = JSON.parse(jsonBody) as MicroCommandBodyResult;
    const evalResult = json.results[0] as MicroCommandAddinEvalResult;
    expect(evalResult.values.error).toBeUndefined();
    expect(evalResult.values.result).toBeDefined();

    // Check result
    const resultObject = JSON.parse(evalResult.values.result);
    expect(resultObject.keyString).toBe("value");
    expect(resultObject.keyNumber).toBe(2);
    expect(resultObject.keyObject).toBeDefined();
    expect(resultObject.keyObject.nestedKey).toBe("nestedValue");
});
