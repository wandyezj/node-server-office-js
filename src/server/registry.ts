import { getMatcher } from "./getMatcher";
import { FunctionRequestMatcher, FunctionRequestHandler } from "./handleRequest";
import { closeExcelFile } from "./handlers/closeExcelFile";
import { addinEval } from "./handlers/addinEval";
import { getServeFile } from "./handlers/getServeFile";
import { openExcelFile } from "./handlers/openExcelFile";
import { addinPing } from "./handlers/addinPing";
import { saveExcelFile } from "./handlers/saveExcelFile";
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
    [getMatcher({ method: "POST", url: "/open-excel-file" }), openExcelFile],
    [getMatcher({ method: "POST", url: "/close-excel-file" }), closeExcelFile],
    [getMatcher({ method: "POST", url: "/save-excel-file" }), saveExcelFile],

    // Addin Files
    getFile("taskpane.html", "text/html"),
    getFile("icon-16.png", "image/png"),
    getFile("icon-32.png", "image/png"),
    getFile("icon-80.png", "image/png"),

    // Addin Websocket Operations
    [getMatcher({ method: "POST", url: "/addin-ping" }), addinPing],
    [getMatcher({ method: "POST", url: "/addin-eval" }), addinEval],

    // Micro Command
    [getMatcher({ method: "POST", url: "/run-micro-commands" }), runMicroCommands],
];
