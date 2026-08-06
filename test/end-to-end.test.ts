import test, { expect } from "@playwright/test";
import { WebSocket } from "ws";
import {
    MicroCommandName,
    OfficeAppName,
    MicroCommandWebsocketServerTakeMessagesResult,
    MicroCommand,
} from "../src/server/handlers/microCommand/MicroCommand";
import { getAvailablePort } from "./util/getAvailablePort";
import { connectWebsocket } from "./util/connectWebsocket";
import { runMicroCommands } from "./util/runMicroCommands";
import {
    defaultFilePath,
    defaultFileTempPath,
    defaultFileOutPath,
    cleanOutDirectory,
} from "./util/helpers";
import { getResultByCommandId } from "./util/getResultByCommandId";

test("Run Micro Commands - Websocket Add-In", async ({ request }) => {
    cleanOutDirectory();
    const port = await getAvailablePort();

    const pingMessage = JSON.stringify({
        type: "Ping",
        source: "Client",
        sequence: 1,
        message: "Ping from client",
    });

    const commands: MicroCommand[] = [
        // {
        //     name: MicroCommandName.Debugger,
        //     id: "debugger",
        // },
        {
            name: MicroCommandName.WebsocketServerOpen,
            id: "websocket-server-open",
            parameters: { port },
        },
        // Embed Add In
        {
            name: MicroCommandName.OfficeDocumentEmbedAddIn,
            id: "office-document-embed-addin",
            parameters: {
                filePathIn: defaultFilePath,
                filePathOut: defaultFileTempPath,
                settings: { port },
            },
        },
        // Open the file
        {
            name: MicroCommandName.OfficeDocumentOpen,
            id: "office-document-open",
            parameters: {
                app: OfficeAppName.Excel,
                filePath: defaultFileTempPath,
            },
        },
        {
            name: MicroCommandName.WebsocketServerAwaitConnection,
            id: "websocket-server-await-connection",
            parameters: { port, timeoutMs: 30000 },
        },

        // Webserver ready
        {
            name: MicroCommandName.WebsocketServerAwaitMessage,
            id: "websocket-server-await-message-ready",
            parameters: { port, timeoutMs: 5000 },
        },
        {
            name: MicroCommandName.WebsocketServerTakeMessages,
            id: "websocket-server-take-messages-ready",
            parameters: { port },
        },

        // Do the actual commands
        {
            name: MicroCommandName.WebsocketServerSendMessage,
            id: "websocket-server-send-message-hello-client",
            parameters: { port, message: pingMessage },
        },
        {
            name: MicroCommandName.WebsocketServerAwaitMessage,
            id: "websocket-server-await-message",
            parameters: { port, timeoutMs: 5000 },
        },
        {
            name: MicroCommandName.WebsocketServerTakeMessages,
            id: "websocket-server-take-messages",
            parameters: { port },
        },

        // Extract Add In
        {
            name: MicroCommandName.OfficeDocumentExtractAddIn,
            id: "office-document-extract-addin",
            parameters: {
                filePathIn: defaultFileTempPath,
                filePathOut: defaultFileOutPath,
            },
        },
        {
            name: MicroCommandName.WebsocketServerClose,
            id: "websocket-server-close",
            parameters: { port },
        },
        {
            name: MicroCommandName.OfficeDocumentClose,
            id: "office-document-close",
            parameters: {
                app: OfficeAppName.Excel,
                filePath: defaultFileTempPath,
            },
        },
    ];

    try {
        const microCommands = runMicroCommands(request, commands);

        const message = await microCommands;

        const takeResult = getResultByCommandId(
            message,
            "websocket-server-take-messages",
        ) as MicroCommandWebsocketServerTakeMessagesResult;

        expect(takeResult.values.messages).toEqual([
            JSON.stringify({
                type: "PingResult",
                message: "Pong",
                source: "Client",
                sequence: 1,
            }),
        ]);
    } finally {
    }
});
