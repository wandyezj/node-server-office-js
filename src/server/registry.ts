import { getMatcher } from "./getMatcher";
import { FunctionRequestMatcher, FunctionRequestHandler } from "./handleRequest";
import { getServeFile } from "./handlers/getServeFile";
import { runMicroCommands } from "./handlers/runMicroCommands";

export function getFile(
    filePath: string,
    contentType: string,
): [FunctionRequestMatcher, FunctionRequestHandler] {
    return [
        getMatcher({ method: "GET", url: `/${filePath}` }),
        getServeFile(filePath, contentType),
    ];
}

export const registry: [FunctionRequestMatcher, FunctionRequestHandler][] = [
    [
        // Connectivity check
        getMatcher({ method: "GET", url: "/" }),
        async (request, response) => {
            response.writeHead(200, { "Content-Type": "text/plain" });
            response.write("");
            response.end();
        },
    ],
    [
        // Ping
        getMatcher({ method: "GET", url: "/ping" }),
        async (request, response) => {
            response.writeHead(200, { "Content-Type": "text/plain" });
            response.write("pong");
            response.end();
        },
    ],
    // Excel file operations (some use websockets)

    // Addin Files
    getFile("taskpane.html", "text/html"),
    getFile("icon-16.png", "image/png"),
    getFile("icon-32.png", "image/png"),
    getFile("icon-80.png", "image/png"),

    // Addin Websocket Operations

    // Micro Command
    [getMatcher({ method: "POST", url: "/run-micro-commands" }), runMicroCommands],
];
